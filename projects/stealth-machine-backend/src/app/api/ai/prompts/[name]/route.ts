import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getAuthFromRequest, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ name: string }>;
}

// GET /api/ai/prompts/[name] - Get single prompt
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    
    // Allow internal API calls to get active prompts
    const prompt = await prisma.aIPrompt.findUnique({
      where: { name },
    });

    if (!prompt) {
      return errorResponse('Prompt not found', 404);
    }

    // Non-admins can only see active prompts (for internal use)
    const auth = await getAuthFromRequest(request);
    if (!auth || !isAdmin(auth.role)) {
      if (!prompt.isActive) {
        return errorResponse('Prompt not found', 404);
      }
      // Return only the prompt text for non-admins
      return successResponse({ prompt: prompt.prompt });
    }

    return successResponse(prompt);
  } catch (error) {
    console.error('Get prompt error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// PUT /api/ai/prompts/[name] - Update prompt
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { name } = await params;
    const body = await request.json();

    const existing = await prisma.aIPrompt.findUnique({ where: { name } });
    if (!existing) {
      return errorResponse('Prompt not found', 404);
    }

    const { displayName, prompt, description, variables, isActive } = body;

    const updated = await prisma.aIPrompt.update({
      where: { name },
      data: {
        ...(displayName && { displayName }),
        ...(prompt && { prompt, version: { increment: 1 } }),
        ...(description !== undefined && { description }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: authResult.user.userId,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'update',
        entityType: 'ai_prompt',
        entityId: updated.id,
        details: { name, changes: body },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update prompt error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// DELETE /api/ai/prompts/[name] - Delete prompt
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { name } = await params;

    // Don't allow deleting core prompts
    const corePrompts = ['main_system', 'troubleshooting', 'safety'];
    if (corePrompts.includes(name)) {
      return errorResponse('Cannot delete core system prompts', 400);
    }

    const existing = await prisma.aIPrompt.findUnique({ where: { name } });
    if (!existing) {
      return errorResponse('Prompt not found', 404);
    }

    await prisma.aIPrompt.delete({ where: { name } });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'delete',
        entityType: 'ai_prompt',
        entityId: existing.id,
        details: { name },
      },
    });

    return successResponse({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    return errorResponse('An error occurred', 500);
  }
}
