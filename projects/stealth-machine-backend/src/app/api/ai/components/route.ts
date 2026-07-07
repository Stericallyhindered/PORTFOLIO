import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from '@/lib/utils';

// GET /api/ai/components - List components (public for AI context)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { keywords: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const [components, total] = await Promise.all([
      prisma.component.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.component.count({ where }),
    ]);

    return paginatedResponse(components, { page, limit, total });
  } catch (error) {
    console.error('List components error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/ai/components - Create component (admin)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const {
      name,
      displayName,
      description,
      category,
      keywords,
      manufacturer,
      specifications,
      sortOrder,
    } = body;

    if (!name || !displayName || !category) {
      return errorResponse('Name, display name, and category are required', 400);
    }

    const existing = await prisma.component.findUnique({ where: { name } });
    if (existing) {
      return errorResponse('A component with this name already exists', 409);
    }

    const component = await prisma.component.create({
      data: {
        name,
        displayName,
        description,
        category,
        keywords: keywords || [],
        manufacturer,
        specifications,
        sortOrder: sortOrder || 0,
      },
    });

    return successResponse(component, 201);
  } catch (error) {
    console.error('Create component error:', error);
    return errorResponse('An error occurred', 500);
  }
}
