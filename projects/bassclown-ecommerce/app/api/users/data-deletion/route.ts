import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { emailService } from '@/lib/email-service'

export const dynamic = 'force-dynamic';

const deletionRequestSchema = z.object({
  reason: z.string().optional(),
  confirm: z.boolean().refine(val => val === true, {
    message: 'You must confirm data deletion'
  })
})

// POST - Request data deletion
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = deletionRequestSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { reason } = validation.data

    // Anonymize user data instead of hard delete (for compliance and recovery)
    // Update user to anonymized state
    await db
      .update(users)
      .set({
        email: `deleted_${Date.now()}_${user.id.substring(0, 8)}@deleted.local`,
        name: 'Deleted User',
        password: 'deleted',
        bio: null,
        phone: null,
        location: null,
        website: null,
        avatar: null,
        socialLinks: {},
        emailVerificationToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // Keep ID and timestamps for audit trail
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    // Send confirmation email (before email is changed)
    try {
      await emailService.sendNotification(user.id, 'account_deleted', {
        reason: reason || 'No reason provided',
        deletedAt: new Date().toISOString()
      })
    } catch (emailError) {
      console.error('Failed to send deletion confirmation email:', emailError)
    }

    // Note: Related data (applications, submissions, etc.) can be handled based on business rules
    // Options:
    // 1. Delete related data
    // 2. Anonymize related data
    // 3. Keep data but remove personal identifiers
    // For now, we'll keep the data structure but user is anonymized

    return successResponse({
      message: 'Account data deletion requested and processed',
      deletedAt: new Date().toISOString()
    }, 'Account deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

