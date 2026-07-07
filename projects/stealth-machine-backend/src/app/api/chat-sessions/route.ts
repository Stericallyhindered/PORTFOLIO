import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, getPaginationParams, paginatedResponse } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat-sessions
 * List chat sessions (for admin metrics and customer view). Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const customerId = searchParams.get('customerId');
    const since = searchParams.get('since'); // ISO date - sessions created after this

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (since) {
      const date = new Date(since);
      if (!isNaN(date.getTime())) where.createdAt = { gte: date };
    }

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        select: {
          id: true,
          sessionId: true,
          customerId: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          machineModel: true,
          serialNumber: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatSession.count({ where }),
    ]);

    return paginatedResponse(sessions, { page, limit, total });
  } catch (error) {
    console.error('List chat sessions error:', error);
    return errorResponse('An error occurred', 500);
  }
}
