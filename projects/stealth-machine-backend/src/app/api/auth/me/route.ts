import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// Force dynamic rendering - this route uses request headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthFromRequest(request);

    if (!payload) {
      return errorResponse('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        phone: true,
        jobTitle: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            machines: true,
            tickets: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (!user.isActive) {
      return errorResponse('Account is deactivated', 401);
    }

    return successResponse({
      ...user,
      machineCount: user._count.machines,
      ticketCount: user._count.tickets,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuthFromRequest(request);

    if (!payload) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { firstName, lastName, company, phone, jobTitle } = body;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(company !== undefined && { company }),
        ...(phone !== undefined && { phone }),
        ...(jobTitle !== undefined && { jobTitle }),
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
        profileImage: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('An error occurred', 500);
  }
}
