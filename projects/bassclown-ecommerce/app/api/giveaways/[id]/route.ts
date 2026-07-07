import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, giveaways, giveawayEntries, users } from '@/lib/db'
import { eq, count, desc, and } from 'drizzle-orm'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

const updateGiveawaySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  longDescription: z.string().optional(),
  prizeValue: z.string().max(100, 'Prize value is too long').optional(),
  maxEntries: z.number().min(1).optional().nullable(),
  additionalEntryPrice: z.number().min(0).optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date').optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date').optional(),
  status: z.enum(['draft', 'upcoming', 'active', 'ended', 'closed', 'completed', 'cancelled']).optional(),
  image: z.string().optional().nullable(),
  rules: z.union([z.array(z.string()), z.record(z.unknown())]).optional(),
  prizeItems: z.array(z.string()).optional(),
  sponsor: z.string().max(255, 'Sponsor name is too long').optional().nullable(),
})

export const dynamic = 'force-dynamic';

// GET - Get specific giveaway
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAuth(request)

    // Get giveaway details
    const [giveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Get entry statistics
    const [totalEntries] = await db
      .select({ count: count() })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    // Check if user has entered
    const [userEntry] = await db
      .select()
      .from(giveawayEntries)
      .where(and(
        eq(giveawayEntries.giveawayId, giveawayId),
        eq(giveawayEntries.userId, user.id)
      ))
      .limit(1)

    // Get recent entries if user is admin
    let recentEntries = null
    if (user.role === 'admin') {
      recentEntries = await db
        .select({
          id: giveawayEntries.id,
          userId: giveawayEntries.userId,
          entryNumber: giveawayEntries.entryNumber,
          status: giveawayEntries.status,
          createdAt: giveawayEntries.createdAt,
          userName: users.name,
          userEmail: users.email
        })
        .from(giveawayEntries)
        .leftJoin(users, eq(giveawayEntries.userId, users.id))
        .where(eq(giveawayEntries.giveawayId, giveawayId))
        .orderBy(desc(giveawayEntries.createdAt))
        .limit(10)
    }

    const now = new Date()
    const canEnter = giveaway.status === 'active' && 
                    giveaway.startDate <= now && 
                    giveaway.endDate > now && 
                    !userEntry &&
                    (giveaway.maxEntries === null || totalEntries.count < giveaway.maxEntries)

    return successResponse({
      giveaway,
      stats: {
        totalEntries: totalEntries.count,
        isActive: giveaway.status === 'active',
        timeRemaining: giveaway.endDate > now ? giveaway.endDate.getTime() - now.getTime() : 0
      },
      userEntry: userEntry || null,
      canEnter,
      recentEntries
    }, 'Giveaway retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update giveaway (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = updateGiveawaySchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const updateData = validation.data

    // Check if giveaway exists
    const [existingGiveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!existingGiveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Validate date constraints if provided
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate)
      const endDate = new Date(updateData.endDate)
      
      if (endDate <= startDate) {
        return errorResponse('End date must be after start date', 400)
      }
    }

    // Prepare update data with proper date conversion
    const updateValues: any = { ...updateData }
    if (updateData.startDate) {
      updateValues.startDate = new Date(updateData.startDate)
    }
    if (updateData.endDate) {
      updateValues.endDate = new Date(updateData.endDate)
    }

    // Add updated timestamp
    updateValues.updatedAt = new Date()

    // Update giveaway
    const [updatedGiveaway] = await db
      .update(giveaways)
      .set(updateValues)
      .where(eq(giveaways.id, giveawayId))
      .returning()

    return successResponse(updatedGiveaway, 'Giveaway updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Delete giveaway (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAdmin(request)

    // Check if giveaway exists
    const [giveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Check if giveaway can be deleted (not active or has entries)
    if (giveaway.status === 'active') {
      return errorResponse('Cannot delete an active giveaway', 400)
    }

    const [entriesCount] = await db
      .select({ count: count() })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    if (entriesCount.count > 0) {
      return errorResponse('Cannot delete giveaway with existing entries', 400)
    }

    // Delete giveaway
    await db
      .delete(giveaways)
      .where(eq(giveaways.id, giveawayId))

    return successResponse(null, 'Giveaway deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 