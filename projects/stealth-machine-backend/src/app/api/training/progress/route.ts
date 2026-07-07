import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// GET /api/training/progress - Get user's progress
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Admins can view any user's progress
    const targetUserId = isAdmin(authResult.user.role) && userId
      ? userId
      : authResult.user.userId;

    const progress = await prisma.trainingProgress.findMany({
      where: { userId: targetUserId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            durationMins: true,
          },
        },
      },
    });

    return successResponse(progress);
  } catch (error) {
    console.error('Get training progress error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/training/progress - Update progress
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { moduleId, status, progress, quizScore } = body;

    if (!moduleId) {
      return errorResponse('Module ID is required', 400);
    }

    // Check module exists
    const module = await prisma.trainingModule.findUnique({ where: { id: moduleId } });
    if (!module) {
      return errorResponse('Training module not found', 404);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (quizScore !== undefined) updateData.quizScore = quizScore;
    
    if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    const trainingProgress = await prisma.trainingProgress.upsert({
      where: {
        userId_moduleId: {
          userId: authResult.user.userId,
          moduleId,
        },
      },
      create: {
        userId: authResult.user.userId,
        moduleId,
        ...updateData,
      },
      update: updateData,
    });

    return successResponse(trainingProgress);
  } catch (error) {
    console.error('Update training progress error:', error);
    return errorResponse('An error occurred', 500);
  }
}
