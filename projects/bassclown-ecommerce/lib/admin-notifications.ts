import { db, users, notifications, contests, giveaways, contestSubmissions, giveawayEntries, w9Forms } from '@/lib/db';
import { eq, and, gte, lte, desc, count, inArray } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data: any;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type AdminNotificationType = 
  | 'user_signup'
  | 'contest_created'
  | 'contest_deadline_approaching'
  | 'contest_completed'
  | 'high_value_submission'
  | 'payment_issue'
  | 'w9_form_submitted'
  | 'content_flagged'
  | 'system_error'
  | 'security_alert'
  | 'performance_alert'
  | 'storage_limit_warning'
  | 'unusual_activity'
  | 'brand_application'
  | 'winner_selection_needed'
  | 'payout_required';

export interface NotificationRule {
  type: AdminNotificationType;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  conditions: Record<string, any>;
  recipients: string[]; // admin user IDs
  emailEnabled: boolean;
  throttleMinutes?: number; // prevent spam
}

export interface SystemMetrics {
  activeUsers: number;
  newSignups24h: number;
  activeContests: number;
  pendingSubmissions: number;
  pendingW9Forms: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  storageUsage: number;
  errorRate: number;
}

export class AdminNotificationService {
  private static instance: AdminNotificationService;
  private notificationRules: Map<AdminNotificationType, NotificationRule> = new Map();

  public static getInstance(): AdminNotificationService {
    if (!AdminNotificationService.instance) {
      AdminNotificationService.instance = new AdminNotificationService();
    }
    return AdminNotificationService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default notification rules
  private initializeDefaultRules(): void {
    const defaultRules: NotificationRule[] = [
      {
        type: 'user_signup',
        enabled: true,
        priority: 'low',
        conditions: {},
        recipients: [],
        emailEnabled: false
      },
      {
        type: 'contest_created',
        enabled: true,
        priority: 'medium',
        conditions: {},
        recipients: [],
        emailEnabled: true
      },
      {
        type: 'contest_deadline_approaching',
        enabled: true,
        priority: 'medium',
        conditions: { hoursRemaining: 24 },
        recipients: [],
        emailEnabled: true
      },
      {
        type: 'high_value_submission',
        enabled: true,
        priority: 'high',
        conditions: { prizeValue: 1000 },
        recipients: [],
        emailEnabled: true
      },
      {
        type: 'w9_form_submitted',
        enabled: true,
        priority: 'high',
        conditions: {},
        recipients: [],
        emailEnabled: true,
        throttleMinutes: 60
      },
      {
        type: 'security_alert',
        enabled: true,
        priority: 'urgent',
        conditions: {},
        recipients: [],
        emailEnabled: true
      },
      {
        type: 'system_error',
        enabled: true,
        priority: 'urgent',
        conditions: {},
        recipients: [],
        emailEnabled: true,
        throttleMinutes: 15
      },
      {
        type: 'winner_selection_needed',
        enabled: true,
        priority: 'high',
        conditions: {},
        recipients: [],
        emailEnabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.notificationRules.set(rule.type, rule);
    });
  }

  // Create admin notification
  async createNotification(
    type: AdminNotificationType,
    data: any,
    customMessage?: string
  ): Promise<string> {
    const rule = this.notificationRules.get(type);
    if (!rule?.enabled) return '';

    // Check throttling
    if (rule.throttleMinutes && await this.isThrottled(type, rule.throttleMinutes)) {
      return '';
    }

    const notification = await this.generateNotificationContent(type, data, customMessage);
    
    // Get all admin users to notify
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'bass-admin'));

    const recipientIds = rule.recipients.length > 0 ? rule.recipients : adminUsers.map(u => u.id);

    // Create notification for each admin user
    const notificationRecords = recipientIds.map(userId => ({
      userId,
      type: type,
      title: notification.title,
      message: notification.message,
      metadata: {
        priority: rule.priority,
        actionRequired: notification.actionRequired,
        actionUrl: notification.actionUrl,
        data
      },
      read: false
    }));

    const results = await db
      .insert(notifications)
      .values(notificationRecords)
      .returning({ id: notifications.id });

    const notificationId = results[0]?.id || '';

    // Send email notifications if enabled
    if (rule.emailEnabled && recipientIds.length > 0) {
      await this.sendEmailNotifications(recipientIds, notification);
    }

    return notificationId;
  }

  // Generate notification content based on type
  private async generateNotificationContent(
    type: AdminNotificationType,
    data: any,
    customMessage?: string
  ): Promise<{
    title: string;
    message: string;
    actionRequired: boolean;
    actionUrl?: string;
  }> {
    const rule = this.notificationRules.get(type);
    
    switch (type) {
      case 'user_signup':
        return {
          title: 'New User Registration',
          message: customMessage || `New user ${data.userName} (${data.userEmail}) has registered`,
          actionRequired: false,
          actionUrl: `/admin/users/${data.userId}`
        };

      case 'contest_created':
        return {
          title: 'New Contest Created',
          message: customMessage || `Contest "${data.contestTitle}" has been created by ${data.creatorName}`,
          actionRequired: false,
          actionUrl: `/admin/contests/${data.contestId}`
        };

      case 'contest_deadline_approaching':
        return {
          title: 'Contest Deadline Approaching',
          message: customMessage || `Contest "${data.contestTitle}" deadline is in ${data.hoursRemaining} hours`,
          actionRequired: false,
          actionUrl: `/admin/contests/${data.contestId}`
        };

      case 'high_value_submission':
        return {
          title: 'High-Value Contest Submission',
          message: customMessage || `High-value submission received for contest "${data.contestTitle}" (Prize: $${data.prizeValue})`,
          actionRequired: true,
          actionUrl: `/admin/contests/${data.contestId}/submissions`
        };

      case 'w9_form_submitted':
        return {
          title: 'W9 Form Requires Review',
          message: customMessage || `W9 form submitted by ${data.userName} requires admin review`,
          actionRequired: true,
          actionUrl: `/admin/w9-forms/${data.formId}`
        };

      case 'security_alert':
        return {
          title: 'Security Alert',
          message: customMessage || `Security alert: ${data.alertType} - ${data.description}`,
          actionRequired: true,
          actionUrl: `/admin/security`
        };

      case 'system_error':
        return {
          title: 'System Error Detected',
          message: customMessage || `System error: ${data.errorType} - ${data.message}`,
          actionRequired: true,
          actionUrl: `/admin/system-health`
        };

      case 'winner_selection_needed':
        return {
          title: 'Winner Selection Required',
          message: customMessage || `Contest "${data.contestTitle}" has ended and requires winner selection`,
          actionRequired: true,
          actionUrl: `/admin/contests/${data.contestId}/select-winner`
        };

      case 'performance_alert':
        return {
          title: 'Performance Alert',
          message: customMessage || `Performance issue detected: ${data.metric} is ${data.value}`,
          actionRequired: false,
          actionUrl: `/admin/analytics`
        };

      case 'storage_limit_warning':
        return {
          title: 'Storage Limit Warning',
          message: customMessage || `Storage usage is at ${data.percentage}% capacity`,
          actionRequired: false,
          actionUrl: `/admin/system-health`
        };

      default:
        return {
          title: 'Admin Notification',
          message: customMessage || 'An event requires admin attention',
          actionRequired: false
        };
    }
  }

  // Check if notification type is throttled
  private async isThrottled(type: AdminNotificationType, throttleMinutes: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - (throttleMinutes * 60 * 1000));
    
    const recentNotifications = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.type, type),
        gte(notifications.createdAt, cutoff)
      ));

    return (recentNotifications[0]?.count || 0) > 0;
  }

  // Send email notifications to specific recipients
  private async sendEmailNotifications(
    recipientIds: string[],
    notification: { title: string; message: string; actionUrl?: string }
  ): Promise<void> {
    for (const userId of recipientIds) {
      await emailService.sendNotification(userId, 'admin_notification', {
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl
      });
    }
  }

  // Notify all admin users
  private async notifyAllAdmins(
    notification: { title: string; message: string; actionUrl?: string }
  ): Promise<void> {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'bass-admin'));

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: 'admin_notification',
        title: notification.title,
        message: notification.message,
        metadata: {
          actionUrl: notification.actionUrl
        }
      });
    }
  }

  // Get admin notifications
  async getAdminNotifications(
    userId: string,
    filters: {
      unreadOnly?: boolean;
      priority?: string;
      type?: AdminNotificationType;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let conditions: any[] = [eq(notifications.userId, userId)];

    if (filters.unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    if (filters.type) {
      conditions.push(eq(notifications.type, filters.type));
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(filters.limit || 50);

    // Filter by priority from metadata if specified
    let filteredResults = results;
    if (filters.priority) {
      filteredResults = results.filter((notification: any) => {
        const metadata = notification.metadata as any;
        return metadata?.priority === filters.priority;
      });
    }

    return filteredResults.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || {},
      read: notification.read || false,
      createdAt: notification.createdAt
    }));
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Mark notification as resolved
  async markAsResolved(notificationId: string, resolvedBy: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        metadata: { resolvedAt: new Date(), resolvedBy }
      })
      .where(eq(notifications.id, notificationId));
  }

  // Get system metrics for dashboard
  async getSystemMetrics(): Promise<SystemMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get user metrics
    const totalUsers = await db.select({ count: count() }).from(users);
    const newSignups = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, yesterday));

    // Get contest metrics
    const activeContests = await db
      .select({ count: count() })
      .from(contests)
      .where(eq(contests.status, 'active'));

    // Get pending submissions
    const pendingSubmissions = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(eq(contestSubmissions.status, 'pending'));

    // Get pending W9 forms
    const pendingW9 = await db
      .select({ count: count() })
      .from(w9Forms)
      .where(eq(w9Forms.status, 'submitted'));

    return {
      activeUsers: totalUsers[0]?.count || 0,
      newSignups24h: newSignups[0]?.count || 0,
      activeContests: activeContests[0]?.count || 0,
      pendingSubmissions: pendingSubmissions[0]?.count || 0,
      pendingW9Forms: pendingW9[0]?.count || 0,
      systemHealth: 'healthy', // Would be calculated based on various factors
      storageUsage: 0, // Would be calculated from file storage
      errorRate: 0 // Would be calculated from error logs
    };
  }

  // Automated monitoring and notifications
  async runScheduledChecks(): Promise<void> {
    await Promise.all([
      this.checkContestDeadlines(),
      this.checkPendingW9Forms(),
      this.checkSystemHealth(),
      this.checkUnusualActivity()
    ]);
  }

  // Check for approaching contest deadlines
  private async checkContestDeadlines(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endingSoon = await db
      .select()
      .from(contests)
      .where(and(
        eq(contests.status, 'active'),
        lte(contests.endDate, tomorrow)
      ));

    for (const contest of endingSoon) {
      const hoursRemaining = Math.ceil((contest.endDate.getTime() - Date.now()) / (1000 * 60 * 60));
      
      await this.createNotification('contest_deadline_approaching', {
        contestId: contest.id,
        contestTitle: contest.title,
        hoursRemaining
      });
    }
  }

  // Check for pending W9 forms
  private async checkPendingW9Forms(): Promise<void> {
    const pendingForms = await db
      .select()
      .from(w9Forms)
      .where(eq(w9Forms.status, 'submitted'))
      .limit(10);

    for (const form of pendingForms) {
      const user = await db.select().from(users).where(eq(users.id, form.userId));
      
      await this.createNotification('w9_form_submitted', {
        formId: form.id,
        userName: user[0]?.name || 'Unknown User',
        submittedAt: form.submittedAt
      });
    }
  }

  // Check system health metrics
  private async checkSystemHealth(): Promise<void> {
    // This would implement actual health checks
    // For now, just a placeholder
    const metrics = await this.getSystemMetrics();
    
    if (metrics.pendingSubmissions > 100) {
      await this.createNotification('performance_alert', {
        metric: 'Pending Submissions',
        value: metrics.pendingSubmissions,
        threshold: 100
      });
    }
  }

  // Check for unusual activity patterns
  private async checkUnusualActivity(): Promise<void> {
    // This would implement anomaly detection
    // For now, just a placeholder for the framework
  }

  // Update notification rules
  async updateNotificationRule(
    type: AdminNotificationType,
    updates: Partial<NotificationRule>
  ): Promise<void> {
    const currentRule = this.notificationRules.get(type);
    if (currentRule) {
      const updatedRule = { ...currentRule, ...updates };
      this.notificationRules.set(type, updatedRule);
    }
  }

  // Get notification rules
  getNotificationRules(): Map<AdminNotificationType, NotificationRule> {
    return new Map(this.notificationRules);
  }

  // Bulk operations
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const unread = allNotifications.filter((n: any) => !(n.read === true)).length;
    
    const byPriority: Record<string, number> = {};
    const byType: Record<string, number> = {};

    allNotifications.forEach((notification: any) => {
      const metadata = notification.metadata as any;
      const priority = metadata?.priority || 'medium';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    return {
      total: allNotifications.length,
      unread,
      byPriority,
      byType
    };
  }
}

// Export singleton instance
export const adminNotificationService = AdminNotificationService.getInstance(); 