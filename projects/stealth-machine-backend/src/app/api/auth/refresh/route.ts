import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthFromRequest, createToken, setAuthCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthFromRequest(request);

    if (!payload) {
      return errorResponse('Invalid or expired token', 401);
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      return errorResponse('User not found or inactive', 401);
    }

    // Create new token
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set new cookie
    await setAuthCookie(token);

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse('An error occurred', 500);
  }
}
