import { db, users } from './db';
import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, jsonb, varchar } from 'drizzle-orm/pg-core';

// Audit log table
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // user, contest, giveaway, payment, etc.
  resourceId: uuid('resource_id'),
  changes: jsonb('changes').$type<Record<string, any>>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: varchar('status', { length: 50 }).default('success'), // success, failure, pending
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow()
});

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'pending';
  errorMessage?: string;
}

export class AuditLogService {
  /**
   * Log an action
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO audit_log (
          user_id, action, resource_type, resource_id, changes, metadata,
          ip_address, user_agent, status, error_message, created_at
        ) VALUES (
          ${entry.userId || null},
          ${entry.action},
          ${entry.resourceType},
          ${entry.resourceId || null},
          ${entry.changes ? JSON.stringify(entry.changes) : null}::jsonb,
          ${entry.metadata ? JSON.stringify(entry.metadata) : null}::jsonb,
          ${entry.ipAddress || null},
          ${entry.userAgent || null},
          ${entry.status || 'success'},
          ${entry.errorMessage || null},
          NOW()
        )
      `);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = sql`SELECT * FROM audit_log WHERE 1=1`;
      const params: any[] = [];

      if (filters?.userId) {
        query = sql`${query} AND user_id = ${filters.userId}`;
      }

      if (filters?.action) {
        query = sql`${query} AND action = ${filters.action}`;
      }

      if (filters?.resourceType) {
        query = sql`${query} AND resource_type = ${filters.resourceType}`;
      }

      if (filters?.resourceId) {
        query = sql`${query} AND resource_id = ${filters.resourceId}`;
      }

      if (filters?.startDate) {
        query = sql`${query} AND created_at >= ${filters.startDate}`;
      }

      if (filters?.endDate) {
        query = sql`${query} AND created_at <= ${filters.endDate}`;
      }

      query = sql`${query} ORDER BY created_at DESC`;

      if (filters?.limit) {
        query = sql`${query} LIMIT ${filters.limit}`;
      }

      if (filters?.offset) {
        query = sql`${query} OFFSET ${filters.offset}`;
      }

      const result = await db.execute(query);
      return result.rows;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(period?: { startDate: Date; endDate: Date }) {
    try {
      let query = sql`
        SELECT 
          action,
          resource_type,
          status,
          COUNT(*) as count
        FROM audit_log
        WHERE 1=1
      `;

      if (period?.startDate) {
        query = sql`${query} AND created_at >= ${period.startDate}`;
      }

      if (period?.endDate) {
        query = sql`${query} AND created_at <= ${period.endDate}`;
      }

      query = sql`${query} GROUP BY action, resource_type, status`;

      const result = await db.execute(query);
      return result.rows;
    } catch (error) {
      console.error('Failed to get audit log statistics:', error);
      return [];
    }
  }
}

export const auditLogService = new AuditLogService();

