import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// GET /api/machines/types - List machine types (public for dropdowns)
export async function GET(request: NextRequest) {
  try {
    // This endpoint is public for Flutter app dropdowns
    const types = await prisma.machineType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        modelCode: true,
        displayName: true,
        category: true,
        imageUrl: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(types);
  } catch (error) {
    console.error('List machine types error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/machines/types - Create machine type (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { modelCode, displayName, description, category, imageUrl, specifications, sortOrder } =
      body;

    if (!modelCode || !displayName || !category) {
      return errorResponse('Model code, display name, and category are required', 400);
    }

    // Check unique
    const existing = await prisma.machineType.findUnique({ where: { modelCode } });
    if (existing) {
      return errorResponse('A machine type with this model code already exists', 409);
    }

    const machineType = await prisma.machineType.create({
      data: {
        modelCode,
        displayName,
        description,
        category,
        imageUrl,
        specifications,
        sortOrder: sortOrder || 0,
      },
    });

    return successResponse(machineType, 201);
  } catch (error) {
    console.error('Create machine type error:', error);
    return errorResponse('An error occurred', 500);
  }
}
