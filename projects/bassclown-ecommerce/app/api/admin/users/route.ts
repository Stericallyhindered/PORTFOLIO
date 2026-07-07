import { NextRequest } from 'next/server'
import { db, users } from '@/lib/db'
import { eq, or, like, desc, count, and } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const offset = (page - 1) * limit

    const conditions = []
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      )
    }
    if (role) {
      conditions.push(eq(users.role, role))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        emailVerified: users.emailVerified,
        pointsBalance: users.pointsBalance,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    const [totalCount] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause)

    const [activeCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.emailVerified, true))

    const [creatorsCount] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, 'active'),
          or(eq(users.subscription, 'pro'), eq(users.subscription, 'premium'))
        )
      )

    const totalPages = Math.ceil(totalCount.count / limit)

    return successResponse({
      users: usersList,
      stats: {
        total: totalCount.count,
        active: activeCount.count,
        creators: creatorsCount.count,
      },
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, 'Users retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
