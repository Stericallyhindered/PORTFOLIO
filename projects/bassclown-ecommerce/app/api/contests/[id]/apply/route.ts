import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, contestApplications, users } from '@/lib/db'
import { eq, and, count } from 'drizzle-orm'
import { requireAuth, checkActiveMembership } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

const contestApplicationSchema = z.object({
  experience: z.string().min(50, 'Please describe your experience (minimum 50 characters)'),
  portfolio: z.string().url('Please provide a valid portfolio URL').optional().or(z.literal('')),
  motivation: z.string().min(100, 'Please explain your motivation (minimum 100 characters)'),
  equipment: z.string().min(20, 'Please describe your equipment (minimum 20 characters)'),
  availability: z.string().min(20, 'Please describe your availability (minimum 20 characters)'),
  additionalInfo: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
})

export const dynamic = 'force-dynamic';

// POST - Submit application
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = contestApplicationSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const applicationData = validation.data

    // Check if user has active membership
    const membershipCheck = await checkActiveMembership(user.id)
    if (!membershipCheck.isActive) {
      return errorResponse(membershipCheck.message || 'Active membership required to apply to contests', 403)
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

    // Check if contest is open for applications
    const now = new Date()
    if (contest.status !== 'open' || contest.applicationDeadline < now) {
      return errorResponse('Contest is not open for applications', 400)
    }

    // Check if user has already applied
    const [existingApplication] = await db
      .select()
      .from(contestApplications)
      .where(and(
        eq(contestApplications.contestId, contestId),
        eq(contestApplications.userId, user.id)
      ))
      .limit(1)

    if (existingApplication) {
      return errorResponse('You have already applied to this contest', 400)
    }

    // Check if contest has reached max participants
    if (contest.maxParticipants) {
      const [applicationCount] = await db
        .select({ count: count() })
        .from(contestApplications)
        .where(eq(contestApplications.contestId, contestId))

      if (applicationCount.count >= contest.maxParticipants) {
        return errorResponse('Contest has reached maximum participants', 400)
      }
    }

    // Create application
    const [newApplication] = await db
      .insert(contestApplications)
      .values({
        contestId,
        userId: user.id,
        status: 'pending',
        responses: {
          experience: applicationData.experience,
          portfolio: applicationData.portfolio || '',
          motivation: applicationData.motivation,
          equipment: applicationData.equipment,
          availability: applicationData.availability,
          additionalInfo: applicationData.additionalInfo || '',
          agreedToTerms: applicationData.agreedToTerms
        }
      })
      .returning({
        id: contestApplications.id,
        contestId: contestApplications.contestId,
        userId: contestApplications.userId,
        status: contestApplications.status,
        responses: contestApplications.responses,
        createdAt: contestApplications.createdAt
      })

    // Update contest participant count
    await db
      .update(contests)
      .set({
        currentParticipants: (contest.currentParticipants || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(contests.id, contestId))

    return successResponse(newApplication, 'Application submitted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get user's application status
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
        applicationDeadline: contests.applicationDeadline
      })
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Get user's application
    const [application] = await db
      .select({
        id: contestApplications.id,
        status: contestApplications.status,
        responses: contestApplications.responses,
        rejectionReason: contestApplications.rejectionReason,
        createdAt: contestApplications.createdAt,
        updatedAt: contestApplications.updatedAt
      })
      .from(contestApplications)
      .where(and(
        eq(contestApplications.contestId, contestId),
        eq(contestApplications.userId, user.id)
      ))
      .limit(1)

    // Check membership for canApply
    const membershipCheck = await checkActiveMembership(user.id)
    const canApply = !application && 
                     contest.status === 'open' && 
                     contest.applicationDeadline > new Date() &&
                     membershipCheck.isActive

    return successResponse({
      contest,
      application: application || null,
      canApply,
      membershipRequired: !membershipCheck.isActive,
      membershipMessage: membershipCheck.message
    }, 'Application status retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 