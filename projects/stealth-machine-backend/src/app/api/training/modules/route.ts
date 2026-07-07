import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getAuthFromRequest, isAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
} from '@/lib/utils';

// GET /api/training/modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const machineModel = searchParams.get('machineModel');
    const difficulty = searchParams.get('difficulty');

    const auth = await getAuthFromRequest(request);
    const showUnpublished = auth && isAdmin(auth.role);

    const where: any = {};
    if (!showUnpublished) where.isPublished = true;
    if (machineModel) where.machineModel = machineModel;
    if (difficulty) where.difficulty = difficulty;

    const [modules, total] = await Promise.all([
      prisma.trainingModule.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          durationMins: true,
          machineModel: true,
          isPublished: true,
          sortOrder: true,
        },
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.trainingModule.count({ where }),
    ]);

    return paginatedResponse(modules, { page, limit, total });
  } catch (error) {
    console.error('List training modules error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/training/modules
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
      content,
      machineModel,
      difficulty,
      durationMins,
      prerequisites,
      objectives,
      videoUrl,
      attachments,
      quizQuestions,
      isPublished,
      sortOrder,
    } = body;

    if (!title || !description || !content || !difficulty || !durationMins) {
      return errorResponse('Title, description, content, difficulty, and duration are required', 400);
    }

    const module = await prisma.trainingModule.create({
      data: {
        title,
        description,
        content,
        machineModel,
        difficulty,
        durationMins,
        prerequisites: prerequisites || [],
        objectives: objectives || [],
        videoUrl,
        attachments: attachments || [],
        quizQuestions,
        isPublished: isPublished ?? false,
        sortOrder: sortOrder || 0,
        createdBy: authResult.user.userId,
      },
    });

    return successResponse(module, 201);
  } catch (error) {
    console.error('Create training module error:', error);
    return errorResponse('An error occurred', 500);
  }
}
