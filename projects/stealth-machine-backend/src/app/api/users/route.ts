import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, hashPassword, isAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  buildSearchConditions,
  isValidEmail,
  isStrongPassword,
} from '@/lib/utils';

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Filters
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== null) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users and count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          company: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              machines: true,
              tickets: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(
      users.map((u) => ({
        ...u,
        machineCount: u._count.machines,
        ticketCount: u._count.tickets,
      })),
      { page, limit, total }
    );
  } catch (error) {
    console.error('List users error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { email, password, firstName, lastName, role, company, phone, employeeId } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return errorResponse('Email, password, first name, and last name are required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    if (!isStrongPassword(password)) {
      return errorResponse(
        'Password must be at least 8 characters with uppercase, lowercase, and number',
        400
      );
    }

    // Check if only super admin can create admins
    if (role === 'SUPER_ADMIN' && authResult.user.role !== 'SUPER_ADMIN') {
      return errorResponse('Only super admins can create super admin accounts', 403);
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return errorResponse('Email already exists', 409);
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: role || 'CUSTOMER',
        company,
        phone,
        employeeId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        phone: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'create',
        entityType: 'user',
        entityId: user.id,
        details: { email: user.email, role: user.role },
      },
    });

    return successResponse(user, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('An error occurred', 500);
  }
}
