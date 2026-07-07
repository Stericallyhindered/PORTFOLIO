import { NextRequest } from 'next/server'
import { db, users, contestApplications, contestSubmissions, portfolioVideos } from '@/lib/db'
import { eq, and, or, like, count } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get all creators (users with active membership)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build query conditions - only users with active paid membership
    const now = new Date()
    const conditions = [
      eq(users.subscriptionStatus, 'active'),
      or(
        eq(users.subscription, 'pro'),
        eq(users.subscription, 'premium')
      )
    ]

    // Add search condition if provided
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )!
      )
    }

    // Get creators with social links and stats
    const offset = (page - 1) * limit
    const creators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        location: users.location,
        website: users.website,
        socialLinks: users.socialLinks,
        bio: users.bio,
        avatar: users.avatar,
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPeriodStart: users.subscriptionPeriodStart,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [totalCount] = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(and(...conditions))

    // Calculate stats for each creator
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        // Get contest applications count
        const [applicationsCount] = await db
          .select({ count: count() })
          .from(contestApplications)
          .where(eq(contestApplications.userId, creator.id))

        // Get contest submissions count
        const [submissionsCount] = await db
          .select({ count: count() })
          .from(contestSubmissions)
          .where(eq(contestSubmissions.userId, creator.id))

        return {
          ...creator,
          stats: {
            contestApplications: applicationsCount.count,
            contestSubmissions: submissionsCount.count
          }
        }
      })
    )

    const totalPages = Math.ceil(totalCount.count / limit)

    return successResponse({
      creators: creatorsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Creators retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}
