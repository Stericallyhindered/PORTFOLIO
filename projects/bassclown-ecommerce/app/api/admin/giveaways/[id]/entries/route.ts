import { NextRequest } from 'next/server'
import { db, giveawayEntries, giveaways, users } from '@/lib/db'
import { eq, desc, count } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get all entries for a giveaway (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: giveawayId } = await params
    await requireAdmin(request)

    const [giveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    const entries = await db
      .select({
        id: giveawayEntries.id,
        userId: giveawayEntries.userId,
        entryNumber: giveawayEntries.entryNumber,
        entryType: giveawayEntries.entryType,
        purchasePrice: giveawayEntries.purchasePrice,
        status: giveawayEntries.status,
        createdAt: giveawayEntries.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(giveawayEntries)
      .leftJoin(users, eq(giveawayEntries.userId, users.id))
      .where(eq(giveawayEntries.giveawayId, giveawayId))
      .orderBy(desc(giveawayEntries.createdAt))
      .limit(limit)
      .offset(offset)

    const [totalCount] = await db
      .select({ count: count() })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    const totalPages = Math.ceil(totalCount.count / limit)

    return successResponse(
      {
        giveaway: { id: giveaway.id, title: giveaway.title },
        entries,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      'Entries retrieved successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
