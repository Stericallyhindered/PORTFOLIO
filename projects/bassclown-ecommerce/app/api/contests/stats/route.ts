import { NextRequest } from 'next/server'
import { db, contests, contestApplications } from '@/lib/db'
import { count, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get contest statistics
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    // Get total applications across all contests
    const [totalApps] = await db
      .select({ count: count() })
      .from(contestApplications)

    // Get total contests
    const [totalContests] = await db
      .select({ count: count() })
      .from(contests)

    return successResponse({
      totalApplications: totalApps.count,
      totalContests: totalContests.count,
    }, 'Contest stats retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
