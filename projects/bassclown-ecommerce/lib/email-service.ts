import { resend } from '@/lib/services-init';
import { db, users, userSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Email templates
const getEmailTemplate = (type: string, data: any) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bassclownco.com';
  const logoUrl = `https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/logo-title.png`;
  
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c62828; padding-bottom: 20px;">
          <img src="${logoUrl}" alt="Bass Clown Co" style="max-width: 200px; height: auto;">
        </div>
  `;
  
  const baseFooter = `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            You're receiving this email because you have an account with Bass Clown Co.
          </p>
          <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
            <a href="${baseUrl}/dashboard/settings" style="color: #c62828; text-decoration: none;">Manage your email preferences</a>
          </p>
        </div>
      </div>
    </div>
  `;

  switch (type) {
    case 'contest_application_accepted':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">🎉 Your Contest Application Was Accepted!</h2>
        <p>Great news! Your application for the contest "<strong>${data.contestTitle}</strong>" has been accepted.</p>
        <p>You can now submit your entry. Here are the details:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Contest:</strong> ${data.contestTitle}</p>
          <p><strong>Submission Deadline:</strong> ${new Date(data.deadline).toLocaleDateString()}</p>
          <p><strong>Prize:</strong> ${data.prize}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/contests/${data.contestId}/submit" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Submit Your Entry
          </a>
        </div>
        <p>Good luck with your submission!</p>
        ${baseFooter}
      `;

    case 'contest_submission_received':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">✅ Submission Received!</h2>
        <p>We've successfully received your submission for the contest "<strong>${data.contestTitle}</strong>".</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Contest:</strong> ${data.contestTitle}</p>
          <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleDateString()}</p>
          <p><strong>Submission Title:</strong> ${data.submissionTitle}</p>
        </div>
        <p>Your submission is now being reviewed by the judges. We'll notify you once judging is complete.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/contests/${data.contestId}" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Contest
          </a>
        </div>
        ${baseFooter}
      `;

    case 'contest_winner':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">🏆 Congratulations! You Won!</h2>
        <p>Amazing news! You've won the contest "<strong>${data.contestTitle}</strong>"!</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Contest:</strong> ${data.contestTitle}</p>
          <p><strong>Prize:</strong> ${data.prize}</p>
          <p><strong>Your Score:</strong> ${data.score}/100</p>
        </div>
        <p>We'll be in touch soon with details about claiming your prize. Keep an eye on your inbox!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/contests/${data.contestId}" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Contest Results
          </a>
        </div>
        ${baseFooter}
      `;

    case 'giveaway_winner':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">🎁 You Won a Giveaway!</h2>
        <p>Congratulations! You've won the giveaway "<strong>${data.giveawayTitle}</strong>"!</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p><strong>Giveaway:</strong> ${data.giveawayTitle}</p>
          <p><strong>Prize:</strong> ${data.prize}</p>
          <p><strong>Your Entry Number:</strong> ${data.entryNumber}</p>
        </div>
        <p>Please respond to this email within 7 days to claim your prize. Include your full name and mailing address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/giveaways/${data.giveawayId}" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Giveaway
          </a>
        </div>
        ${baseFooter}
      `;

    case 'points_awarded':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">⚡ Points Awarded!</h2>
        <p>You've earned <strong>${data.points} points</strong> for your activity on Bass Clown Co!</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p><strong>Points Earned:</strong> ${data.points}</p>
          <p><strong>New Balance:</strong> ${data.newBalance} points</p>
        </div>
        <p>Use your points to enter premium contests and giveaways!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard/points" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Points Balance
          </a>
        </div>
        ${baseFooter}
      `;

    case 'subscription_welcome':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">🚀 Welcome to ${data.planName}!</h2>
        <p>Thank you for upgrading to our <strong>${data.planName}</strong> plan! You now have access to premium features.</p>
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
          <p><strong>Plan:</strong> ${data.planName}</p>
          <p><strong>Monthly Points:</strong> ${data.monthlyPoints}</p>
          <p><strong>Next Billing:</strong> ${new Date(data.nextBilling).toLocaleDateString()}</p>
        </div>
        <p>Your premium features are now active. Start exploring exclusive contests and opportunities!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Explore Premium Features
          </a>
        </div>
        ${baseFooter}
      `;

    case 'contest_reminder':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">⏰ Contest Deadline Reminder</h2>
        <p>Don't miss out! The contest "<strong>${data.contestTitle}</strong>" deadline is approaching.</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Contest:</strong> ${data.contestTitle}</p>
          <p><strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString()}</p>
          <p><strong>Time Remaining:</strong> ${data.timeRemaining}</p>
        </div>
        <p>Make sure to submit your entry before the deadline!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/contests/${data.contestId}" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Submit Your Entry
          </a>
        </div>
        ${baseFooter}
      `;

    case 'new_contest_available':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">🎯 New Contest Available!</h2>
        <p>A new contest has been launched that matches your interests!</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Contest:</strong> ${data.contestTitle}</p>
          <p><strong>Prize:</strong> ${data.prize}</p>
          <p><strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString()}</p>
          <p><strong>Category:</strong> ${data.category}</p>
        </div>
        <p>Don't miss this opportunity to showcase your skills!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/contests/${data.contestId}" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Contest
          </a>
        </div>
        ${baseFooter}
      `;

    case 'judge-assignment':
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">⚖️ You've Been Assigned as a Judge!</h2>
        <p>Hello ${data.judgeName || 'Judge'},</p>
        <p>You have been assigned as a judge for the contest "<strong>${data.contestTitle}</strong>".</p>
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
          <p><strong>Contest:</strong> ${data.contestTitle}</p>
          <p><strong>Your Role:</strong> Contest Judge</p>
          <p><strong>Responsibilities:</strong> Review and score submissions fairly and thoroughly</p>
        </div>
        <p>Please log in to your judge panel to review submissions and provide your scores.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/contests/${data.contestId}/judge" style="display: inline-block; padding: 15px 30px; background-color: #c62828; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Start Judging
          </a>
        </div>
        <p><em>Thank you for contributing to our community as a judge!</em></p>
        ${baseFooter}
      `;

    default:
      return `
        ${baseStyle}
        <h2 style="color: #c62828; text-align: center;">Bass Clown Co. Notification</h2>
        <p>${data.message}</p>
        ${baseFooter}
      `;
  }
};

// Email notification service
export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendNotification(userId: string, type: string, data: any) {
    try {
      // Get user details and settings
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error('User not found:', userId);
        return false;
      }

      // Get user email preferences
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      // Check if user has email notifications enabled
      if (settings && !settings.emailNotifications) {
        console.log('User has disabled email notifications:', userId);
        return false;
      }

      // Check specific notification preferences
      if (settings) {
        if (type.includes('contest') && !settings.contestUpdates) {
          console.log('User has disabled contest updates:', userId);
          return false;
        }
        if (type.includes('giveaway') && !settings.giveawayUpdates) {
          console.log('User has disabled giveaway updates:', userId);
          return false;
        }
      }

      // Get email subject based on type
      const subject = this.getEmailSubject(type, data);
      
             // Send email
       const { error } = await resend.emails.send({
         from: 'Bass Clown Co <noreply@bassclownco.com>',
         to: user.email,
         subject: subject,
         html: getEmailTemplate(type, { ...data, userName: user.name }),
         text: this.getPlainTextContent(type, data, user.name || 'User')
       });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      console.log(`Email sent successfully to ${user.email} for ${type}`);
      return true;

    } catch (error) {
      console.error('Error in sendNotification:', error);
      return false;
    }
  }

  private getEmailSubject(type: string, data: any): string {
    switch (type) {
      case 'contest_application_accepted':
        return `🎉 Your application for "${data.contestTitle}" was accepted!`;
      case 'contest_submission_received':
        return `✅ Submission received for "${data.contestTitle}"`;
      case 'contest_winner':
        return `🏆 Congratulations! You won "${data.contestTitle}"!`;
      case 'giveaway_winner':
        return `🎁 You won the "${data.giveawayTitle}" giveaway!`;
      case 'points_awarded':
        return `⚡ You earned ${data.points} points!`;
      case 'subscription_welcome':
        return `🚀 Welcome to ${data.planName}!`;
      case 'contest_reminder':
        return `⏰ Reminder: "${data.contestTitle}" deadline approaching`;
      case 'new_contest_available':
        return `🎯 New contest available: "${data.contestTitle}"`;
      case 'judge-assignment':
        return `⚖️ Judge Assignment: "${data.contestTitle}"`;
      default:
        return 'Bass Clown Co. Notification';
    }
  }

  private getPlainTextContent(type: string, data: any, userName: string): string {
    switch (type) {
      case 'contest_application_accepted':
        return `Hi ${userName},\n\nGreat news! Your application for "${data.contestTitle}" has been accepted.\n\nYou can now submit your entry before the deadline: ${new Date(data.deadline).toLocaleDateString()}\n\nPrize: ${data.prize}\n\nGood luck!\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'contest_submission_received':
        return `Hi ${userName},\n\nWe've received your submission for "${data.contestTitle}".\n\nSubmission: ${data.submissionTitle}\nSubmitted: ${new Date(data.submittedAt).toLocaleDateString()}\n\nYour submission is now being reviewed by the judges.\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'contest_winner':
        return `Hi ${userName},\n\nCongratulations! You've won "${data.contestTitle}"!\n\nPrize: ${data.prize}\nYour Score: ${data.score}/100\n\nWe'll be in touch soon with details about claiming your prize.\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'giveaway_winner':
        return `Hi ${userName},\n\nCongratulations! You've won the "${data.giveawayTitle}" giveaway!\n\nPrize: ${data.prize}\nYour Entry Number: ${data.entryNumber}\n\nPlease respond to this email within 7 days to claim your prize.\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'points_awarded':
        return `Hi ${userName},\n\nYou've earned ${data.points} points!\n\nReason: ${data.reason}\nNew Balance: ${data.newBalance} points\n\nUse your points to enter premium contests and giveaways!\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'subscription_welcome':
        return `Hi ${userName},\n\nWelcome to ${data.planName}!\n\nYour premium features are now active:\n- Monthly Points: ${data.monthlyPoints}\n- Next Billing: ${new Date(data.nextBilling).toLocaleDateString()}\n\nStart exploring exclusive contests and opportunities!\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'contest_reminder':
        return `Hi ${userName},\n\nReminder: The "${data.contestTitle}" deadline is approaching!\n\nDeadline: ${new Date(data.deadline).toLocaleDateString()}\nTime Remaining: ${data.timeRemaining}\n\nMake sure to submit your entry before the deadline!\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'new_contest_available':
        return `Hi ${userName},\n\nA new contest is available that matches your interests!\n\nContest: ${data.contestTitle}\nPrize: ${data.prize}\nDeadline: ${new Date(data.deadline).toLocaleDateString()}\nCategory: ${data.category}\n\nDon't miss this opportunity!\n\nBest regards,\nThe Bass Clown Co Team`;
      
      case 'judge-assignment':
        return `Hi ${userName},\n\nYou have been assigned as a judge for the contest "${data.contestTitle}".\n\nPlease log in to your judge panel to review submissions and provide your scores.\n\nThank you for contributing to our community as a judge!\n\nBest regards,\nThe Bass Clown Co Team`;
      
      default:
        return `Hi ${userName},\n\n${data.message}\n\nBest regards,\nThe Bass Clown Co Team`;
    }
  }

  // Bulk email methods
  async sendBulkNotifications(userIds: string[], type: string, data: any) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendNotification(userId, type, data))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    console.log(`Bulk email results: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  // Scheduled email methods
  async sendContestReminders() {
    // This would be called by a cron job
    // Get contests ending in 24 hours with participants who haven't submitted
    console.log('Sending contest deadline reminders...');
    // Implementation would query database for upcoming deadlines
  }

  async sendNewContestNotifications(contestId: string) {
    // Notify users about new contests based on their preferences
    console.log('Sending new contest notifications...');
    // Implementation would query users with matching interests
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance(); 