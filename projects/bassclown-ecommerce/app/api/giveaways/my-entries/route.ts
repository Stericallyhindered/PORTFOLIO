import { NextRequest } from 'next/server'
import { db, giveaways, giveawayEntries, giveawayWinners, users } from '@/lib/db'
import { eq, and, desc, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get all giveaway entries for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get all entries for the user with giveaway details
    const userEntries = await db
      .select({
        entry: giveawayEntries,
        giveaway: giveaways,
        winner: giveawayWinners
      })
      .from(giveawayEntries)
      .innerJoin(giveaways, eq(giveawayEntries.giveawayId, giveaways.id))
      .leftJoin(giveawayWinners, and(
        eq(giveawayWinners.giveawayId, giveaways.id),
        eq(giveawayWinners.userId, user.id)
      ))
      .where(eq(giveawayEntries.userId, user.id))
      .orderBy(desc(giveawayEntries.createdAt))

    // Transform data to match Entry interface
    const entries = userEntries.map(({ entry, giveaway, winner }) => {
      const now = new Date()
      const startDate = giveaway.startDate instanceof Date ? giveaway.startDate : new Date(giveaway.startDate)
      const endDate = giveaway.endDate instanceof Date ? giveaway.endDate : new Date(giveaway.endDate)
      
      // Determine status
      let status: 'active' | 'upcoming' | 'ended' = 'ended'
      if (giveaway.status === 'active' && now >= startDate && now <= endDate) {
        status = 'active'
      } else if (giveaway.status === 'upcoming' || now < startDate) {
        status = 'upcoming'
      } else {
        status = 'ended'
      }

      // Determine user result
      let userResult: 'won' | 'lost' | 'pending' | undefined = undefined
      if (status === 'ended') {
        if (winner) {
          userResult = 'won'
        } else {
          userResult = 'lost'
        }
      } else {
        userResult = 'pending'
      }

      return {
        id: giveaway.id,
        title: giveaway.title,
        description: giveaway.description || '',
        prizeValue: giveaway.prizeValue || 'Prize TBD',
        entryCount: 0, // Will be calculated separately
        maxEntries: giveaway.maxEntries || null,
        entryNumber: entry.entryNumber || 0,
        entryDate: entry.createdAt instanceof Date 
          ? entry.createdAt 
          : entry.createdAt 
            ? new Date(entry.createdAt)
            : new Date(),
        startDate,
        endDate,
        status,
        userResult,
        image: giveaway.image || '/images/giveaway-fishing-gear.jpg'
      }
    })

    // Get entry counts for each giveaway
    const entriesWithCounts = await Promise.all(
      entries.map(async (entry) => {
        const [countResult] = await db
          .select({ count: count() })
          .from(giveawayEntries)
          .where(eq(giveawayEntries.giveawayId, entry.id))

        return {
          ...entry,
          entryCount: countResult?.count || 0
        }
      })
    )

    return successResponse({
      entries: entriesWithCounts
    }, 'User entries retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

