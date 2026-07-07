import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { contestSubmissions, contests } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { successResponse, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!db) {
      return successResponse([]);
    }

    // Get recent submissions for the user
    const recentSubmissions = await db
      .select({
        id: contestSubmissions.id,
        title: contestSubmissions.title,
        status: contestSubmissions.status,
        fileType: contestSubmissions.fileType,
        createdAt: contestSubmissions.createdAt,
        updatedAt: contestSubmissions.updatedAt,
        contestTitle: contests.title,
        contestId: contests.id
      })
      .from(contestSubmissions)
      .innerJoin(contests, eq(contestSubmissions.contestId, contests.id))
      .where(eq(contestSubmissions.userId, user.id))
      .orderBy(desc(contestSubmissions.updatedAt))
      .limit(4);

    const formatted = recentSubmissions.map(sub => {
      const statusMap: Record<string, string> = {
        'submitted': 'Under Review',
        'approved': 'Completed',
        'rejected': 'Completed',
        'draft': 'Draft'
      };

      const typeMap: Record<string, string> = {
        'video': 'Contest Entry',
        'image': 'Contest Entry',
        'text': 'Product Review'
      };

      const now = new Date();
      const updated = sub.updatedAt ? new Date(sub.updatedAt) : new Date(sub.createdAt || now);
      const diffMs = now.getTime() - updated.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let lastUpdated = '';
      if (diffHours < 1) {
        lastUpdated = 'Just now';
      } else if (diffHours < 24) {
        lastUpdated = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        lastUpdated = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      return {
        id: sub.id,
        title: sub.title || sub.contestTitle,
        status: statusMap[sub.status] || 'In Progress',
        lastUpdated,
        type: typeMap[sub.fileType] || 'Contest Entry',
        progress: sub.status === 'approved' ? 100 : sub.status === 'submitted' ? 75 : 25
      };
    });

    return successResponse(formatted);

  } catch (error) {
    return handleApiError(error);
  }
}

