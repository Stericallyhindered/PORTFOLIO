import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getAuthFromRequest, isAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
} from '@/lib/utils';

// Force dynamic rendering - this route uses database and request headers
export const dynamic = 'force-dynamic';

// GET /api/materials - List materials (public for Flutter app)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Filters
    const category = searchParams.get('category');
    const machineModel = searchParams.get('machineModel');
    const fileType = searchParams.get('fileType');
    const search = searchParams.get('search');
    const isPublished = searchParams.get('isPublished');

    // Build where clause
    const where: any = {};

    // Non-admin users only see published materials
    const auth = await getAuthFromRequest(request);
    if (!auth || !isAdmin(auth.role)) {
      where.isPublished = true;
    } else if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }

    if (category) where.category = category;
    if (machineModel) where.machineModel = machineModel;
    if (fileType) where.fileType = fileType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.supportMaterial.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          fileType: true,
          fileUrl: true,
          thumbnailUrl: true,
          machineModel: true,
          tags: true,
          isPublished: true,
          viewCount: true,
          sortOrder: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.supportMaterial.count({ where }),
    ]);

    return paginatedResponse(materials, { page, limit, total });
  } catch (error) {
    console.error('List materials error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/materials - Create material (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      fileType,
      fileUrl,
      fileName,
      fileSize,
      thumbnailUrl,
      machineModel,
      tags,
      isPublished,
      sortOrder,
    } = body;

    // Validate required
    if (!title || !category || !fileType || !fileUrl || !fileName) {
      return errorResponse('Title, category, file type, file URL, and file name are required', 400);
    }

    const material = await prisma.supportMaterial.create({
      data: {
        title,
        description,
        category,
        fileType,
        fileUrl,
        fileName,
        fileSize,
        thumbnailUrl,
        machineModel,
        tags: tags || [],
        isPublished: isPublished ?? true,
        sortOrder: sortOrder || 0,
        createdBy: authResult.user.userId,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'create',
        entityType: 'material',
        entityId: material.id,
        details: { title, category, fileType },
      },
    });

    return successResponse(material, 201);
  } catch (error) {
    console.error('Create material error:', error);
    return errorResponse('An error occurred', 500);
  }
}
