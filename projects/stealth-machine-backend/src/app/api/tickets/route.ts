import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isAdmin, canHandleTickets } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  generateTicketNumber,
} from '@/lib/utils';

// GET /api/tickets - List tickets
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Filters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedToId = searchParams.get('assignedToId');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    // Non-employees can only see their own tickets
    if (!canHandleTickets(authResult.user.role)) {
      where.userId = authResult.user.userId;
    } else {
      if (userId) where.userId = userId;
      if (assignedToId) where.assignedToId = assignedToId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          priority: true,
          status: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          machine: {
            select: {
              id: true,
              model: true,
              serialNumber: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return paginatedResponse(tickets, { page, limit, total });
  } catch (error) {
    console.error('List tickets error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/tickets - Create ticket
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const body = await request.json();
    const { title, description, priority, category, machineId } = body;

    if (!title || !description || !category) {
      return errorResponse('Title, description, and category are required', 400);
    }

    // Verify machine belongs to user if provided
    if (machineId) {
      const machine = await prisma.machine.findUnique({ where: { id: machineId } });
      if (!machine) {
        return errorResponse('Machine not found', 404);
      }
      if (!isAdmin(authResult.user.role) && machine.userId !== authResult.user.userId) {
        return errorResponse('Access denied to this machine', 403);
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId: authResult.user.userId,
        machineId,
        title,
        description,
        priority: priority || 'MEDIUM',
        category,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        machine: {
          select: { model: true, serialNumber: true },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'create',
        entityType: 'ticket',
        entityId: ticket.id,
        details: { ticketNumber: ticket.ticketNumber, title },
      },
    });

    return successResponse(ticket, 201);
  } catch (error) {
    console.error('Create ticket error:', error);
    return errorResponse('An error occurred', 500);
  }
}
