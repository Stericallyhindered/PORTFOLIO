import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { successResponse, errorResponse, isValidEmail, isStrongPassword } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, company, phone } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return errorResponse('Email, password, first name, and last name are required', 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return errorResponse(
        'Password must be at least 8 characters with uppercase, lowercase, and number',
        400
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        company,
        phone,
        role: 'CUSTOMER', // Default role
      },
    });

    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie for web
    await setAuthCookie(token);

    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'register',
        entityType: 'user',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return successResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImage: user.profileImage,
        },
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('An error occurred during registration', 500);
  }
}
