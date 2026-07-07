import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/machines/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!machine) {
      return errorResponse('Machine not found', 404);
    }

    // Check access
    if (!isAdmin(authResult.user.role) && machine.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    return successResponse(machine);
  } catch (error) {
    console.error('Get machine error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// PUT /api/machines/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;
    const body = await request.json();

    // Check machine exists and access
    const existing = await prisma.machine.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Machine not found', 404);
    }
    if (!isAdmin(authResult.user.role) && existing.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    const {
      nickname,
      status,
      location,
      notes,
      specifications,
      purchaseDate,
      warrantyExpiry,
    } = body;

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(status && { status }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(specifications !== undefined && { specifications }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(warrantyExpiry !== undefined && { warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null }),
      },
    });

    return successResponse(machine);
  } catch (error) {
    console.error('Update machine error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// DELETE /api/machines/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    const existing = await prisma.machine.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Machine not found', 404);
    }
    if (!isAdmin(authResult.user.role) && existing.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    await prisma.machine.delete({ where: { id } });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'delete',
        entityType: 'machine',
        entityId: id,
        details: { serialNumber: existing.serialNumber },
      },
    });

    return successResponse({ message: 'Machine deleted successfully' });
  } catch (error) {
    console.error('Delete machine error:', error);
    return errorResponse('An error occurred', 500);
  }
}
