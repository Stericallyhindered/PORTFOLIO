import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response';
import { winnerSelectionService, WinnerSelectionCriteria } from '@/lib/winner-selection';

export const dynamic = 'force-dynamic';

const giveawayWinnerSelectionSchema = z.object({
  maxWinners: z.number().min(1).max(20),
  excludeUserIds: z.array(z.string()).optional(),
  requireVerification: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    const { id: giveawayId } = await params;

    const body = await request.json();
    const validationResult = giveawayWinnerSelectionSchema.safeParse(body);

    if (!validationResult.success) {
      // Convert Zod errors to the expected format
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((error) => {
        const path = error.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(error.message);
      });
      return validationErrorResponse(errors);
    }

    const criteria: WinnerSelectionCriteria = {
      method: 'random', // Giveaways always use random selection
      ...validationResult.data,
    };

    // Select winners
    const result = await winnerSelectionService.selectGiveawayWinners(giveawayId, criteria);

    return successResponse(result, 'Giveaway winners selected successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    const { id: giveawayId } = await params;

    // Get winner statistics
    const stats = await winnerSelectionService.getWinnerStats(undefined, giveawayId);

    return successResponse(stats, 'Giveaway winner statistics retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
} 