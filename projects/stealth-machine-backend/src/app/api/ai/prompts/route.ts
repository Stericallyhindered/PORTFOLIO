import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// GET /api/ai/prompts - List all prompts (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const prompts = await prisma.aIPrompt.findMany({
      orderBy: { name: 'asc' },
    });

    return successResponse(prompts);
  } catch (error) {
    console.error('List prompts error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/ai/prompts - Create new prompt
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { name, displayName, prompt, description, variables, isActive } = body;

    if (!name || !displayName || !prompt) {
      return errorResponse('Name, display name, and prompt are required', 400);
    }

    // Check unique
    const existing = await prisma.aIPrompt.findUnique({ where: { name } });
    if (existing) {
      return errorResponse('A prompt with this name already exists', 409);
    }

    const newPrompt = await prisma.aIPrompt.create({
      data: {
        name,
        displayName,
        prompt,
        description,
        variables: variables || [],
        isActive: isActive ?? true,
        updatedBy: authResult.user.userId,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'create',
        entityType: 'ai_prompt',
        entityId: newPrompt.id,
        details: { name, displayName },
      },
    });

    return successResponse(newPrompt, 201);
  } catch (error) {
    console.error('Create prompt error:', error);
    return errorResponse('An error occurred', 500);
  }
}
