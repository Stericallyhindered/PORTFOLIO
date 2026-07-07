import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, giveaways, giveawayEntries, users } from '@/lib/db'
import { eq, count, and, desc, max } from 'drizzle-orm'
import { requireAuth, checkActiveMembership } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

const giveawayEntrySchema = z.object({
  entryType: z.enum(['free', 'purchased']).optional().default('free')
})

// POST - Enter giveaway (free entry for members)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = giveawayEntrySchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { entryType } = validation.data

    // Check if user has active membership
    const membershipCheck = await checkActiveMembership(user.id)
    if (!membershipCheck.isActive) {
      return errorResponse(membershipCheck.message || 'Active membership required', 403)
    }

    // Check if giveaway exists
    const [giveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Check if giveaway is active and within entry period
    const now = new Date()
    if (giveaway.status !== 'active' || giveaway.startDate > now || giveaway.endDate <= now) {
      return errorResponse('Giveaway is not currently accepting entries', 400)
    }

    // Check if giveaway has reached max entries
    if (giveaway.maxEntries) {
      const [currentEntries] = await db
        .select({ count: count() })
        .from(giveawayEntries)
        .where(eq(giveawayEntries.giveawayId, giveawayId))

      if (currentEntries.count >= giveaway.maxEntries) {
        return errorResponse('This giveaway has reached the maximum number of entries', 400)
      }
    }

    // Check if user has already used their free entry
    if (entryType === 'free') {
      const [freeEntry] = await db
        .select()
        .from(giveawayEntries)
        .where(and(
          eq(giveawayEntries.giveawayId, giveawayId),
          eq(giveawayEntries.userId, user.id),
          eq(giveawayEntries.entryType, 'free')
        ))
        .limit(1)

      if (freeEntry) {
        return errorResponse('You have already used your free entry. You can purchase additional entries.', 400)
      }
    }

    // Get next entry number
    const [maxEntryNumber] = await db
      .select({ maxEntry: max(giveawayEntries.entryNumber) })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    const nextEntryNumber = (maxEntryNumber.maxEntry || 0) + 1

    // Create entry
    const [newEntry] = await db
      .insert(giveawayEntries)
      .values({
        giveawayId,
        userId: user.id,
        entryNumber: nextEntryNumber,
        entryType: entryType,
        status: 'entered'
      })
      .returning({
        id: giveawayEntries.id,
        giveawayId: giveawayEntries.giveawayId,
        userId: giveawayEntries.userId,
        entryNumber: giveawayEntries.entryNumber,
        entryType: giveawayEntries.entryType,
        status: giveawayEntries.status,
        createdAt: giveawayEntries.createdAt
      })

    return successResponse({
      entry: newEntry,
      giveaway: {
        id: giveaway.id,
        title: giveaway.title,
        endDate: giveaway.endDate
      },
      message: entryType === 'free' 
        ? 'Successfully entered giveaway with your free entry!' 
        : 'Successfully entered giveaway!'
    }, 'Successfully entered giveaway')

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get user's entry status and all entries
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAuth(request)

    // Check if giveaway exists
    const [giveaway] = await db
      .select({
        id: giveaways.id,
        title: giveaways.title,
        status: giveaways.status,
        startDate: giveaways.startDate,
        endDate: giveaways.endDate,
        maxEntries: giveaways.maxEntries,
        additionalEntryPrice: giveaways.additionalEntryPrice
      })
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Check membership
    const membershipCheck = await checkActiveMembership(user.id)
    const hasMembership = membershipCheck.isActive

    // Get all user's entries for this giveaway
    const userEntries = await db
      .select()
      .from(giveawayEntries)
      .where(and(
        eq(giveawayEntries.giveawayId, giveawayId),
        eq(giveawayEntries.userId, user.id)
      ))

    // Check if user has used free entry
    const hasFreeEntry = userEntries.some(entry => entry.entryType === 'free')
    const purchasedEntriesCount = userEntries.filter(entry => entry.entryType === 'purchased').length

    // Get total entries count
    const [totalEntries] = await db
      .select({ count: count() })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    const now = new Date()
    const canEnter = hasMembership && 
                    giveaway.status === 'active' && 
                    giveaway.startDate <= now && 
                    giveaway.endDate > now &&
                    (!giveaway.maxEntries || totalEntries.count < giveaway.maxEntries)

    return successResponse({
      giveaway,
      hasMembership,
      userEntries: userEntries.map(entry => ({
        id: entry.id,
        entryNumber: entry.entryNumber,
        entryType: entry.entryType,
        purchasePrice: entry.purchasePrice,
        createdAt: entry.createdAt
      })),
      hasFreeEntry,
      purchasedEntriesCount,
      totalUserEntries: userEntries.length,
      canEnter,
      canPurchaseMore: canEnter && hasFreeEntry, // Can purchase more if they've used free entry
      totalEntries: totalEntries.count,
      additionalEntryPrice: giveaway.additionalEntryPrice,
      timeRemaining: giveaway.endDate > now ? giveaway.endDate.getTime() - now.getTime() : 0
    }, 'Entry status retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
