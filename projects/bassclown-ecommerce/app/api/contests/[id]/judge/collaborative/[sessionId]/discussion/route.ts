import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { collaborativeJudgingService } from '@/lib/collaborative-judging'

export const dynamic = 'force-dynamic';

const addCommentSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
  messageType: z.enum(['comment', 'question', 'concern', 'agreement']).optional(),
  replyToId: z.string().uuid().optional(),
  isPrivate: z.boolean().optional()
})

// POST - Add discussion comment to judging session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = addCommentSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { message, messageType = 'comment', replyToId, isPrivate = false } = validation.data

    // Add discussion comment
    await collaborativeJudgingService.addDiscussionComment(
      sessionId,
      user.id,
      message,
      messageType,
      replyToId,
      isPrivate
    )

    return successResponse({
      sessionId,
      message: 'Discussion comment added successfully'
    }, 'Comment added successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get discussion comments for a judging session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const user = await requireAuth(request)

    // Get discussion comments
    const discussion = await collaborativeJudgingService.getSessionDiscussion(sessionId, user.id)

    return successResponse({
      sessionId,
      discussion
    }, 'Discussion retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

