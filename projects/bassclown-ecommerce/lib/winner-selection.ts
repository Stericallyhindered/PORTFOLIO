import { db, contests, contestSubmissions, giveaways, giveawayEntries, giveawayWinners, users } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

export interface WinnerSelectionCriteria {
  method: 'random' | 'score-based' | 'hybrid' | 'manual';
  minScore?: number;
  maxWinners: number;
  excludeUserIds?: string[];
  requireVerification?: boolean;
  weightingFactors?: {
    score?: number;
    participationHistory?: number;
    socialEngagement?: number;
    submissionQuality?: number;
  };
}

export interface SelectedWinner {
  userId: string;
  userName: string;
  userEmail: string;
  submissionId?: string;
  entryId?: string;
  score?: number;
  rank: number;
  selectionReason: string;
}

export interface WinnerSelectionResult {
  winners: SelectedWinner[];
  totalEligible: number;
  selectionMethod: string;
  timestamp: Date;
  contestId?: string;
  giveawayId?: string;
}

class WinnerSelectionService {
  /**
   * Select winners for a contest based on submissions and judging scores
   */
  async selectContestWinners(
    contestId: string,
    criteria: WinnerSelectionCriteria
  ): Promise<WinnerSelectionResult> {
    try {
      // Get contest details
      const [contest] = await db
        .select()
        .from(contests)
        .where(eq(contests.id, contestId));

      if (!contest) {
        throw new Error('Contest not found');
      }

      // Get eligible submissions
      const submissions = await db
        .select({
          id: contestSubmissions.id,
          userId: contestSubmissions.userId,
          title: contestSubmissions.title,
          score: contestSubmissions.score,
          status: contestSubmissions.status,
          userName: users.name,
          userEmail: users.email,
        })
        .from(contestSubmissions)
        .innerJoin(users, eq(contestSubmissions.userId, users.id))
        .where(
          and(
            eq(contestSubmissions.contestId, contestId),
            eq(contestSubmissions.status, 'submitted')
          )
        )
        .orderBy(desc(contestSubmissions.score));

      // Filter eligible submissions
      let eligibleSubmissions = submissions.filter(submission => {
        if (criteria.excludeUserIds?.includes(submission.userId)) return false;
        if (criteria.minScore && (!submission.score || parseFloat(submission.score) < criteria.minScore)) return false;
        return true;
      });

      if (eligibleSubmissions.length === 0) {
        throw new Error('No eligible submissions found');
      }

      let winners: SelectedWinner[] = [];

      switch (criteria.method) {
        case 'score-based':
          winners = this.selectByScore(eligibleSubmissions, criteria.maxWinners);
          break;
        case 'random':
          winners = this.selectRandomly(eligibleSubmissions, criteria.maxWinners);
          break;
        case 'hybrid':
          winners = this.selectHybrid(eligibleSubmissions, criteria);
          break;
        default:
          throw new Error('Invalid selection method');
      }

      // Update contest status and winners
      await this.updateContestWinners(contestId, winners);

      // Send winner notifications
      await this.notifyWinners(winners, 'contest', contest.title);

      return {
        winners,
        totalEligible: eligibleSubmissions.length,
        selectionMethod: criteria.method,
        timestamp: new Date(),
        contestId,
      };

    } catch (error) {
      console.error('Error selecting contest winners:', error);
      throw error;
    }
  }

  /**
   * Select winners for a giveaway based on entries
   */
  async selectGiveawayWinners(
    giveawayId: string,
    criteria: WinnerSelectionCriteria
  ): Promise<WinnerSelectionResult> {
    try {
      // Get giveaway details
      const [giveaway] = await db
        .select()
        .from(giveaways)
        .where(eq(giveaways.id, giveawayId));

      if (!giveaway) {
        throw new Error('Giveaway not found');
      }

      // Get eligible entries
      const entries = await db
        .select({
          id: giveawayEntries.id,
          userId: giveawayEntries.userId,
          userName: users.name,
          userEmail: users.email,
          createdAt: giveawayEntries.createdAt,
        })
        .from(giveawayEntries)
        .innerJoin(users, eq(giveawayEntries.userId, users.id))
        .where(eq(giveawayEntries.giveawayId, giveawayId));

      // Filter eligible entries
      let eligibleEntries = entries.filter(entry => {
        if (criteria.excludeUserIds?.includes(entry.userId)) return false;
        return true;
      });

      if (eligibleEntries.length === 0) {
        throw new Error('No eligible entries found');
      }

      // For giveaways, always use random selection
      const winners = this.selectRandomlyFromEntries(eligibleEntries, criteria.maxWinners);

      // Update giveaway status and winners
      await this.updateGiveawayWinners(giveawayId, winners);

      // Send winner notifications
      await this.notifyWinners(winners, 'giveaway', giveaway.title);

      return {
        winners,
        totalEligible: eligibleEntries.length,
        selectionMethod: 'random',
        timestamp: new Date(),
        giveawayId,
      };

    } catch (error) {
      console.error('Error selecting giveaway winners:', error);
      throw error;
    }
  }

  /**
   * Select winners based on highest scores
   */
  private selectByScore(submissions: any[], maxWinners: number): SelectedWinner[] {
    return submissions
      .slice(0, maxWinners)
      .map((submission, index) => ({
        userId: submission.userId,
        userName: submission.userName,
        userEmail: submission.userEmail,
        submissionId: submission.id,
        score: submission.score ? parseFloat(submission.score) : 0,
        rank: index + 1,
        selectionReason: `Ranked #${index + 1} with score of ${submission.score}`,
      }));
  }

  /**
   * Select winners randomly
   */
  private selectRandomly(submissions: any[], maxWinners: number): SelectedWinner[] {
    const shuffled = [...submissions].sort(() => Math.random() - 0.5);
    return shuffled
      .slice(0, maxWinners)
      .map((submission, index) => ({
        userId: submission.userId,
        userName: submission.userName,
        userEmail: submission.userEmail,
        submissionId: submission.id,
        score: submission.score ? parseFloat(submission.score) : undefined,
        rank: index + 1,
        selectionReason: 'Selected randomly from eligible submissions',
      }));
  }

  /**
   * Select winners using hybrid method (score + random)
   */
  private selectHybrid(submissions: any[], criteria: WinnerSelectionCriteria): SelectedWinner[] {
    const topPerformers = Math.ceil(criteria.maxWinners * 0.7); // 70% based on score
    const randomSelections = criteria.maxWinners - topPerformers; // 30% random

    const winners: SelectedWinner[] = [];

    // Select top performers
    const scoreBasedWinners = this.selectByScore(submissions, topPerformers);
    winners.push(...scoreBasedWinners);

    // Select random winners from remaining submissions
    const remainingSubmissions = submissions.filter(
      sub => !winners.some(winner => winner.userId === sub.userId)
    );

    if (remainingSubmissions.length > 0 && randomSelections > 0) {
      const randomWinners = this.selectRandomly(remainingSubmissions, randomSelections);
      // Update ranks to continue from score-based winners
      randomWinners.forEach((winner, index) => {
        winner.rank = topPerformers + index + 1;
        winner.selectionReason = 'Selected randomly from remaining eligible submissions';
      });
      winners.push(...randomWinners);
    }

    return winners;
  }

  /**
   * Select winners randomly from giveaway entries
   */
  private selectRandomlyFromEntries(entries: any[], maxWinners: number): SelectedWinner[] {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return shuffled
      .slice(0, maxWinners)
      .map((entry, index) => ({
        userId: entry.userId,
        userName: entry.userName,
        userEmail: entry.userEmail,
        entryId: entry.id,
        rank: index + 1,
        selectionReason: 'Selected randomly from all entries',
      }));
  }

  /**
   * Update contest with winner information
   */
  private async updateContestWinners(contestId: string, winners: SelectedWinner[]) {
    // Update contest status
    await db
      .update(contests)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(contests.id, contestId));

    // Update submission statuses to winner
    for (const winner of winners) {
      if (winner.submissionId) {
        await db
          .update(contestSubmissions)
          .set({
            status: 'winner',
            updatedAt: new Date(),
          })
          .where(eq(contestSubmissions.id, winner.submissionId));
      }
    }
  }

  /**
   * Update giveaway with winner information
   */
  private async updateGiveawayWinners(giveawayId: string, winners: SelectedWinner[]) {
    // Update giveaway status
    await db
      .update(giveaways)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(giveaways.id, giveawayId));

    // Create winner records and update entry statuses
    for (const winner of winners) {
      if (winner.entryId) {
        // Create winner record
        await db
          .insert(giveawayWinners)
          .values({
            giveawayId,
            userId: winner.userId,
            entryId: winner.entryId,
            selectedAt: new Date(),
            prizeClaimStatus: 'pending',
            prizeClaimDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });

        // Update entry status
        await db
          .update(giveawayEntries)
          .set({
            status: 'winner',
            updatedAt: new Date(),
          })
          .where(eq(giveawayEntries.id, winner.entryId));
      }
    }
  }

  /**
   * Send notifications to winners
   */
  private async notifyWinners(winners: SelectedWinner[], type: 'contest' | 'giveaway', title: string) {
    for (const winner of winners) {
      try {
        await emailService.sendNotification(winner.userId, `${type}_winner`, {
          title,
          rank: winner.rank,
          totalWinners: winners.length,
          selectionReason: winner.selectionReason,
          score: winner.score,
        });
      } catch (error) {
        console.error(`Error sending winner notification to ${winner.userEmail}:`, error);
      }
    }
  }

  /**
   * Get winner selection statistics
   */
  async getWinnerStats(contestId?: string, giveawayId?: string) {
    try {
      let stats = {
        totalWinners: 0,
        averageScore: 0,
        selectionMethods: {} as Record<string, number>,
        winnersByRank: {} as Record<number, number>,
      };

             if (contestId) {
         const contestWinners = await db
           .select({
             score: contestSubmissions.score,
           })
           .from(contestSubmissions)
           .where(
             and(
               eq(contestSubmissions.contestId, contestId),
               eq(contestSubmissions.status, 'winner')
             )
           );

         stats.totalWinners = contestWinners.length;
         
         const scores = contestWinners
           .map(w => w.score ? parseFloat(w.score) : 0)
           .filter(score => score > 0);
         
         if (scores.length > 0) {
           stats.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
         }
       }

      return stats;
    } catch (error) {
      console.error('Error getting winner stats:', error);
      throw error;
    }
  }
}

export const winnerSelectionService = new WinnerSelectionService(); 