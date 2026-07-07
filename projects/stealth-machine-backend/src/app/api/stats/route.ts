import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Dashboard metrics. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [
      totalCustomers,
      totalMachines,
      chatSessionsToday,
      newCustomersThisWeek,
      openTickets,
      totalMaterials,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.machine.count(),
      prisma.chatSession.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportMaterial.count(),
    ]);

    return successResponse({
      totalCustomers,
      totalMachines,
      chatSessionsToday,
      newCustomersThisWeek,
      openTickets,
      totalMaterials,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return errorResponse('An error occurred', 500);
  }
}
