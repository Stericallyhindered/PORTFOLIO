import { NextRequest } from 'next/server'
import { db, users, pointsTransactions } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get user's points balance
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get user's current points balance
    const [userPoints] = await db
      .select({
        pointsBalance: users.pointsBalance
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    // Get recent transactions (last 10)
    const recentTransactions = await db
      .select({
        id: pointsTransactions.id,
        type: pointsTransactions.type,
        amount: pointsTransactions.amount,
        description: pointsTransactions.description,
        referenceType: pointsTransactions.referenceType,
        createdAt: pointsTransactions.createdAt
      })
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, user.id))
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(10)

    return successResponse({
      balance: userPoints?.pointsBalance || 0,
      recentTransactions
    }, 'Points balance retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 