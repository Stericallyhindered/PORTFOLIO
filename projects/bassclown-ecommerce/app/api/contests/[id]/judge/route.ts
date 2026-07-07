import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestSubmissions } from '@/lib/db'
import { eq, inArray, and, count } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

const bulkJudgeSchema = z.object({
  submissionIds: z.array(z.string().uuid()),
  action: z.enum(['approve', 'reject', 'under_review']),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  judgeNotes: z.string().optional()
})

const finalizeContestSchema = z.object({
  action: z.enum(['start_judging', 'complete_contest']),
  winnerSubmissionId: z.string().uuid().optional()
})

// POST - Bulk judging actions
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)
    const body = await request.json()

    // Check if this is a bulk judging action or contest finalization
    if (body.action && ['start_judging', 'complete_contest'].includes(body.action)) {
      return handleContestFinalization(contestId, user.id, body)
    } else {
      return handleBulkJudging(contestId, user.id, body)
    }

  } catch (error) {
    return handleApiError(error)
  }
}

async function handleBulkJudging(contestId: string, judgeId: string, body: any) {
  // Validate input
  const validation = bulkJudgeSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors)
  }

  const { submissionIds, action, score, feedback, judgeNotes } = validation.data

  if (submissionIds.length === 0) {
    return errorResponse('No submissions selected', 400)
  }

  // Check if contest exists
  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1)

  if (!contest) {
    return notFoundResponse('Contest not found')
  }

  // Verify all submissions belong to this contest
  const submissions = await db
    .select({ id: contestSubmissions.id })
    .from(contestSubmissions)
    .where(and(
      eq(contestSubmissions.contestId, contestId),
      inArray(contestSubmissions.id, submissionIds)
    ))

  if (submissions.length !== submissionIds.length) {
    return errorResponse('Some submissions do not belong to this contest', 400)
  }

  // Determine status based on action
  let status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  switch (action) {
    case 'approve':
      status = 'approved'
      break
    case 'reject':
      status = 'rejected'
      break
    case 'under_review':
      status = 'under_review'
      break
    default:
      return errorResponse('Invalid action', 400)
  }

  // Update submissions
  const updatedSubmissions = await db
    .update(contestSubmissions)
    .set({
      status,
      score: score !== undefined ? score.toString() : undefined,
      feedback,
      judgeNotes,
      reviewedBy: judgeId,
      reviewedAt: new Date(),
      updatedAt: new Date()
    })
    .where(inArray(contestSubmissions.id, submissionIds))
    .returning({
      id: contestSubmissions.id,
      status: contestSubmissions.status,
      score: contestSubmissions.score,
      reviewedAt: contestSubmissions.reviewedAt
    })

  return successResponse({
    updatedSubmissions,
    message: `Successfully ${action}ed ${updatedSubmissions.length} submissions`
  }, 'Bulk judging action completed')
}

async function handleContestFinalization(contestId: string, judgeId: string, body: any) {
  // Validate input
  const validation = finalizeContestSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors)
  }

  const { action, winnerSubmissionId } = validation.data

  // Check if contest exists
  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1)

  if (!contest) {
    return notFoundResponse('Contest not found')
  }

  if (action === 'start_judging') {
    // Change contest status to judging
    if (contest.status !== 'closed') {
      return errorResponse('Contest must be closed before starting judging phase', 400)
    }

    const [updatedContest] = await db
      .update(contests)
      .set({
        status: 'judging',
        updatedAt: new Date()
      })
      .where(eq(contests.id, contestId))
      .returning()

    return successResponse(updatedContest, 'Contest judging phase started')

  } else if (action === 'complete_contest') {
    // Complete the contest
    if (contest.status !== 'judging') {
      return errorResponse('Contest must be in judging phase to complete', 400)
    }

    // If winner is specified, verify the submission exists and belongs to this contest
    if (winnerSubmissionId) {
      const [winnerSubmission] = await db
        .select()
        .from(contestSubmissions)
        .where(and(
          eq(contestSubmissions.id, winnerSubmissionId),
          eq(contestSubmissions.contestId, contestId)
        ))
        .limit(1)

      if (!winnerSubmission) {
        return errorResponse('Winner submission not found or does not belong to this contest', 400)
      }

      // Mark winner submission as approved if not already
      if (winnerSubmission.status !== 'approved') {
        await db
          .update(contestSubmissions)
          .set({
            status: 'approved',
            reviewedBy: judgeId,
            reviewedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contestSubmissions.id, winnerSubmissionId))
      }
    }

    const [updatedContest] = await db
      .update(contests)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(contests.id, contestId))
      .returning()

    return successResponse({
      contest: updatedContest,
      winnerSubmissionId
    }, 'Contest completed successfully')
  }

  return errorResponse('Invalid action', 400)
}

// GET - Get judging overview
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)

    // Check if contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Get submission statistics
    const stats = await Promise.all([
      db.select({ count: count() }).from(contestSubmissions).where(eq(contestSubmissions.contestId, contestId)),
      db.select({ count: count() }).from(contestSubmissions).where(and(eq(contestSubmissions.contestId, contestId), eq(contestSubmissions.status, 'submitted'))),
      db.select({ count: count() }).from(contestSubmissions).where(and(eq(contestSubmissions.contestId, contestId), eq(contestSubmissions.status, 'under_review'))),
      db.select({ count: count() }).from(contestSubmissions).where(and(eq(contestSubmissions.contestId, contestId), eq(contestSubmissions.status, 'approved'))),
      db.select({ count: count() }).from(contestSubmissions).where(and(eq(contestSubmissions.contestId, contestId), eq(contestSubmissions.status, 'rejected')))
    ])

    const [total, submitted, underReview, approved, rejected] = stats

    return successResponse({
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status,
        submissionDeadline: contest.submissionDeadline,
        endDate: contest.endDate
      },
      stats: {
        total: total[0].count,
        submitted: submitted[0].count,
        underReview: underReview[0].count,
        approved: approved[0].count,
        rejected: rejected[0].count,
        completionRate: total[0].count > 0 ? ((approved[0].count + rejected[0].count) / total[0].count * 100).toFixed(1) : '0'
      },
      canStartJudging: contest.status === 'closed',
      canComplete: contest.status === 'judging'
    }, 'Judging overview retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 