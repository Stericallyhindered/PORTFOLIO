import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, users, contestApplications, contestSubmissions } from '@/lib/db'
import { eq, count, and } from 'drizzle-orm'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

// Helper: treat empty strings as undefined so optional URL fields don't fail
const emptyToUndefined = z.literal('').transform(() => undefined);
const optionalUrl = z.union([emptyToUndefined, z.string().url()]).optional();

const updateContestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long').optional(),
  description: z.union([emptyToUndefined, z.string().min(10, 'Description must be at least 10 characters')]).optional(),
  shortDescription: z.union([emptyToUndefined, z.string().max(500)]).optional(),
  image: optionalUrl,
  brandLogo: z.union([emptyToUndefined, z.string()]).optional(),
  brandName: z.union([emptyToUndefined, z.string().max(255)]).optional(),
  prize: z.union([emptyToUndefined, z.string().max(255)]).optional(),
  startDate: z.union([emptyToUndefined, z.string().datetime()]).optional(),
  endDate: z.union([emptyToUndefined, z.string().datetime()]).optional(),
  applicationDeadline: z.union([emptyToUndefined, z.string().datetime()]).optional().nullable(),
  submissionDeadline: z.union([emptyToUndefined, z.string().datetime()]).optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'judging', 'completed']).optional(),
  category: z.union([emptyToUndefined, z.string().max(100)]).optional(),
  requirements: z.any().optional(),
  judges: z.any().optional(),
  maxParticipants: z.union([z.number().int().positive(), z.string(), z.null()]).optional(),
  rules: z.union([emptyToUndefined, z.string()]).optional(),
  submissionGuidelines: z.union([emptyToUndefined, z.string()]).optional()
})

export const dynamic = 'force-dynamic';

// GET - Get specific contest
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAuth(request)

    // Get contest with creator info
    const [contest] = await db
      .select({
        id: contests.id,
        title: contests.title,
        description: contests.description,
        shortDescription: contests.shortDescription,
        image: contests.image,
        brandLogo: contests.brandLogo,
        brandName: contests.brandName,
        prize: contests.prize,
        startDate: contests.startDate,
        endDate: contests.endDate,
        applicationDeadline: contests.applicationDeadline,
        submissionDeadline: contests.submissionDeadline,
        status: contests.status,
        category: contests.category,
        requirements: contests.requirements,
        judges: contests.judges,
        maxParticipants: contests.maxParticipants,
        currentParticipants: contests.currentParticipants,
        rules: contests.rules,
        submissionGuidelines: contests.submissionGuidelines,
        createdBy: contests.createdBy,
        createdAt: contests.createdAt,
        updatedAt: contests.updatedAt,
        creatorName: users.name
      })
      .from(contests)
      .leftJoin(users, eq(contests.createdBy, users.id))
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!contest) {
      return notFoundResponse('Contest not found')
    }

    // Get application count
    const [applicationCount] = await db
      .select({ count: count() })
      .from(contestApplications)
      .where(eq(contestApplications.contestId, contestId))

    // Get submission count
    const [submissionCount] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(eq(contestSubmissions.contestId, contestId))

    // Check if user has applied
    const [userApplication] = await db
      .select()
      .from(contestApplications)
      .where(and(
        eq(contestApplications.contestId, contestId),
        eq(contestApplications.userId, user.id)
      ))
      .limit(1)

    const contestWithStats = {
      ...contest,
      stats: {
        applicationCount: applicationCount.count,
        submissionCount: submissionCount.count,
        userHasApplied: !!userApplication,
        userApplicationStatus: userApplication?.status || null
      }
    }

    return successResponse(contestWithStats, 'Contest retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update contest
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)
    const body = await request.json()

    // Strip unknown keys then validate — prevents 422 from extra fields like stats, creatorName, etc.
    const validation = updateContestSchema.strip().safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const updateData = validation.data

    // Check if contest exists
    const [existingContest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!existingContest) {
      return notFoundResponse('Contest not found')
    }

    // Normalize types: requirements/judges may arrive as JSON strings
    let processedUpdateData: any = { ...updateData }
    
    // Normalize requirements: must be an array of strings
    if (processedUpdateData.requirements !== undefined) {
      if (Array.isArray(processedUpdateData.requirements)) {
        // already an array — keep it
      } else if (typeof processedUpdateData.requirements === 'string') {
        try { processedUpdateData.requirements = JSON.parse(processedUpdateData.requirements); } catch { processedUpdateData.requirements = []; }
      } else {
        // object, null, or anything else → empty array
        processedUpdateData.requirements = [];
      }
    }
    // Normalize judges: must be an array of strings
    if (processedUpdateData.judges !== undefined) {
      if (Array.isArray(processedUpdateData.judges)) {
        // already an array — keep it
      } else if (typeof processedUpdateData.judges === 'string') {
        try { processedUpdateData.judges = JSON.parse(processedUpdateData.judges); } catch { processedUpdateData.judges = []; }
      } else {
        processedUpdateData.judges = [];
      }
    }
    if (processedUpdateData.maxParticipants !== undefined) {
      const n = Number(processedUpdateData.maxParticipants);
      if (isNaN(n) || n <= 0) { delete processedUpdateData.maxParticipants; }
      else { processedUpdateData.maxParticipants = n; }
    }
    
    // Convert date strings to Date objects when provided
    if (processedUpdateData.startDate) processedUpdateData.startDate = new Date(processedUpdateData.startDate)
    if (processedUpdateData.endDate) processedUpdateData.endDate = new Date(processedUpdateData.endDate)
    if (processedUpdateData.applicationDeadline) processedUpdateData.applicationDeadline = new Date(processedUpdateData.applicationDeadline)
    if (processedUpdateData.submissionDeadline) processedUpdateData.submissionDeadline = new Date(processedUpdateData.submissionDeadline)

    // Only validate date ordering when date fields are actually being changed
    const hasDateChanges = updateData.startDate || updateData.endDate || updateData.applicationDeadline || updateData.submissionDeadline
    if (hasDateChanges) {
      const startDate = processedUpdateData.startDate || existingContest.startDate
      const endDate = processedUpdateData.endDate || existingContest.endDate
      if (startDate && endDate && startDate >= endDate) {
        return validationErrorResponse({ endDate: ['End date must be after start date'] })
      }
    }

    // Update contest
    const [updatedContest] = await db
      .update(contests)
      .set({
        ...processedUpdateData,
        updatedAt: new Date()
      })
      .where(eq(contests.id, contestId))
      .returning()

    return successResponse(updatedContest, 'Contest updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Delete contest
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contestId } = await params
    const user = await requireAdmin(request)

    // Check if contest exists
    const [existingContest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1)

    if (!existingContest) {
      return notFoundResponse('Contest not found')
    }

    // Check if contest has applications or submissions
    const [applicationCount] = await db
      .select({ count: count() })
      .from(contestApplications)
      .where(eq(contestApplications.contestId, contestId))

    if (applicationCount.count > 0) {
      return errorResponse('Cannot delete contest with existing applications', 400)
    }

    // Delete contest
    await db
      .delete(contests)
      .where(eq(contests.id, contestId))

    return successResponse(null, 'Contest deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 