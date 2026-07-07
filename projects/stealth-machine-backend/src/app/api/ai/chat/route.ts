import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendChatMessage, ChatMessage } from '@/lib/ai';
import { successResponse, errorResponse } from '@/lib/utils';
import { extractCustomerInfoFromText, mergeExtractedInfo } from '@/lib/customerExtract';
import { randomUUID } from 'crypto';

// Force dynamic rendering - this route uses database and external API
export const dynamic = 'force-dynamic';

// POST /api/ai/chat - Send message to AI (public endpoint for customer support)
export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return errorResponse('AI service is not configured', 503);
    }

    const body = await request.json();
    const { messages, sessionId, machineModel } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages are required', 400);
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return errorResponse('Each message must have role and content', 400);
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return errorResponse('Message role must be "user" or "assistant"', 400);
      }
    }

    const chatSessionId = sessionId || randomUUID();
    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === 'user').pop();

    // Upsert ChatSession for customer tracking (by sessionId UUID)
    let chatSession = await prisma.chatSession.upsert({
      where: { sessionId: chatSessionId },
      create: {
        sessionId: chatSessionId,
        machineModel: machineModel || undefined,
      },
      update: {
        updatedAt: new Date(),
        ...(machineModel ? { machineModel } : {}),
      },
    });

    // Extract customer info from the latest user message and merge into session
    const extracted = extractCustomerInfoFromText(lastUserMessage.content);
    if (extracted.name || extracted.email || extracted.phone || extracted.serialNumber || extracted.machineModel) {
      const merged = mergeExtractedInfo(
        {
          name: chatSession.customerName ?? undefined,
          email: chatSession.customerEmail ?? undefined,
          phone: chatSession.customerPhone ?? undefined,
          serialNumber: chatSession.serialNumber ?? undefined,
          machineModel: chatSession.machineModel ?? undefined,
        },
        extracted
      );
      chatSession = await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: {
          customerName: merged.name ?? undefined,
          customerEmail: merged.email ?? undefined,
          customerPhone: merged.phone ?? undefined,
          serialNumber: merged.serialNumber ?? undefined,
          machineModel: merged.machineModel ?? chatSession.machineModel ?? undefined,
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSessionId,
        chatSessionId: chatSession.id,
        role: 'user',
        content: lastUserMessage.content,
        metadata: { machineModel },
      },
    });

    // Send to AI
    const response = await sendChatMessage(messages as ChatMessage[], {
      machineModel: chatSession.machineModel || machineModel,
      sessionId: chatSessionId,
    });

    // Save assistant response
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSessionId,
        chatSessionId: chatSession.id,
        role: 'assistant',
        content: response.content,
        metadata: {
          tokensUsed: response.tokensUsed,
          referencedMaterials: response.referencedMaterials,
        },
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'ai_chat',
        eventData: {
          sessionId: chatSessionId,
          tokensUsed: response.tokensUsed,
          machineModel: chatSession.machineModel || machineModel,
        },
        sessionId: chatSessionId,
      },
    });

    return successResponse({
      content: response.content,
      sessionId: chatSessionId,
      tokensUsed: response.tokensUsed,
      referencedMaterials: response.referencedMaterials,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    const errorMessage = error?.message || 'Unknown error';
    const errorType = error?.name || 'Error';
    console.error(`AI chat error details - Type: ${errorType}, Message: ${errorMessage}`);
    return errorResponse(`AI chat error: ${errorType}`, 500);
  }
}

// GET /api/ai/chat - Get chat history by session ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return errorResponse('Session ID is required', 400);
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      select: {
        id: true,
        role: true,
        content: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(messages);
  } catch (error) {
    console.error('Get chat history error:', error);
    return errorResponse('An error occurred', 500);
  }
}
