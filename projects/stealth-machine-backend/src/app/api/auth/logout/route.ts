import { NextRequest } from 'next/server';
import { clearAuthCookie, getAuthFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthFromRequest(request);

    // Clear the auth cookie
    await clearAuthCookie();

    // Log the logout if we had a valid user
    if (payload) {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: 'logout',
          entityType: 'user',
          entityId: payload.userId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        },
      });
    }

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('An error occurred during logout', 500);
  }
}
