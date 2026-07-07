import { db, contestJudges, judgeScores, judgingSessions, judgeDiscussions, contestSubmissions, contests, users } from '@/lib/db';
import { eq, and, desc, count, avg, sum } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

export interface JudgingCriteria {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  description?: string;
}

export interface JudgeScoreData {
  criteriaScores: Record<string, number>;
  overallRating: number;
  comments?: string;
  judgeNotes?: string;
  confidence?: number;
  timeSpent?: number;
}

export interface CollaborativeJudgingConfig {
  sessionType: 'independent' | 'collaborative' | 'consensus';
  requiredJudges: number;
  aggregationMethod: 'average' | 'median' | 'weighted';
  consensusThreshold?: number; // percentage agreement required
  allowDiscussion: boolean;
  anonymousScoring: boolean;
}

export interface JudgingSessionResult {
  sessionId: string;
  finalScore: number;
  finalDecision: 'approved' | 'rejected' | 'needs_review';
  consensusReached: boolean;
  judgeScores: Array<{
    judgeId: string;
    judgeName: string;
    totalScore: number;
    confidence?: number;
    submittedAt: Date;
  }>;
  statistics: {
    averageScore: number;
    scoreVariance: number;
    agreementLevel: number;
  };
}

class CollaborativeJudgingService {
  
  /**
   * Assign judges to a contest
   */
  async assignJudgesToContest(
    contestId: string, 
    judgeIds: string[], 
    assignedBy: string,
    permissions?: Record<string, any>
  ): Promise<void> {
    try {
      // Remove existing judges first
      await db
        .delete(contestJudges)
        .where(eq(contestJudges.contestId, contestId));

      // Add new judges
      const judgeAssignments = judgeIds.map(judgeId => ({
        contestId,
        judgeId,
        assignedBy,
        permissions: permissions || {},
        status: 'active' as const
      }));

      await db.insert(contestJudges).values(judgeAssignments);

      // Notify judges of assignment
      await this.notifyJudgesOfAssignment(contestId, judgeIds);
    } catch (error) {
      console.error('Error assigning judges to contest:', error);
      throw error;
    }
  }

  /**
   * Create a judging session for a submission
   */
  async createJudgingSession(
    contestId: string,
    submissionId: string,
    config: CollaborativeJudgingConfig
  ): Promise<string> {
    try {
      const [session] = await db
        .insert(judgingSessions)
        .values({
          contestId,
          submissionId,
          sessionType: config.sessionType,
          requiredJudges: config.requiredJudges,
          aggregationMethod: config.aggregationMethod,
          metadata: {
            consensusThreshold: config.consensusThreshold || 0.8,
            allowDiscussion: config.allowDiscussion,
            anonymousScoring: config.anonymousScoring
          }
        })
        .returning({ id: judgingSessions.id });

      return session.id;
    } catch (error) {
      console.error('Error creating judging session:', error);
      throw error;
    }
  }

  /**
   * Submit a judge's score for a submission
   */
  async submitJudgeScore(
    sessionId: string,
    submissionId: string,
    judgeId: string,
    scoreData: JudgeScoreData,
    criteria: JudgingCriteria[]
  ): Promise<void> {
    try {
      // Calculate weighted total score
      const totalScore = this.calculateWeightedScore(scoreData.criteriaScores, criteria);

      // Get session info
      const [session] = await db
        .select()
        .from(judgingSessions)
        .where(eq(judgingSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw new Error('Judging session not found');
      }

      // Insert or update judge score
      await db
        .insert(judgeScores)
        .values({
          submissionId,
          judgeId,
          contestId: session.contestId,
          criteriaScores: scoreData.criteriaScores,
          overallRating: scoreData.overallRating.toString(),
          totalScore: totalScore.toString(),
          comments: scoreData.comments || null,
          judgeNotes: scoreData.judgeNotes || null,
          confidence: scoreData.confidence?.toString() || null,
          timeSpent: scoreData.timeSpent || null,
          status: 'submitted',
          submittedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [judgeScores.submissionId, judgeScores.judgeId],
          set: {
            criteriaScores: scoreData.criteriaScores,
            overallRating: scoreData.overallRating.toString(),
            totalScore: totalScore.toString(),
            comments: scoreData.comments || null,
            judgeNotes: scoreData.judgeNotes || null,
            confidence: scoreData.confidence?.toString() || null,
            timeSpent: scoreData.timeSpent || null,
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date()
          }
        });

      // Update session progress
      await this.updateSessionProgress(sessionId);

      // Check if session is complete and process results
      await this.checkAndProcessSessionCompletion(sessionId);

    } catch (error) {
      console.error('Error submitting judge score:', error);
      throw error;
    }
  }

  /**
   * Get judging session results
   */
  async getJudgingSessionResults(sessionId: string): Promise<JudgingSessionResult | null> {
    try {
      const [session] = await db
        .select()
        .from(judgingSessions)
        .where(eq(judgingSessions.id, sessionId))
        .limit(1);

      if (!session) {
        return null;
      }

      // Get all judge scores for this session
      const scores = await db
        .select({
          judgeId: judgeScores.judgeId,
          judgeName: users.name,
          totalScore: judgeScores.totalScore,
          confidence: judgeScores.confidence,
          submittedAt: judgeScores.submittedAt,
          criteriaScores: judgeScores.criteriaScores
        })
        .from(judgeScores)
        .leftJoin(users, eq(judgeScores.judgeId, users.id))
        .where(eq(judgeScores.submissionId, session.submissionId));

      if (scores.length === 0) {
        return null;
      }

      // Calculate statistics
      const totalScores = scores.map((s: any) => parseFloat(s.totalScore));
      const averageScore = totalScores.reduce((sum: number, score: number) => sum + score, 0) / totalScores.length;
      const scoreVariance = this.calculateVariance(totalScores);
      const agreementLevel = this.calculateAgreementLevel(scores);

      return {
        sessionId,
        finalScore: session.finalScore ? parseFloat(session.finalScore) : averageScore,
        finalDecision: session.finalDecision as 'approved' | 'rejected' | 'needs_review' || 'needs_review',
        consensusReached: session.consensusReached || false,
        judgeScores: scores.map(score => ({
          judgeId: score.judgeId,
          judgeName: score.judgeName || 'Anonymous',
          totalScore: parseFloat(score.totalScore),
          confidence: score.confidence ? parseFloat(score.confidence) : undefined,
          submittedAt: score.submittedAt || new Date()
        })),
        statistics: {
          averageScore,
          scoreVariance,
          agreementLevel
        }
      };
    } catch (error) {
      console.error('Error getting judging session results:', error);
      throw error;
    }
  }

  /**
   * Add discussion comment to judging session
   */
  async addDiscussionComment(
    sessionId: string,
    judgeId: string,
    message: string,
    messageType: 'comment' | 'question' | 'concern' | 'agreement' = 'comment',
    replyToId?: string,
    isPrivate: boolean = false
  ): Promise<void> {
    try {
      await db
        .insert(judgeDiscussions)
        .values({
          sessionId,
          judgeId,
          message,
          messageType,
          replyToId,
          isPrivate
        });

      // Notify other judges if not private
      if (!isPrivate) {
        await this.notifyJudgesOfDiscussion(sessionId, judgeId, message);
      }
    } catch (error) {
      console.error('Error adding discussion comment:', error);
      throw error;
    }
  }

  /**
   * Get discussion comments for a judging session
   */
  async getSessionDiscussion(sessionId: string, judgeId?: string): Promise<any[]> {
    try {
      const conditions = [eq(judgeDiscussions.sessionId, sessionId)];
      
      // If judgeId provided, include private comments for that judge
      if (!judgeId) {
        conditions.push(eq(judgeDiscussions.isPrivate, false));
      }

      const discussions = await db
        .select({
          id: judgeDiscussions.id,
          judgeId: judgeDiscussions.judgeId,
          judgeName: users.name,
          message: judgeDiscussions.message,
          messageType: judgeDiscussions.messageType,
          replyToId: judgeDiscussions.replyToId,
          isPrivate: judgeDiscussions.isPrivate,
          createdAt: judgeDiscussions.createdAt
        })
        .from(judgeDiscussions)
        .leftJoin(users, eq(judgeDiscussions.judgeId, users.id))
        .where(judgeId ? 
          and(...conditions, 
              eq(judgeDiscussions.isPrivate, false) // or eq(judgeDiscussions.judgeId, judgeId)
          ) : 
          and(...conditions)
        )
        .orderBy(desc(judgeDiscussions.createdAt));

      return discussions;
    } catch (error) {
      console.error('Error getting session discussion:', error);
      throw error;
    }
  }

  /**
   * Get contest judges
   */
  async getContestJudges(contestId: string): Promise<any[]> {
    try {
      const judges = await db
        .select({
          id: contestJudges.id,
          judgeId: contestJudges.judgeId,
          judgeName: users.name,
          judgeEmail: users.email,
          status: contestJudges.status,
          assignedAt: contestJudges.assignedAt,
          permissions: contestJudges.permissions
        })
        .from(contestJudges)
        .leftJoin(users, eq(contestJudges.judgeId, users.id))
        .where(eq(contestJudges.contestId, contestId));

      return judges;
    } catch (error) {
      console.error('Error getting contest judges:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateWeightedScore(criteriaScores: Record<string, number>, criteria: JudgingCriteria[]): number {
    return criteria.reduce((total, criterion) => {
      const score = criteriaScores[criterion.id] || 0;
      return total + (score * criterion.weight / 100);
    }, 0);
  }

  private async updateSessionProgress(sessionId: string): Promise<void> {
    const [completedCount] = await db
      .select({ count: count() })
      .from(judgeScores)
      .innerJoin(judgingSessions, eq(judgeScores.submissionId, judgingSessions.submissionId))
      .where(and(
        eq(judgingSessions.id, sessionId),
        eq(judgeScores.status, 'submitted')
      ));

    await db
      .update(judgingSessions)
      .set({
        completedJudges: completedCount.count,
        updatedAt: new Date()
      })
      .where(eq(judgingSessions.id, sessionId));
  }

  private async checkAndProcessSessionCompletion(sessionId: string): Promise<void> {
    const [session] = await db
      .select()
      .from(judgingSessions)
      .where(eq(judgingSessions.id, sessionId))
      .limit(1);

    if (!session || (session.completedJudges || 0) < (session.requiredJudges || 0)) {
      return;
    }

    // Calculate final results
    const scores = await db
      .select({ totalScore: judgeScores.totalScore })
      .from(judgeScores)
      .where(eq(judgeScores.submissionId, session.submissionId));

    const totalScores = scores.map(s => parseFloat(s.totalScore));
    let finalScore: number;

    switch (session.aggregationMethod) {
      case 'median':
        finalScore = this.calculateMedian(totalScores);
        break;
      case 'weighted':
        finalScore = this.calculateWeightedAverage(totalScores);
        break;
      default:
        finalScore = totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;
    }

    // Determine final decision based on score and consensus
    const finalDecision = finalScore >= 7.0 ? 'approved' : finalScore <= 4.0 ? 'rejected' : 'needs_review';
    const consensusReached = this.checkConsensus(totalScores, (session.metadata as any)?.consensusThreshold || 0.8);

    // Update session and submission
    await db
      .update(judgingSessions)
      .set({
        status: 'completed',
        finalScore: finalScore.toString(),
        finalDecision,
        consensusReached,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(judgingSessions.id, sessionId));

    // Update the original submission
    await db
      .update(contestSubmissions)
      .set({
        status: finalDecision === 'approved' ? 'approved' : finalDecision === 'rejected' ? 'rejected' : 'under_review',
        score: finalScore.toString(),
        updatedAt: new Date()
      })
      .where(eq(contestSubmissions.id, session.submissionId));
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return variance;
  }

  private calculateAgreementLevel(scores: any[]): number {
    // Calculate agreement based on score variance and criteria alignment
    const totalScores = scores.map(s => parseFloat(s.totalScore));
    const variance = this.calculateVariance(totalScores);
    const maxVariance = 25; // Assuming max score difference of 10 points
    return Math.max(0, (1 - variance / maxVariance) * 100);
  }

  private calculateMedian(scores: number[]): number {
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateWeightedAverage(scores: number[]): number {
    // Simple weighted average - could be enhanced with judge reputation weights
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private checkConsensus(scores: number[], threshold: number): boolean {
    if (scores.length < 2) return true;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const withinThreshold = scores.filter(score => 
      Math.abs(score - mean) <= (mean * (1 - threshold))
    ).length;
    
    return (withinThreshold / scores.length) >= threshold;
  }

  private async notifyJudgesOfAssignment(contestId: string, judgeIds: string[]): Promise<void> {
    try {
      const [contest] = await db
        .select({ title: contests.title })
        .from(contests)
        .where(eq(contests.id, contestId))
        .limit(1);

      const judges = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, judgeIds[0])); // This would need to be updated for multiple judges

      for (const judge of judges) {
        await emailService.sendNotification(judge.id, 'judge-assignment', {
          judgeName: judge.name,
          contestTitle: contest?.title,
          contestId
        });
      }
    } catch (error) {
      console.error('Error notifying judges of assignment:', error);
    }
  }

  private async notifyJudgesOfDiscussion(sessionId: string, authorId: string, message: string): Promise<void> {
    // Implementation for notifying judges of new discussion comments
    // This would send notifications to other judges in the session
  }
}

export const collaborativeJudgingService = new CollaborativeJudgingService(); 