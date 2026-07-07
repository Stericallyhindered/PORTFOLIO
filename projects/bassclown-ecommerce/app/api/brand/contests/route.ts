import { NextRequest } from 'next/server';
import { requireBrand } from '@/lib/auth';
import { db } from '@/lib/db';
import { contests, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { successResponse, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const brandUser = await requireBrand(request);

    if (!db) {
      return successResponse([]);
    }

    // Get contests created by this brand
    const brandContests = await db
      .select({
        id: contests.id,
        title: contests.title,
        description: contests.description,
        shortDescription: contests.shortDescription,
        image: contests.image,
        prize: contests.prize,
        startDate: contests.startDate,
        endDate: contests.endDate,
        applicationDeadline: contests.applicationDeadline,
        submissionDeadline: contests.submissionDeadline,
        status: contests.status,
        category: contests.category,
        requirements: contests.requirements,
        judges: contests.judges,
        maxParticipants: contests.maxParticipants,
        currentParticipants: contests.currentParticipants,
        rules: contests.rules,
        submissionGuidelines: contests.submissionGuidelines,
        createdBy: contests.createdBy,
        createdAt: contests.createdAt,
        updatedAt: contests.updatedAt,
        creatorName: users.name
      })
      .from(contests)
      .leftJoin(users, eq(contests.createdBy, users.id))
      .where(eq(contests.createdBy, brandUser.id))
      .orderBy(desc(contests.createdAt));

    return successResponse(brandContests);

  } catch (error) {
    return handleApiError(error);
  }
}


