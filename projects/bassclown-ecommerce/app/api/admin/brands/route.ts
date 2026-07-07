import { NextRequest } from 'next/server'
import { db, contests, giveaways } from '@/lib/db'
import { isNotNull, ne, and } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get brands derived from contest brandName and giveaway sponsor
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const allContests = await db
      .select({ brandName: contests.brandName })
      .from(contests)
      .where(and(isNotNull(contests.brandName), ne(contests.brandName, '')))

    const allGiveaways = await db
      .select({ sponsor: giveaways.sponsor })
      .from(giveaways)
      .where(and(isNotNull(giveaways.sponsor), ne(giveaways.sponsor, '')))

    const brandMap = new Map<
      string,
      { name: string; contestsSponsored: number; giveawaysSponsored: number }
    >()

    for (const row of allContests) {
      const name = (row.brandName || '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      const existing = brandMap.get(key)
      if (existing) {
        existing.contestsSponsored += 1
      } else {
        brandMap.set(key, { name, contestsSponsored: 1, giveawaysSponsored: 0 })
      }
    }

    for (const row of allGiveaways) {
      const name = (row.sponsor || '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      const existing = brandMap.get(key)
      if (existing) {
        existing.giveawaysSponsored += 1
      } else {
        brandMap.set(key, { name, contestsSponsored: 0, giveawaysSponsored: 1 })
      }
    }

    const brands = Array.from(brandMap.values()).map((b) => ({
      id: b.name.replace(/\s+/g, '-').toLowerCase(),
      name: b.name,
      contestsSponsored: b.contestsSponsored,
      giveawaysSponsored: b.giveawaysSponsored,
      totalSponsored: b.contestsSponsored + b.giveawaysSponsored,
      status: 'active' as const,
    }))

    return successResponse(
      { brands, total: brands.length },
      'Brands retrieved successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
