import { NextRequest } from 'next/server'
import { db, pointsTransactions, contests, giveaways } from '@/lib/db'
import { eq, desc, and, sum, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get user's points transaction history
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type') // 'earned', 'spent', 'purchased'

    // Build where conditions
    let whereClause = eq(pointsTransactions.userId, user.id)
    
    if (type && ['earned', 'spent', 'purchased'].includes(type)) {
      whereClause = and(
        eq(pointsTransactions.userId, user.id),
        eq(pointsTransactions.type, type)
      )!
    }

    // Get transactions with pagination
    const offset = (page - 1) * limit
    const transactions = await db
      .select({
        id: pointsTransactions.id,
        type: pointsTransactions.type,
        amount: pointsTransactions.amount,
        description: pointsTransactions.description,
        referenceId: pointsTransactions.referenceId,
        referenceType: pointsTransactions.referenceType,
        stripePaymentIntentId: pointsTransactions.stripePaymentIntentId,
        createdAt: pointsTransactions.createdAt
      })
      .from(pointsTransactions)
      .where(whereClause)
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(limit)
      .offset(offset)

    // Enrich transactions with reference data
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction: any) => {
        let referenceData = null

        if (transaction.referenceId && transaction.referenceType) {
          try {
            if (transaction.referenceType === 'contest') {
              const [contest] = await db
                .select({ id: contests.id, title: contests.title })
                .from(contests)
                .where(eq(contests.id, transaction.referenceId))
                .limit(1)
              referenceData = contest || null
            } else if (transaction.referenceType === 'giveaway') {
              const [giveaway] = await db
                .select({ id: giveaways.id, title: giveaways.title })
                .from(giveaways)
                .where(eq(giveaways.id, transaction.referenceId))
                .limit(1)
              referenceData = giveaway || null
            }
          } catch (error) {
            // If reference data can't be found, continue without it
            console.warn(`Could not fetch reference data for transaction ${transaction.id}:`, error)
          }
        }

        return {
          ...transaction,
          referenceData
        }
      })
    )

    // Get summary statistics
    const [earnedTotal] = await db
      .select({ 
        total: sum(pointsTransactions.amount)
      })
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, user.id),
        eq(pointsTransactions.type, 'earned')
      )!)

    const [spentTotal] = await db
      .select({ 
        total: sum(pointsTransactions.amount)
      })
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, user.id),
        eq(pointsTransactions.type, 'spent')
      )!)

    const [purchasedTotal] = await db
      .select({ 
        total: sum(pointsTransactions.amount)
      })
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, user.id),
        eq(pointsTransactions.type, 'purchased')
      )!)

    // Calculate if there are more pages
    const [totalCount] = await db
      .select({ count: count() })
      .from(pointsTransactions)
      .where(whereClause)

    const totalPages = Math.ceil(totalCount.count / limit)

    // Convert string totals to numbers
    const earnedAmount = Number(earnedTotal?.total) || 0
    const spentAmount = Number(spentTotal?.total) || 0
    const purchasedAmount = Number(purchasedTotal?.total) || 0

    return successResponse({
      transactions: enrichedTransactions,
      summary: {
        totalEarned: earnedAmount,
        totalSpent: Math.abs(spentAmount), // Convert to positive for display
        totalPurchased: purchasedAmount,
        netBalance: earnedAmount + purchasedAmount + spentAmount
      },
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Points history retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 