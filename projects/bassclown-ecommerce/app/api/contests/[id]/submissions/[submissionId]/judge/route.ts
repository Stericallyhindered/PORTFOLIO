import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestSubmissions, users } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

const judgingCriteriaSchema = z.object({
  technique: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
  video_quality: z.number().min(0).max(10),
  entertainment: z.number().min(0).max(10),
  adherence: z.number().min(0).max(10)
})

const judgeSubmissionSchema = z.object({
  scores: judgingCriteriaSchema,
  comments: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  status: z.enum(['pending', 'approved', 'rejected']),
  judgeNotes: z.string().optional()
})

export const dynamic = 'force-dynamic';

// POST - Judge individual submission with detailed scoring
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string, submissionId: string }> }) {
  try {
    const { id: contestId, submissionId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = judgeSubmissionSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { scores, comments, overallRating, status, judgeNotes } = validation.data

    // Check if contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Check if submission exists and belongs to this contest
    const [submission] = await db
      .select()
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.id, submissionId),
        eq(contestSubmissions.contestId, contestId)
      ))
      .limit(1)

    if (!submission) {
      return notFoundResponse('Submission not found')
    }

    // Check if user has permission to judge (admin or contest creator)
    if (user.role !== 'admin' && contest.createdBy !== user.id) {
      return errorResponse('You do not have permission to judge this contest', 403)
    }

    // Calculate weighted total score
    const criteriaWeights = {
      technique: 30,
      creativity: 25,
      video_quality: 20,
      entertainment: 15,
      adherence: 10
    }

    const totalScore = Object.entries(scores).reduce((total, [criteria, score]) => {
      const weight = criteriaWeights[criteria as keyof typeof criteriaWeights]
      return total + (score * weight / 100)
    }, 0)

    // Update submission with detailed scoring
    const [updatedSubmission] = await db
      .update(contestSubmissions)
      .set({
        status,
        score: totalScore.toString(),
        feedback: comments,
        judgeNotes: JSON.stringify({
          criteriaScores: scores,
          overallRating,
          judgeNotes: judgeNotes || '',
          totalScore: parseFloat(totalScore.toFixed(2))
        }),
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contestSubmissions.id, submissionId))
      .returning()

    return successResponse({
      submission: updatedSubmission,
      judging: {
        criteriaScores: scores,
        overallRating,
        totalScore: parseFloat(totalScore.toFixed(2)),
        comments,
        judgeNotes
      }
    }, 'Submission judged successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get submission details for judging
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string, submissionId: string }> }) {
  try {
    const { id: contestId, submissionId } = await params
    const user = await requireAuth(request)

    // Check if contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Check if user has permission to judge
    if (user.role !== 'admin' && contest.createdBy !== user.id) {
      return errorResponse('You do not have permission to judge this contest', 403)
    }

    // Get submission with user details
    const [submission] = await db
      .select({
        id: contestSubmissions.id,
        contestId: contestSubmissions.contestId,
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
      .where(and(
        eq(contestSubmissions.id, submissionId),
        eq(contestSubmissions.contestId, contestId)
      ))
      .limit(1)

    if (!submission) {
      return notFoundResponse('Submission not found')
    }

    // Parse existing judging data if available
    let existingJudging = null
    if (submission.judgeNotes && submission.judgeNotes !== 'undefined') {
      try {
        existingJudging = JSON.parse(submission.judgeNotes as string)
      } catch (e) {
        // If parsing fails, treat as legacy format
        existingJudging = {
          judgeNotes: submission.judgeNotes,
          totalScore: submission.score ? parseFloat(submission.score) : 0
        }
      }
    }

    return successResponse({
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status
      },
      submission,
      existingJudging,
      judgingCriteria: [
        { id: 'technique', name: 'Technique', weight: 30, maxScore: 10 },
        { id: 'creativity', name: 'Creativity', weight: 25, maxScore: 10 },
        { id: 'video_quality', name: 'Video Quality', weight: 20, maxScore: 10 },
        { id: 'entertainment', name: 'Entertainment Value', weight: 15, maxScore: 10 },
        { id: 'adherence', name: 'Adherence to Rules', weight: 10, maxScore: 10 }
      ]
    }, 'Submission details retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 