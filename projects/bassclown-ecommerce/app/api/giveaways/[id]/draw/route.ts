import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, giveaways, giveawayEntries, giveawayWinners, users, notifications } from '@/lib/db'
import { eq, and, notInArray, count } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

const drawWinnersSchema = z.object({
  numberOfWinners: z.number().min(1, 'Must select at least 1 winner').max(10, 'Maximum 10 winners at once'),
  excludeUserIds: z.array(z.string().uuid()).optional(),
  requireConfirmation: z.boolean().default(true)
})

// POST - Draw winners for giveaway
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = drawWinnersSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { numberOfWinners, excludeUserIds = [], requireConfirmation } = validation.data

    // Check if giveaway exists
    const [giveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Check if giveaway can have winners drawn
    if (giveaway.status !== 'active') {
      return errorResponse('Giveaway must be active to draw winners', 400)
    }

    const now = new Date()
    if (giveaway.endDate > now) {
      return errorResponse('Cannot draw winners before giveaway end date', 400)
    }

    // Check if winners have already been drawn
    const [existingWinners] = await db
      .select({ count: count() })
      .from(giveawayWinners)
      .where(eq(giveawayWinners.giveawayId, giveawayId))

    if (existingWinners.count > 0) {
      return errorResponse('Winners have already been drawn for this giveaway', 400)
    }

    // Build where conditions for eligible entries
    let whereConditions = and(
      eq(giveawayEntries.giveawayId, giveawayId),
      eq(giveawayEntries.status, 'entered')
    )

    // Add exclusion condition if needed
    if (excludeUserIds.length > 0) {
      whereConditions = and(
        whereConditions!,
        notInArray(giveawayEntries.userId, excludeUserIds)
      )
    }

    // Get all eligible entries
    const eligibleEntries = await db
      .select({
        id: giveawayEntries.id,
        userId: giveawayEntries.userId,
        entryNumber: giveawayEntries.entryNumber
      })
      .from(giveawayEntries)
      .where(whereConditions!)

    if (eligibleEntries.length === 0) {
      return errorResponse('No eligible entries found for this giveaway', 400)
    }

    if (numberOfWinners > eligibleEntries.length) {
      return errorResponse(`Cannot select ${numberOfWinners} winners from ${eligibleEntries.length} entries`, 400)
    }

    // Randomly select winners
    const shuffledEntries = [...eligibleEntries].sort(() => Math.random() - 0.5)
    const selectedEntries = shuffledEntries.slice(0, numberOfWinners)

    // Set prize claim deadline (30 days from now)
    const prizeClaimDeadline = new Date()
    prizeClaimDeadline.setDate(prizeClaimDeadline.getDate() + 30)

    // Create winner records
    const winnerRecords = await Promise.all(
      selectedEntries.map(async (entry) => {
        const [winner] = await db
          .insert(giveawayWinners)
          .values({
            giveawayId,
            userId: entry.userId,
            entryId: entry.id,
            selectedAt: new Date(),
            prizeClaimStatus: 'pending',
            prizeClaimDeadline
          })
          .returning()

        return winner
      })
    )

    // Update giveaway status to completed
    await db
      .update(giveaways)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(giveaways.id, giveawayId))

    // Get winner details with user information
    const winnersWithDetails = await Promise.all(
      winnerRecords.map(async (winner) => {
        const [userData] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email
          })
          .from(users)
          .where(eq(users.id, winner.userId))
          .limit(1)

        const [entryData] = await db
          .select({
            entryNumber: giveawayEntries.entryNumber
          })
          .from(giveawayEntries)
          .where(eq(giveawayEntries.id, winner.entryId))
          .limit(1)

        return {
          ...winner,
          user: userData,
          entryNumber: entryData?.entryNumber
        }
      })
    )

    // Send notifications to winners
    await Promise.all(
      winnersWithDetails.map(async (winner) => {
        if (winner.user) {
          await db
            .insert(notifications)
            .values({
              userId: winner.user.id,
              type: 'giveaway_winner',
              title: 'Congratulations! You won a giveaway!',
              message: `You've won the "${giveaway.title}" giveaway! Please check your email for instructions on claiming your prize.`,
              metadata: {
                giveawayId,
                giveawayTitle: giveaway.title,
                winnerId: winner.id,
                prizeClaimDeadline: winner.prizeClaimDeadline
              }
            })
        }
      })
    )

    return successResponse({
      giveaway: {
        id: giveaway.id,
        title: giveaway.title,
        status: 'completed'
      },
      winners: winnersWithDetails,
      drawDetails: {
        totalEligibleEntries: eligibleEntries.length,
        winnersSelected: numberOfWinners,
        drawnAt: new Date(),
        drawnBy: user.id,
        prizeClaimDeadline
      }
    }, `Successfully drew ${numberOfWinners} winner(s) for giveaway`)

  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Get giveaway drawing status
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get entry statistics
    const [totalEntries] = await db
      .select({ count: count() })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    // Check if winners have been drawn
    const [winnersCount] = await db
      .select({ count: count() })
      .from(giveawayWinners)
      .where(eq(giveawayWinners.giveawayId, giveawayId))

    // Get existing winners if any
    let winners = null
    if (winnersCount.count > 0) {
      winners = await db
        .select({
          id: giveawayWinners.id,
          userId: giveawayWinners.userId,
          selectedAt: giveawayWinners.selectedAt,
          prizeClaimStatus: giveawayWinners.prizeClaimStatus,
          userName: users.name,
          userEmail: users.email
        })
        .from(giveawayWinners)
        .leftJoin(users, eq(giveawayWinners.userId, users.id))
        .where(eq(giveawayWinners.giveawayId, giveawayId))
    }

    const now = new Date()
    const canDraw = giveaway.status === 'active' && 
                   giveaway.endDate <= now && 
                   winnersCount.count === 0 &&
                   totalEntries.count > 0

    return successResponse({
      giveaway: {
        id: giveaway.id,
        title: giveaway.title,
        status: giveaway.status,
        endDate: giveaway.endDate
      },
      stats: {
        totalEntries: totalEntries.count,
        winnersDrawn: winnersCount.count,
        hasEnded: giveaway.endDate <= now
      },
      canDraw,
      winners,
      eligibilityCheck: {
        isActive: giveaway.status === 'active',
        hasEnded: giveaway.endDate <= now,
        hasEntries: totalEntries.count > 0,
        winnersAlreadyDrawn: winnersCount.count > 0
      }
    }, 'Drawing status retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 