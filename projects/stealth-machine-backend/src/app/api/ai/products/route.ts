import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getAuthFromRequest, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from '@/lib/utils';

// GET /api/ai/products - List products (public for AI context)
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
        { modelCode: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { keywords: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return paginatedResponse(products, { page, limit, total });
  } catch (error) {
    console.error('List products error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/ai/products - Create product (admin)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const {
      modelCode,
      displayName,
      description,
      category,
      keywords,
      specifications,
      features,
      relatedMaterials,
      sortOrder,
    } = body;

    if (!modelCode || !displayName || !category) {
      return errorResponse('Model code, display name, and category are required', 400);
    }

    const existing = await prisma.product.findUnique({ where: { modelCode } });
    if (existing) {
      return errorResponse('A product with this model code already exists', 409);
    }

    const product = await prisma.product.create({
      data: {
        modelCode,
        displayName,
        description,
        category,
        keywords: keywords || [],
        specifications,
        features: features || [],
        relatedMaterials: relatedMaterials || [],
        sortOrder: sortOrder || 0,
      },
    });

    return successResponse(product, 201);
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse('An error occurred', 500);
  }
}
