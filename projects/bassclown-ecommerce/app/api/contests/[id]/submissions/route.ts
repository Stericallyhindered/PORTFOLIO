import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestSubmissions, users } from '@/lib/db'
import { eq, desc, count, and } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

const updateSubmissionSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected']),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  judgeNotes: z.string().optional()
})

export const dynamic = 'force-dynamic';

// GET - Get all submissions for a contest
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
    const conditions = [eq(contestSubmissions.contestId, contestId)]
    
    if (status) {
      conditions.push(eq(contestSubmissions.status, status))
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    // Get submissions with pagination
    const offset = (page - 1) * limit
    const submissions = await db
      .select({
        id: contestSubmissions.id,
        contestId: contestSubmissions.contestId,
        applicationId: contestSubmissions.applicationId,
        userId: contestSubmissions.userId,
        title: contestSubmissions.title,
        description: contestSubmissions.description,
        fileUrl: contestSubmissions.fileUrl,
        fileType: contestSubmissions.fileType,
        status: contestSubmissions.status,
        score: contestSubmissions.score,
        feedback: contestSubmissions.feedback,
        judgeNotes: contestSubmissions.judgeNotes,
        reviewedBy: contestSubmissions.reviewedBy,
        reviewedAt: contestSubmissions.reviewedAt,
        createdAt: contestSubmissions.createdAt,
        updatedAt: contestSubmissions.updatedAt,
        userName: users.name,
        userEmail: users.email
      })
      .from(contestSubmissions)
      .leftJoin(users, eq(contestSubmissions.userId, users.id))
      .where(whereClause)
      .orderBy(desc(contestSubmissions.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(whereClause)

    const totalPages = Math.ceil(totalCount.count / limit)

    // Get submission stats
    const [submittedCount] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.status, 'submitted')
      ))

    const [underReviewCount] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.status, 'under_review')
      ))

    const [approvedCount] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.status, 'approved')
      ))

    const [rejectedCount] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.status, 'rejected')
      ))

    return successResponse({
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status
      },
      submissions,
      stats: {
        total: totalCount.count,
        submitted: submittedCount.count,
        underReview: underReviewCount.count,
        approved: approvedCount.count,
        rejected: rejectedCount.count
      },
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Submissions retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update submission status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)
    const body = await request.json()
    const { submissionId, ...updateData } = body

    if (!submissionId) {
      return errorResponse('Submission ID is required', 400)
    }

    // Validate input
    const validation = updateSubmissionSchema.safeParse(updateData)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { status, score, feedback, judgeNotes } = validation.data

    // Check if submission exists
    const [submission] = await db
      .select()
      .from(contestSubmissions)
      .where(eq(contestSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return notFoundResponse('Submission not found')
    }

    // Validate that submission belongs to this contest
    if (submission.contestId !== contestId) {
      return errorResponse('Submission does not belong to this contest', 400)
    }

    // Update submission
    const [updatedSubmission] = await db
      .update(contestSubmissions)
      .set({
        status,
        score: score !== undefined ? score.toString() : undefined,
        feedback,
        judgeNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contestSubmissions.id, submissionId))
      .returning()

    return successResponse(updatedSubmission, 'Submission updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 