import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, isValidEmail } from '@/lib/utils';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/customers/register
 * Create or update a customer from chat-collected data and optionally register a machine.
 * Body: { sessionId?, email?, firstName?, lastName?, name?, phone?, machineModel?, serialNumber? }
 * - If email provided: create or update User (CUSTOMER), link ChatSession to them.
 * - If serialNumber + machineModel: create Machine for that customer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      email,
      firstName,
      lastName,
      name,
      phone,
      machineModel,
      serialNumber,
    } = body;

    let customerId: string | null = null;
    let chatSessionUpdated = false;

    // Normalize name into first/last
    const first = firstName || (name && name.split(/\s+/)[0]) || 'Customer';
    const last = lastName || (name && name.split(/\s+/).slice(1).join(' ')) || 'User';

    if (email) {
      if (!isValidEmail(email)) {
        return errorResponse('Invalid email format', 400);
      }

      const emailLower = email.toLowerCase().trim();
      let user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      if (user) {
        // Update existing customer
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: first,
            lastName: last,
            phone: phone || user.phone,
            company: user.company,
          },
        });
        customerId = user.id;
      } else {
        // Create new customer with a generated password (they can reset via email)
        const tempPassword = randomBytes(16).toString('hex');
        const passwordHash = await hashPassword(tempPassword);
        user = await prisma.user.create({
          data: {
            email: emailLower,
            passwordHash,
            firstName: first,
            lastName: last,
            phone: phone || undefined,
            role: 'CUSTOMER',
          },
        });
        customerId = user.id;
      }
    }

    // Link ChatSession to customer if we have sessionId and customerId
    if (sessionId && customerId) {
      await prisma.chatSession.updateMany({
        where: { sessionId },
        data: {
          customerId,
          customerName: `${first} ${last}`.trim(),
          customerEmail: email?.trim(),
          customerPhone: phone?.trim(),
          machineModel: machineModel || undefined,
          serialNumber: serialNumber || undefined,
        },
      });
      chatSessionUpdated = true;
    }

    // Register machine if we have customer, serial number, and model
    let machineId: string | null = null;
    if (customerId && serialNumber && machineModel) {
      const machineType = await prisma.machineType.findFirst({
        where: { modelCode: machineModel },
      });
      const typeCode = machineType?.modelCode || machineModel;

      const existing = await prisma.machine.findUnique({
        where: { serialNumber: String(serialNumber).trim() },
      });

      if (existing) {
        if (existing.userId !== customerId) {
          await prisma.machine.update({
            where: { id: existing.id },
            data: { userId: customerId },
          });
        }
        machineId = existing.id;
      } else {
        const created = await prisma.machine.create({
          data: {
            userId: customerId,
            model: machineModel,
            machineType: typeCode,
            serialNumber: String(serialNumber).trim(),
            status: 'ACTIVE',
          },
        });
        machineId = created.id;
      }
    }

    return successResponse(
      {
        customerId,
        machineId,
        chatSessionUpdated,
      },
      201
    );
  } catch (error) {
    console.error('Customer register error:', error);
    return errorResponse('Registration failed', 500);
  }
}
