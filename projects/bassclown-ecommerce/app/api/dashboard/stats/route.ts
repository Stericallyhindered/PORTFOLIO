import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { contestApplications, contestSubmissions, contests, paymentHistory, pointsTransactions } from '@/lib/db/schema';
import { eq, and, gte, count, sum } from 'drizzle-orm';
import { successResponse, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!db) {
      return successResponse({
        activeProjects: 0,
        contestsEntered: 0,
        reviewsSubmitted: 0,
        totalEarnings: 0
      });
    }

    // Get current date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    // Active Projects - submissions that are in progress or under review
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(
        and(
          eq(contestSubmissions.userId, user.id),
          eq(contestSubmissions.status, 'submitted')
        )
      );

    // Contests Entered - applications this month
    const [contestsEnteredResult] = await db
      .select({ count: count() })
      .from(contestApplications)
      .where(
        and(
          eq(contestApplications.userId, user.id),
          gte(contestApplications.createdAt, thisMonthStart)
        )
      );

    // Reviews Submitted - submissions awaiting approval
    const [reviewsSubmittedResult] = await db
      .select({ count: count() })
      .from(contestSubmissions)
      .where(
        and(
          eq(contestSubmissions.userId, user.id),
          eq(contestSubmissions.status, 'submitted')
        )
      );

    // Total Earnings - from payment history this quarter
    const [totalEarningsResult] = await db
      .select({ total: sum(paymentHistory.amount) })
      .from(paymentHistory)
      .where(
        and(
          eq(paymentHistory.userId, user.id),
          eq(paymentHistory.status, 'succeeded'),
          gte(paymentHistory.createdAt, thisQuarterStart)
        )
      );

    return successResponse({
      activeProjects: activeProjectsResult?.count || 0,
      contestsEntered: contestsEnteredResult?.count || 0,
      reviewsSubmitted: reviewsSubmittedResult?.count || 0,
      totalEarnings: totalEarningsResult?.total ? parseFloat(totalEarningsResult.total.toString()) : 0
    });

  } catch (error) {
    return handleApiError(error);
  }
}


