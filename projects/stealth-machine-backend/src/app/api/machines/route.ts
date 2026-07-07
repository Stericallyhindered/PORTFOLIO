import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
} from '@/lib/utils';

// GET /api/machines - List machines
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Filters
    const model = searchParams.get('model');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    // Non-admins can only see their own machines
    if (!isAdmin(authResult.user.role)) {
      where.userId = authResult.user.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (model) where.model = model;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [machines, total] = await Promise.all([
      prisma.machine.findMany({
        where,
        select: {
          id: true,
          model: true,
          serialNumber: true,
          machineType: true,
          nickname: true,
          status: true,
          purchaseDate: true,
          location: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.machine.count({ where }),
    ]);

    return paginatedResponse(machines, { page, limit, total });
  } catch (error) {
    console.error('List machines error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/machines - Create a machine
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const {
      model,
      serialNumber,
      machineType,
      nickname,
      purchaseDate,
      warrantyExpiry,
      location,
      notes,
      specifications,
      userId, // Admin can assign to another user
    } = body;

    // Validate required
    if (!model || !serialNumber || !machineType) {
      return errorResponse('Model, serial number, and machine type are required', 400);
    }

    // Check serial number unique
    const existing = await prisma.machine.findUnique({
      where: { serialNumber },
    });
    if (existing) {
      return errorResponse('A machine with this serial number already exists', 409);
    }

    // Determine owner
    let ownerId = authResult.user.userId;
    if (userId && isAdmin(authResult.user.role)) {
      // Admin can assign to another user
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return errorResponse('Target user not found', 404);
      }
      ownerId = userId;
    }

    const machine = await prisma.machine.create({
      data: {
        userId: ownerId,
        model,
        serialNumber,
        machineType,
        nickname,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        location,
        notes,
        specifications,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'create',
        entityType: 'machine',
        entityId: machine.id,
        details: { serialNumber, model },
      },
    });

    return successResponse(machine, 201);
  } catch (error) {
    console.error('Create machine error:', error);
    return errorResponse('An error occurred', 500);
  }
}
