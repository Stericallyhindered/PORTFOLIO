import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db, judgingSessions, judgeScores, users } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get collaborative judging session details with scores
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: contestId, sessionId } = await params

    // Get session
    const [session] = await db
      .select()
      .from(judgingSessions)
      .where(and(
        eq(judgingSessions.id, sessionId),
        eq(judgingSessions.contestId, contestId)
      ))
      .limit(1)

    if (!session) {
      return notFoundResponse('Judging session not found')
    }

    // Get all judge scores for this session
    const scores = await db
      .select({
        judgeId: judgeScores.judgeId,
        totalScore: judgeScores.totalScore,
        criteriaScores: judgeScores.criteriaScores,
        comments: judgeScores.comments,
        judgeNotes: judgeScores.judgeNotes,
        confidence: judgeScores.confidence,
        submittedAt: judgeScores.submittedAt,
        userName: users.name,
        userEmail: users.email
      })
      .from(judgeScores)
      .leftJoin(users, eq(judgeScores.judgeId, users.id))
      .where(eq(judgeScores.submissionId, session.submissionId))
      .orderBy(judgeScores.submittedAt)

    const formattedScores = scores.map(score => ({
      judgeId: score.judgeId,
      judgeName: score.userName || 'Unknown Judge',
      totalScore: score.totalScore ? parseFloat(score.totalScore) : 0,
      criteriaScores: score.criteriaScores,
      comments: score.comments || undefined,
      judgeNotes: score.judgeNotes || undefined,
      confidence: score.confidence ? parseFloat(score.confidence) : undefined,
      submittedAt: score.submittedAt || new Date()
    }))

    return successResponse({
      session,
      scores: formattedScores
    }, 'Session details retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
