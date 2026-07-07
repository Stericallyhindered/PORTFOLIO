import { NextRequest } from 'next/server'
import { db, users, contests, giveaways, contestSubmissions, giveawayEntries, pointsTransactions } from '@/lib/db'
import { eq, gte, count, sum } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// Check if we're in build mode
const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export'

// GET - Get admin analytics dashboard data
export async function GET(request: NextRequest) {
  // Skip during build time
  if (isBuildTime) {
    return successResponse({
      totalUsers: 0,
      newUsers: 0,
      totalContests: 0,
      activeContests: 0,
      totalGiveaways: 0,
      activeGiveaways: 0,
      totalSubmissions: 0,
      totalEntries: 0,
      pointsTransactions: 0,
      revenue: 0,
      userGrowth: [],
      contestActivity: [],
      giveawayActivity: [],
      topContests: [],
      topGiveaways: [],
      recentUsers: []
    })
  }
  
  try {
    const user = await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period, 10)
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Check if database is available
    if (!db) {
      return successResponse({
        totalUsers: 0,
        newUsers: 0,
        totalContests: 0,
        activeContests: 0,
        totalGiveaways: 0,
        activeGiveaways: 0,
        totalSubmissions: 0,
        totalEntries: 0,
        pointsTransactions: 0,
        revenue: 0,
        userGrowth: [],
        contestActivity: [],
        giveawayActivity: [],
        topContests: [],
        topGiveaways: [],
        recentUsers: []
      })
    }

    // Get overall statistics
    const [totalUsers] = await db
      .select({ count: count() })
      .from(users)

    const [newUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, startDate))

    const [totalContests] = await db
      .select({ count: count() })
      .from(contests)

    const [activeContests] = await db
      .select({ count: count() })
      .from(contests)
      .where(eq(contests.status, 'open'))

    const [totalGiveaways] = await db
      .select({ count: count() })
      .from(giveaways)

    const [activeGiveaways] = await db
      .select({ count: count() })
      .from(giveaways)
      .where(eq(giveaways.status, 'active'))

    const [totalSubmissions] = await db
      .select({ count: count() })
      .from(contestSubmissions)

    const [recentSubmissions] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(gte(contestSubmissions.createdAt, startDate))

    const [totalGiveawayEntries] = await db
      .select({ count: count() })
      .from(giveawayEntries)

    const [recentGiveawayEntries] = await db
      .select({ count: count() })
      .from(giveawayEntries)
      .where(gte(giveawayEntries.createdAt, startDate))

    // Points statistics
    const [totalPointsEarned] = await db
      .select({ total: sum(pointsTransactions.amount) })
      .from(pointsTransactions)
      .where(eq(pointsTransactions.type, 'earned'))

    const [totalPointsSpent] = await db
      .select({ total: sum(pointsTransactions.amount) })
      .from(pointsTransactions)
      .where(eq(pointsTransactions.type, 'spent'))

    const [totalPointsPurchased] = await db
      .select({ total: sum(pointsTransactions.amount) })
      .from(pointsTransactions)
      .where(eq(pointsTransactions.type, 'purchased'))

    // User engagement stats
    const [premiumUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.subscription, 'premium'))

    // Calculate growth rates
    const userGrowthRate = totalUsers.count > 0 
      ? ((newUsers.count / totalUsers.count) * 100).toFixed(1)
      : '0'

    return successResponse({
      period: `${periodDays} days`,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      overview: {
        users: {
          total: totalUsers.count,
          new: newUsers.count,
          premium: premiumUsers.count,
          growthRate: `${userGrowthRate}%`
        },
        contests: {
          total: totalContests.count,
          active: activeContests.count,
          submissions: {
            total: totalSubmissions.count,
            recent: recentSubmissions.count
          }
        },
        giveaways: {
          total: totalGiveaways.count,
          active: activeGiveaways.count,
          entries: {
            total: totalGiveawayEntries.count,
            recent: recentGiveawayEntries.count
          }
        },
        points: {
          totalEarned: Number(totalPointsEarned?.total) || 0,
          totalSpent: Math.abs(Number(totalPointsSpent?.total)) || 0,
          totalPurchased: Number(totalPointsPurchased?.total) || 0,
          netCirculation: (Number(totalPointsEarned?.total) || 0) + 
                         (Number(totalPointsPurchased?.total) || 0) + 
                         (Number(totalPointsSpent?.total) || 0)
        }
      },
      trends: {
        userSignups: newUsers.count,
        contestSubmissions: recentSubmissions.count,
        giveawayParticipation: recentGiveawayEntries.count
      },
      systemHealth: {
        activeContests: activeContests.count,
        activeGiveaways: activeGiveaways.count,
        userEngagement: {
          submissionRate: totalUsers.count > 0 
            ? ((totalSubmissions.count / totalUsers.count) * 100).toFixed(1) + '%'
            : '0%',
          giveawayParticipationRate: totalUsers.count > 0 
            ? ((totalGiveawayEntries.count / totalUsers.count) * 100).toFixed(1) + '%'
            : '0%'
        }
      }
    }, 'Analytics data retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 