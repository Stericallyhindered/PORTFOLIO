import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, getPaginationParams, paginatedResponse } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers
 * List customers (Users with role CUSTOMER) and chat session summaries. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const hasMachine = searchParams.get('hasMachine'); // 'true' to filter only with machines
    const machineModel = searchParams.get('machineModel') || ''; // e.g. "SL-4020"

    const where: any = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (machineModel) {
      where.machines = { some: { model: { contains: machineModel, mode: 'insensitive' } } };
    } else if (hasMachine === 'true') {
      where.machines = { some: {} };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          phone: true,
          createdAt: true,
          lastLoginAt: true,
          machines: {
            select: { id: true, model: true, serialNumber: true, status: true },
          },
          _count: {
            select: { machines: true, tickets: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, { page, limit, total });
  } catch (error) {
    console.error('List customers error:', error);
    return errorResponse('An error occurred', 500);
  }
}
