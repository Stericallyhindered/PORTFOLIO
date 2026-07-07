import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getAuthFromRequest, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';
import { deleteFile } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/materials/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const material = await prisma.supportMaterial.findUnique({
      where: { id },
    });

    if (!material) {
      return errorResponse('Material not found', 404);
    }

    // Check if published or admin
    const auth = await getAuthFromRequest(request);
    if (!material.isPublished && (!auth || !isAdmin(auth.role))) {
      return errorResponse('Material not found', 404);
    }

    // Increment view count
    await prisma.supportMaterial.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Log view event
    if (auth) {
      await prisma.analyticsEvent.create({
        data: {
          userId: auth.userId,
          eventType: 'material_view',
          eventData: { materialId: id, title: material.title },
        },
      });
    }

    return successResponse(material);
  } catch (error) {
    console.error('Get material error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// PUT /api/materials/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.supportMaterial.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Material not found', 404);
    }

    const {
      title,
      description,
      category,
      fileUrl,
      fileName,
      fileSize,
      thumbnailUrl,
      machineModel,
      tags,
      isPublished,
      sortOrder,
    } = body;

    // If file URL changed, delete old file
    if (fileUrl && fileUrl !== existing.fileUrl) {
      try {
        await deleteFile(existing.fileUrl);
      } catch (e) {
        console.error('Failed to delete old file:', e);
      }
    }

    const material = await prisma.supportMaterial.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(machineModel !== undefined && { machineModel }),
        ...(tags !== undefined && { tags }),
        ...(isPublished !== undefined && { isPublished }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'update',
        entityType: 'material',
        entityId: id,
        details: body,
      },
    });

    return successResponse(material);
  } catch (error) {
    console.error('Update material error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// DELETE /api/materials/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    const existing = await prisma.supportMaterial.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Material not found', 404);
    }

    // Delete file from storage
    try {
      await deleteFile(existing.fileUrl);
      if (existing.thumbnailUrl) {
        await deleteFile(existing.thumbnailUrl);
      }
    } catch (e) {
      console.error('Failed to delete files:', e);
    }

    // Delete from database
    await prisma.supportMaterial.delete({ where: { id } });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'delete',
        entityType: 'material',
        entityId: id,
        details: { title: existing.title },
      },
    });

    return successResponse({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    return errorResponse('An error occurred', 500);
  }
}
