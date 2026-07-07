import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { contests, contestApplications, contestSubmissions } from '@/lib/db/schema';
import { eq, and, or, gte, count, desc } from 'drizzle-orm';
import { successResponse, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!db) {
      return successResponse([]);
    }

    // Get active contests
    const activeContests = await db
      .select({
        id: contests.id,
        title: contests.title,
        submissionDeadline: contests.submissionDeadline,
        prize: contests.prize,
        status: contests.status,
        currentParticipants: contests.currentParticipants
      })
      .from(contests)
      .where(
        and(
          or(
            eq(contests.status, 'open'),
            eq(contests.status, 'judging')
          ),
          gte(contests.submissionDeadline, new Date())
        )
      )
      .orderBy(desc(contests.createdAt))
      .limit(4);

    // Check which contests user has applied/submitted to
    const contestIds = activeContests.map(c => c.id);
    
    const userApplications = contestIds.length > 0 ? await db
      .select({
        contestId: contestApplications.contestId
      })
      .from(contestApplications)
      .where(
        and(
          eq(contestApplications.userId, user.id)
        )
      ) : [];

    const userSubmissions = contestIds.length > 0 ? await db
      .select({
        contestId: contestSubmissions.contestId
      })
      .from(contestSubmissions)
      .where(
        and(
          eq(contestSubmissions.userId, user.id)
        )
      ) : [];

    // Filter to only contests in activeContests
    const activeContestIds = new Set(contestIds);
    const filteredApplications = userApplications.filter(a => activeContestIds.has(a.contestId));
    const filteredSubmissions = userSubmissions.filter(s => activeContestIds.has(s.contestId));

    const appliedContestIds = new Set(filteredApplications.map(a => a.contestId));
    const submittedContestIds = new Set(filteredSubmissions.map(s => s.contestId));

    const formatted = activeContests.map(contest => {
      const deadline = new Date(contest.submissionDeadline);
      const deadlineStr = deadline.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      const hasSubmitted = submittedContestIds.has(contest.id);
      const hasApplied = appliedContestIds.has(contest.id);

      let status: 'Active' | 'Submitted' | 'Judging' | 'Closed' = 'Active';
      if (hasSubmitted) {
        status = contest.status === 'judging' ? 'Judging' : 'Submitted';
      } else if (deadline < new Date()) {
        status = 'Closed';
      }

      return {
        id: contest.id,
        title: contest.title,
        deadline: deadlineStr,
        prize: contest.prize || '$0',
        participants: contest.currentParticipants || 0,
        status,
        submitted: hasSubmitted
      };
    });

    return successResponse(formatted);

  } catch (error) {
    return handleApiError(error);
  }
}

