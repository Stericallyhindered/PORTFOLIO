import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { db, users, contests, contestApplications, contestSubmissions, giveaways, giveawayEntries, paymentHistory, pointsTransactions, notifications, fileUploads } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

// GET - Export user data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Gather all user data
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData) {
      return handleApiError(new Error('User not found'))
    }

    // Get contest applications
    const applications = await db
      .select()
      .from(contestApplications)
      .where(eq(contestApplications.userId, user.id))

    // Get contest submissions
    const submissions = await db
      .select()
      .from(contestSubmissions)
      .where(eq(contestSubmissions.userId, user.id))

    // Get giveaway entries
    const giveawayEntriesList = await db
      .select()
      .from(giveawayEntries)
      .where(eq(giveawayEntries.userId, user.id))

    // Get payment history
    const payments = await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, user.id))

    // Get points transactions
    const points = await db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, user.id))

    // Get notifications
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))

    // Get file uploads
    const uploads = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, user.id))

    // Remove sensitive data before export
    const sanitizedUserData = {
      ...userData,
      password: undefined,
      emailVerificationToken: undefined,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    }

    const exportData = {
      user: sanitizedUserData,
      contestApplications: applications,
      contestSubmissions: submissions,
      giveawayEntries: giveawayEntriesList,
      payments: payments,
      pointsTransactions: points,
      notifications: userNotifications,
      fileUploads: uploads.map(u => ({
        id: u.id,
        filename: u.filename,
        originalName: u.originalName,
        size: u.size,
        mimeType: u.mimeType,
        url: u.url,
        createdAt: u.createdAt
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    return successResponse({
      data: exportData,
      format: 'json'
    }, 'User data exported successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

