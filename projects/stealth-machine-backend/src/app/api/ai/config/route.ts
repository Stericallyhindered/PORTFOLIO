import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getAuthFromRequest, isAdmin } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// GET /api/ai/config - Get AI configuration
export async function GET(request: NextRequest) {
  try {
    // Public configs for Flutter app
    const auth = await getAuthFromRequest(request);
    
    const configs = await prisma.aIConfig.findMany({
      select: {
        id: true,
        key: true,
        value: true,
        type: true,
        description: true,
        updatedAt: true,
      },
    });

    // Non-admins only get specific public configs
    if (!auth || !isAdmin(auth.role)) {
      const publicKeys = ['model', 'max_tokens'];
      return successResponse(
        configs
          .filter((c) => publicKeys.includes(c.key))
          .reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {})
      );
    }

    return successResponse(configs);
  } catch (error) {
    console.error('Get AI config error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/ai/config - Create/update AI configuration (admin)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { key, value, type, description } = body;

    if (!key || value === undefined) {
      return errorResponse('Key and value are required', 400);
    }

    const config = await prisma.aIConfig.upsert({
      where: { key },
      create: {
        key,
        value: String(value),
        type: type || 'string',
        description,
        updatedBy: authResult.user.userId,
      },
      update: {
        value: String(value),
        type: type || 'string',
        description,
        updatedBy: authResult.user.userId,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'update',
        entityType: 'ai_config',
        entityId: config.id,
        details: { key, value },
      },
    });

    return successResponse(config);
  } catch (error) {
    console.error('Update AI config error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// PUT /api/ai/config - Bulk update configs
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { configs } = body; // Array of { key, value, type?, description? }

    if (!Array.isArray(configs)) {
      return errorResponse('Configs must be an array', 400);
    }

    const results = await Promise.all(
      configs.map((c: any) =>
        prisma.aIConfig.upsert({
          where: { key: c.key },
          create: {
            key: c.key,
            value: String(c.value),
            type: c.type || 'string',
            description: c.description,
            updatedBy: authResult.user.userId,
          },
          update: {
            value: String(c.value),
            type: c.type,
            description: c.description,
            updatedBy: authResult.user.userId,
          },
        })
      )
    );

    return successResponse(results);
  } catch (error) {
    console.error('Bulk update AI config error:', error);
    return errorResponse('An error occurred', 500);
  }
}
