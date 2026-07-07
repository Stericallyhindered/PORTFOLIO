import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestApplications, contestSubmissions } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'
import { emailService } from '@/lib/email-service'

const contestSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.enum(['video', 'image', 'document'], { required_error: 'File type is required' }),
  tags: z.string().optional(),
  additionalNotes: z.string().optional()
})

export const dynamic = 'force-dynamic';

// POST - Submit content for contest
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = contestSubmissionSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const submissionData = validation.data

    // Check if contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Check if contest is open for submissions
    const now = new Date()
    if (contest.status !== 'open' || contest.submissionDeadline < now) {
      return errorResponse('Contest is not open for submissions', 400)
    }

    // Check if user has an approved application
    const [application] = await db
      .select()
      .from(contestApplications)
      .where(and(
        eq(contestApplications.contestId, contestId),
        eq(contestApplications.userId, user.id),
        eq(contestApplications.status, 'approved')
      ))
      .limit(1)

    if (!application) {
      return errorResponse('You must have an approved application to submit content', 400)
    }

    // Check if user has already submitted
    const [existingSubmission] = await db
      .select()
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.userId, user.id)
      ))
      .limit(1)

    if (existingSubmission) {
      return errorResponse('You have already submitted content for this contest', 400)
    }

    // Create submission
    const [newSubmission] = await db
      .insert(contestSubmissions)
      .values({
        contestId,
        applicationId: application.id,
        userId: user.id,
        title: submissionData.title,
        description: submissionData.description,
        fileUrl: submissionData.fileUrl,
        fileType: submissionData.fileType,
        status: 'submitted'
      })
      .returning({
        id: contestSubmissions.id,
        contestId: contestSubmissions.contestId,
        applicationId: contestSubmissions.applicationId,
        userId: contestSubmissions.userId,
        title: contestSubmissions.title,
        description: contestSubmissions.description,
        fileUrl: contestSubmissions.fileUrl,
        fileType: contestSubmissions.fileType,
        status: contestSubmissions.status,
        createdAt: contestSubmissions.createdAt
      })

    // Send email notification
    try {
      await emailService.sendNotification(user.id, 'contest_submission_received', {
        contestTitle: contest.title,
        contestId: contest.id,
        submissionTitle: submissionData.title,
        submittedAt: newSubmission.createdAt
      })
    } catch (emailError) {
      console.error('Error sending submission notification email:', emailError)
      // Don't fail the submission if email sending fails
    }

    return successResponse(newSubmission, 'Submission created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get user's submission status
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAuth(request)

    // Check if contest exists
    const [contest] = await db
      .select({
        id: contests.id,
        title: contests.title,
        status: contests.status,
        submissionDeadline: contests.submissionDeadline,
        submissionGuidelines: contests.submissionGuidelines
      })
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Get user's application status
    const [application] = await db
      .select({
        id: contestApplications.id,
        status: contestApplications.status
      })
      .from(contestApplications)
      .where(and(
        eq(contestApplications.contestId, contestId),
        eq(contestApplications.userId, user.id)
      ))
      .limit(1)

    // Get user's submission if exists
    const [submission] = await db
      .select({
        id: contestSubmissions.id,
        title: contestSubmissions.title,
        description: contestSubmissions.description,
        fileUrl: contestSubmissions.fileUrl,
        fileType: contestSubmissions.fileType,
        status: contestSubmissions.status,
        score: contestSubmissions.score,
        feedback: contestSubmissions.feedback,
        createdAt: contestSubmissions.createdAt,
        updatedAt: contestSubmissions.updatedAt
      })
      .from(contestSubmissions)
      .where(and(
        eq(contestSubmissions.contestId, contestId),
        eq(contestSubmissions.userId, user.id)
      ))
      .limit(1)

    const canSubmit = application?.status === 'approved' && 
                     !submission && 
                     contest.status === 'open' && 
                     contest.submissionDeadline > new Date()

    return successResponse({
      contest,
      application: application || null,
      submission: submission || null,
      canSubmit
    }, 'Submission status retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 