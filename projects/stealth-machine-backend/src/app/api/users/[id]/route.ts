import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, isStrongPassword } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        phone: true,
        jobTitle: true,
        employeeId: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        machines: {
          select: {
            id: true,
            model: true,
            serialNumber: true,
            machineType: true,
            status: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            tickets: true,
            chatMessages: true,
            trainingProgress: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      ...user,
      ticketCount: user._count.tickets,
      chatCount: user._count.chatMessages,
      trainingCount: user._count.trainingProgress,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      role,
      company,
      phone,
      jobTitle,
      employeeId,
      isActive,
      password,
    } = body;

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('User not found', 404);
    }

    // Only super admin can modify super admin accounts
    if (existing.role === 'SUPER_ADMIN' && authResult.user.role !== 'SUPER_ADMIN') {
      return errorResponse('Cannot modify super admin accounts', 403);
    }

    // Only super admin can create/modify super admin role
    if (role === 'SUPER_ADMIN' && authResult.user.role !== 'SUPER_ADMIN') {
      return errorResponse('Only super admins can assign super admin role', 403);
    }

    // Validate password if provided
    let passwordHash: string | undefined;
    if (password) {
      if (!isStrongPassword(password)) {
        return errorResponse(
          'Password must be at least 8 characters with uppercase, lowercase, and number',
          400
        );
      }
      passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(company !== undefined && { company }),
        ...(phone !== undefined && { phone }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(employeeId !== undefined && { employeeId }),
        ...(isActive !== undefined && { isActive }),
        ...(passwordHash && { passwordHash }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        phone: true,
        jobTitle: true,
        employeeId: true,
        isActive: true,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'update',
        entityType: 'user',
        entityId: user.id,
        details: body,
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, ['SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    // Can't delete yourself
    if (id === authResult.user.userId) {
      return errorResponse('Cannot delete your own account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'delete',
        entityType: 'user',
        entityId: id,
        details: { email: user.email },
      },
    });

    return successResponse({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('An error occurred', 500);
  }
}
