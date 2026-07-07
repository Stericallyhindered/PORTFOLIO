import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response';
import { winnerSelectionService, WinnerSelectionCriteria } from '@/lib/winner-selection';

import { unstable_noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const winnerSelectionSchema = z.object({
  method: z.enum(['random', 'score-based', 'hybrid']),
  maxWinners: z.number().min(1).max(20),
  minScore: z.number().optional(),
  excludeUserIds: z.array(z.string()).optional(),
  requireVerification: z.boolean().optional(),
  weightingFactors: z.object({
    score: z.number().optional(),
    participationHistory: z.number().optional(),
    socialEngagement: z.number().optional(),
    submissionQuality: z.number().optional(),
  }).optional(),
});

export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  unstable_noStore();
  try {
    const user = await requireAdmin(request);
    const { id: contestId } = await params;

    const body = await request.json();
    const validationResult = winnerSelectionSchema.safeParse(body);

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

    const criteria: WinnerSelectionCriteria = validationResult.data;

    // Select winners
    const result = await winnerSelectionService.selectContestWinners(contestId, criteria);

    return successResponse(result, 'Winners selected successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  unstable_noStore();
  try {
    const user = await requireAdmin(request);
    const { id: contestId } = await params;

    // Get winner statistics
    const stats = await winnerSelectionService.getWinnerStats(contestId);

    return successResponse(stats, 'Winner statistics retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
} 