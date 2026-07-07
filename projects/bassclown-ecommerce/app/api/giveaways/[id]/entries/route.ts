import { NextRequest } from 'next/server'
import { db, giveawayEntries } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get user's entries for a giveaway
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAuth(request)

    const entries = await db
      .select()
      .from(giveawayEntries)
      .where(and(
        eq(giveawayEntries.giveawayId, giveawayId),
        eq(giveawayEntries.userId, user.id)
      ))

    return successResponse({ entries }, 'User entries retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
