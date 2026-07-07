import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// Force dynamic rendering - this route uses database
export const dynamic = 'force-dynamic';

// GET /api/materials/categories - List categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.materialCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(categories);
  } catch (error) {
    console.error('List categories error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/materials/categories - Create category (admin)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { name, displayName, description, icon, color, sortOrder } = body;

    if (!name || !displayName) {
      return errorResponse('Name and display name are required', 400);
    }

    // Check unique
    const existing = await prisma.materialCategory.findUnique({ where: { name } });
    if (existing) {
      return errorResponse('Category already exists', 409);
    }

    const category = await prisma.materialCategory.create({
      data: {
        name,
        displayName,
        description,
        icon,
        color,
        sortOrder: sortOrder || 0,
      },
    });

    return successResponse(category, 201);
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse('An error occurred', 500);
  }
}
