import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestApplications, users } from '@/lib/db'
import { eq, desc, count, and } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'
import { emailService } from '@/lib/email-service'

const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  rejectionReason: z.string().optional()
})

export const dynamic = 'force-dynamic';

// GET - Get all applications for a contest
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')

    // Check if contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Build query conditions
    const conditions = [eq(contestApplications.contestId, contestId)]
    
    if (status) {
      conditions.push(eq(contestApplications.status, status))
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    // Get applications with pagination
    const offset = (page - 1) * limit
    const applications = await db
      .select({
        id: contestApplications.id,
        contestId: contestApplications.contestId,
        userId: contestApplications.userId,
        status: contestApplications.status,
        responses: contestApplications.responses,
        rejectionReason: contestApplications.rejectionReason,
        reviewedBy: contestApplications.reviewedBy,
        reviewedAt: contestApplications.reviewedAt,
        createdAt: contestApplications.createdAt,
        updatedAt: contestApplications.updatedAt,
        userName: users.name,
        userEmail: users.email
      })
      .from(contestApplications)
      .leftJoin(users, eq(contestApplications.userId, users.id))
      .where(whereClause)
      .orderBy(desc(contestApplications.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(contestApplications)
      .where(whereClause)

    const totalPages = Math.ceil(totalCount.count / limit)

    return successResponse({
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status
      },
      applications,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Applications retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update application status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)
    const body = await request.json()
    const { applicationId, ...updateData } = body

    if (!applicationId) {
      return errorResponse('Application ID is required', 400)
    }

    // Validate input
    const validation = updateApplicationSchema.safeParse(updateData)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { status, rejectionReason } = validation.data

    // Check if application exists
    const [application] = await db
      .select()
      .from(contestApplications)
      .where(eq(contestApplications.id, applicationId))
      .limit(1)

    if (!application) {
      return notFoundResponse('Application not found')
    }

    // Validate that application belongs to this contest
    if (application.contestId !== contestId) {
      return errorResponse('Application does not belong to this contest', 400)
    }

    // Validate rejection reason if status is rejected
    if (status === 'rejected' && !rejectionReason) {
      return validationErrorResponse({ rejectionReason: ['Rejection reason is required'] })
    }

    // Update application
    const [updatedApplication] = await db
      .update(contestApplications)
      .set({
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contestApplications.id, applicationId))
      .returning()

    // Send email notification if application was approved
    if (status === 'approved') {
      try {
        // Get contest details for email
        const [contest] = await db
          .select({
            id: contests.id,
            title: contests.title,
            prize: contests.prize,
            submissionDeadline: contests.submissionDeadline
          })
          .from(contests)
          .where(eq(contests.id, contestId))
          .limit(1)

        if (contest) {
          await emailService.sendNotification(application.userId, 'contest_application_accepted', {
            contestTitle: contest.title,
            contestId: contest.id,
            prize: contest.prize,
            deadline: contest.submissionDeadline
          })
        }
      } catch (emailError) {
        console.error('Error sending application approval notification:', emailError)
        // Don't fail the update if email sending fails
      }
    }

    return successResponse(updatedApplication, 'Application updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 