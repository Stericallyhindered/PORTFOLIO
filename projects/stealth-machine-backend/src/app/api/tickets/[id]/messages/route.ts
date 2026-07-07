import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canHandleTickets } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tickets/[id]/messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return errorResponse('Ticket not found', 404);
    }

    // Check access
    if (!canHandleTickets(authResult.user.role) && ticket.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    const isStaff = canHandleTickets(authResult.user.role);

    const messages = await prisma.ticketMessage.findMany({
      where: {
        ticketId: id,
        ...(isStaff ? {} : { isInternal: false }),
      },
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
    });

    return successResponse(messages);
  } catch (error) {
    console.error('Get ticket messages error:', error);
    return errorResponse('An error occurred', 500);
  }
}

// POST /api/tickets/[id]/messages
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const { id } = await params;
    const body = await request.json();
    const { message, isInternal, attachments } = body;

    if (!message) {
      return errorResponse('Message is required', 400);
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return errorResponse('Ticket not found', 404);
    }

    // Check access
    const isStaff = canHandleTickets(authResult.user.role);
    if (!isStaff && ticket.userId !== authResult.user.userId) {
      return errorResponse('Access denied', 403);
    }

    // Only staff can post internal messages
    const actuallyInternal = isStaff && isInternal;

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: authResult.user.userId,
        message,
        isInternal: actuallyInternal,
        attachments: attachments || [],
      },
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
    });

    // Update ticket status if customer responds and ticket is waiting
    if (!isStaff && ticket.status === 'WAITING_CUSTOMER') {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Update ticket timestamp
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return successResponse(newMessage, 201);
  } catch (error) {
    console.error('Create ticket message error:', error);
    return errorResponse('An error occurred', 500);
  }
}
