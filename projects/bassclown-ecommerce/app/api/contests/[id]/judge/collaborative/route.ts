import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestSubmissions, contestJudges, judgingSessions } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'
import { collaborativeJudgingService, CollaborativeJudgingConfig } from '@/lib/collaborative-judging'

export const dynamic = 'force-dynamic';

const createSessionSchema = z.object({
  submissionId: z.string().uuid(),
  sessionType: z.enum(['independent', 'collaborative', 'consensus']),
  requiredJudges: z.number().int().min(1).max(10),
  aggregationMethod: z.enum(['average', 'median', 'weighted']),
  consensusThreshold: z.number().min(0).max(1).optional(),
  allowDiscussion: z.boolean().optional(),
  anonymousScoring: z.boolean().optional()
})

// POST - Create a collaborative judging session
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = createSessionSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { submissionId, ...configData } = validation.data

    // Check if contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Check if submission exists and belongs to contest
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

    // Check if user is assigned as judge for this contest
    if (user.role !== 'bass-clown-admin') {
      const [judgeAssignment] = await db
        .select()
        .from(contestJudges)
        .where(and(
          eq(contestJudges.contestId, contestId),
          eq(contestJudges.judgeId, user.id),
          eq(contestJudges.status, 'active')
        ))
        .limit(1)

      if (!judgeAssignment) {
        return errorResponse('You are not assigned as a judge for this contest', 403)
      }
    }

    // Create collaborative judging config
    const config: CollaborativeJudgingConfig = {
      sessionType: configData.sessionType,
      requiredJudges: configData.requiredJudges,
      aggregationMethod: configData.aggregationMethod,
      consensusThreshold: configData.consensusThreshold || 0.8,
      allowDiscussion: configData.allowDiscussion ?? true,
      anonymousScoring: configData.anonymousScoring ?? false
    }

    // Create judging session
    const sessionId = await collaborativeJudgingService.createJudgingSession(
      contestId,
      submissionId,
      config
    )

    return successResponse({
      sessionId,
      submissionId,
      contestId,
      config
    }, 'Collaborative judging session created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get collaborative judging sessions for a contest
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
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

    // Get all collaborative judging sessions for this contest
    const sessions = await db
      .select()
      .from(judgingSessions)
      .where(eq(judgingSessions.contestId, contestId))

    // Filter by user if not admin
    let filteredSessions = sessions
    if (user.role !== 'bass-clown-admin') {
      // Only show sessions where user is assigned as judge
      const [judgeAssignment] = await db
        .select()
        .from(contestJudges)
        .where(and(
          eq(contestJudges.contestId, contestId),
          eq(contestJudges.judgeId, user.id)
        ))
        .limit(1)

      if (judgeAssignment) {
        // User is a judge, show their assigned sessions
        filteredSessions = sessions
      } else {
        filteredSessions = []
      }
    }

    return successResponse({
      sessions: filteredSessions,
      contestId
    }, 'Collaborative judging sessions retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

