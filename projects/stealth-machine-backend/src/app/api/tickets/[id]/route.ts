import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, isAdmin, canHandleTickets } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tickets/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        machine: {
          select: {
            id: true,
            model: true,
            serialNumber: true,
            machineType: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return errorResponse('Ticket not found', 404);
    }

    // Check access
    if (!canHandleTickets(authResult.user.role) && ticket.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    // Filter internal messages for non-staff
    if (!canHandleTickets(authResult.user.role)) {
      ticket.messages = ticket.messages.filter((m) => !m.isInternal);
    }

    return successResponse(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// PUT /api/tickets/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Ticket not found', 404);
    }

    // Customers can only update their own tickets (limited fields)
    const isStaff = canHandleTickets(authResult.user.role);
    if (!isStaff && existing.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    const {
      title,
      description,
      priority,
      status,
      category,
      assignedToId,
      resolution,
      internalNotes,
    } = body;

    // Build update data
    const updateData: any = {};

    // Customer-allowed updates
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // Staff-only updates
    if (isStaff) {
      if (priority) updateData.priority = priority;
      if (status) {
        updateData.status = status;
        if (status === 'RESOLVED' && !existing.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
        if (status === 'CLOSED' && !existing.closedAt) {
          updateData.closedAt = new Date();
        }
      }
      if (category) updateData.category = category;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
      if (resolution !== undefined) updateData.resolution = resolution;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.userId,
        action: 'update',
        entityType: 'ticket',
        entityId: id,
        details: body,
      },
    });

    return successResponse(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    return errorResponse('An error occurred', 500);
  }
}
