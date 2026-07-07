import { db, mediaKitTemplates, mediaKits, users, contests, contestSubmissions, pointsTransactions } from '@/lib/db';
import { eq, and, desc, count, sum, avg, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface MediaKitTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'brand' | 'creator' | 'contest';
  templateData: any;
  isActive: boolean;
  isPremium: boolean;
  previewImageUrl?: string;
}

export interface MediaKitData {
  title: string;
  description?: string;
  userInfo: {
    name: string;
    email?: string;
    bio?: string;
    location?: string;
    website?: string;
    socialMedia?: Record<string, string>;
  };
  stats: {
    totalContests: number;
    totalWins: number;
    totalSubmissions: number;
    winRate: number;
    totalPoints: number;
    averageScore: number;
    contestsThisYear: number;
    recentActivity: Array<{
      type: string;
      title: string;
      date: Date;
      result?: string;
    }>;
  };
  portfolio: Array<{
    id: string;
    title: string;
    description?: string;
    fileUrl?: string;
    fileType?: string;
    contestName?: string;
    score?: number;
    placement?: number;
    date: Date;
  }>;
  contact: {
    preferredContact: string;
    availability: string;
    collaborationInterests: string[];
    rates?: Record<string, string>;
  };
}

export interface GeneratedMediaKit {
  id: string;
  title: string;
  type: 'brand' | 'creator' | 'contest';
  status: 'draft' | 'published' | 'archived';
  shareToken?: string;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class MediaKitService {
  
  /**
   * Get available templates
   */
  async getTemplates(type?: 'brand' | 'creator' | 'contest'): Promise<MediaKitTemplate[]> {
    try {
      const conditions = [eq(mediaKitTemplates.isActive, true)];
      
      if (type) {
        conditions.push(eq(mediaKitTemplates.type, type));
      }

      const templates = await db
        .select()
        .from(mediaKitTemplates)
        .where(and(...conditions))
        .orderBy(desc(mediaKitTemplates.createdAt));

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        type: template.type as 'brand' | 'creator' | 'contest',
        templateData: template.templateData,
        isActive: template.isActive || false,
        isPremium: template.isPremium || false,
        previewImageUrl: template.previewImageUrl || undefined
      }));
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Generate user statistics for media kit
   */
  async generateUserStats(userId: string): Promise<MediaKitData['stats']> {
    try {
      // Get contest statistics
      const [contestStats] = await db
        .select({
          totalSubmissions: count(contestSubmissions.id),
          averageScore: avg(contestSubmissions.score)
        })
        .from(contestSubmissions)
        .where(eq(contestSubmissions.userId, userId));

      // Get points statistics
      const [pointsStats] = await db
        .select({
          totalPoints: sum(pointsTransactions.amount)
        })
        .from(pointsTransactions)
        .where(and(
          eq(pointsTransactions.userId, userId),
          eq(pointsTransactions.type, 'earned')
        ));

      // Get this year's contest activity
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      
      const [yearStats] = await db
        .select({
          contestsThisYear: count(contestSubmissions.id)
        })
        .from(contestSubmissions)
        .where(and(
          eq(contestSubmissions.userId, userId),
          gte(contestSubmissions.createdAt, yearStart)
        ));

      // Get recent activity
      const recentSubmissions = await db
        .select({
          id: contestSubmissions.id,
          title: contestSubmissions.title,
          contestName: contests.title,
          score: contestSubmissions.score,
          status: contestSubmissions.status,
          createdAt: contestSubmissions.createdAt
        })
        .from(contestSubmissions)
        .leftJoin(contests, eq(contestSubmissions.contestId, contests.id))
        .where(eq(contestSubmissions.userId, userId))
        .orderBy(desc(contestSubmissions.createdAt))
        .limit(10);

      const recentActivity = recentSubmissions.map(submission => ({
        type: 'contest_submission',
        title: submission.title || 'Untitled Submission',
        date: submission.createdAt || new Date(),
        result: submission.status || undefined
      }));

      const totalSubmissions = contestStats?.totalSubmissions || 0;
      const totalWins = recentSubmissions.filter(s => s.status === 'approved' || s.status === 'winner').length;
      const winRate = totalSubmissions > 0 ? (totalWins / totalSubmissions) * 100 : 0;

      return {
        totalContests: totalSubmissions,
        totalWins,
        totalSubmissions,
        winRate: Math.round(winRate * 100) / 100,
        totalPoints: Number(pointsStats?.totalPoints) || 0,
        averageScore: Number(contestStats?.averageScore) || 0,
        contestsThisYear: yearStats?.contestsThisYear || 0,
        recentActivity
      };
    } catch (error) {
      console.error('Error generating user stats:', error);
      throw error;
    }
  }

  /**
   * Generate portfolio data for media kit
   */
  async generatePortfolio(userId: string, limit = 12): Promise<MediaKitData['portfolio']> {
    try {
      const submissions = await db
        .select({
          id: contestSubmissions.id,
          title: contestSubmissions.title,
          description: contestSubmissions.description,
          fileUrl: contestSubmissions.fileUrl,
          fileType: contestSubmissions.fileType,
          score: contestSubmissions.score,
          status: contestSubmissions.status,
          contestName: contests.title,
          createdAt: contestSubmissions.createdAt
        })
        .from(contestSubmissions)
        .leftJoin(contests, eq(contestSubmissions.contestId, contests.id))
        .where(eq(contestSubmissions.userId, userId))
        .orderBy(desc(contestSubmissions.score), desc(contestSubmissions.createdAt))
        .limit(limit);

      return submissions.map((submission) => ({
        id: submission.id,
        title: submission.title || 'Untitled Submission',
        description: submission.description || undefined,
        fileUrl: submission.fileUrl || undefined,
        fileType: submission.fileType || undefined,
        contestName: submission.contestName || undefined,
        score: Number(submission.score) || undefined,
        placement: submission.status === 'winner' ? 1 : undefined,
        date: submission.createdAt || new Date()
      }));
    } catch (error) {
      console.error('Error generating portfolio:', error);
      throw error;
    }
  }

  /**
   * Create a new media kit
   */
  async createMediaKit(
    userId: string,
    templateId: string,
    title: string,
    type: 'brand' | 'creator' | 'contest',
    customData?: Partial<MediaKitData>
  ): Promise<string> {
    try {
      // Get user info
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate user statistics and portfolio
      const stats = await this.generateUserStats(userId);
      const portfolio = await this.generatePortfolio(userId);

      // Prepare media kit data
      const kitData: MediaKitData = {
        title,
        description: customData?.description,
        userInfo: {
          name: user.name || 'Anonymous User',
          email: user.email,
          bio: user.bio || undefined,
          location: undefined,
          website: undefined,
          socialMedia: {}
        },
        stats,
        portfolio,
        contact: {
          preferredContact: 'email',
          availability: 'Available for collaborations',
          collaborationInterests: ['contests', 'brand_partnerships', 'content_creation']
        }
      };

             // Custom data merging can be implemented later if needed

      // Generate share token
      const shareToken = nanoid(16);

      // Create media kit
      const [mediaKit] = await db
        .insert(mediaKits)
        .values({
          userId,
          templateId,
          title,
          type,
          kitData,
          shareToken,
          status: 'draft'
        })
        .returning({ id: mediaKits.id });

      return mediaKit.id;
    } catch (error) {
      console.error('Error creating media kit:', error);
      throw error;
    }
  }

  /**
   * Update media kit
   */
  async updateMediaKit(
    mediaKitId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      kitData?: Partial<MediaKitData>;
      status?: 'draft' | 'published' | 'archived';
      isPublic?: boolean;
    }
  ): Promise<void> {
    try {
      // Verify ownership
      const [existingKit] = await db
        .select()
        .from(mediaKits)
        .where(and(
          eq(mediaKits.id, mediaKitId),
          eq(mediaKits.userId, userId)
        ))
        .limit(1);

      if (!existingKit) {
        throw new Error('Media kit not found or access denied');
      }

      // Merge kit data if provided
      let updatedKitData = existingKit.kitData;
      if (updates.kitData) {
        const currentKitData = existingKit.kitData && typeof existingKit.kitData === 'object' 
          ? existingKit.kitData as Record<string, any>
          : {};
        updatedKitData = { ...currentKitData, ...updates.kitData };
      }

      // Update media kit
      await db
        .update(mediaKits)
        .set({
          title: updates.title || existingKit.title,
          description: updates.description,
          kitData: updatedKitData,
          status: updates.status || existingKit.status,
          isPublic: updates.isPublic !== undefined ? updates.isPublic : existingKit.isPublic,
          updatedAt: new Date()
        })
        .where(eq(mediaKits.id, mediaKitId));

    } catch (error) {
      console.error('Error updating media kit:', error);
      throw error;
    }
  }

  /**
   * Get media kit by share token
   */
  async getMediaKitByToken(shareToken: string): Promise<any> {
    try {
      const [mediaKit] = await db
        .select()
        .from(mediaKits)
        .where(and(
          eq(mediaKits.shareToken, shareToken),
          eq(mediaKits.isPublic, true),
          eq(mediaKits.status, 'published')
        ))
        .limit(1);

      return mediaKit || null;
    } catch (error) {
      console.error('Error getting media kit by token:', error);
      throw error;
    }
  }

  /**
   * Get user's media kits
   */
  async getUserMediaKits(userId: string): Promise<GeneratedMediaKit[]> {
    try {
      const kits = await db
        .select()
        .from(mediaKits)
        .where(eq(mediaKits.userId, userId))
        .orderBy(desc(mediaKits.updatedAt));

      return kits.map(kit => ({
        id: kit.id,
        title: kit.title,
        type: kit.type as 'brand' | 'creator' | 'contest',
        status: kit.status as 'draft' | 'published' | 'archived',
        shareToken: kit.shareToken || undefined,
        isPublic: kit.isPublic || false,
        downloadCount: kit.downloadCount || 0,
        viewCount: kit.viewCount || 0,
        createdAt: kit.createdAt || new Date(),
        updatedAt: kit.updatedAt || new Date()
      }));
    } catch (error) {
      console.error('Error getting user media kits:', error);
      throw error;
    }
  }

  /**
   * Generate HTML preview of media kit
   */
  generateHTMLPreview(mediaKit: any): string {
    const kitData = mediaKit.kitData as MediaKitData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${mediaKit.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c62828; padding-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
          .stat-item { text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #c62828; }
          .portfolio { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
          .portfolio-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa; }
          .contact-info { background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${mediaKit.title}</h1>
            <h2>${kitData.userInfo.name}</h2>
            <p>${kitData.description || ''}</p>
          </div>
          
          <div class="section">
            <h3>Performance Statistics</h3>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-number">${kitData.stats.totalContests}</div>
                <div>Total Contests</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${kitData.stats.totalWins}</div>
                <div>Wins</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${kitData.stats.winRate}%</div>
                <div>Win Rate</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${kitData.stats.totalPoints}</div>
                <div>Total Points</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Portfolio Highlights</h3>
            <div class="portfolio">
              ${kitData.portfolio.slice(0, 6).map(item => `
                <div class="portfolio-item">
                  <h4>${item.title}</h4>
                  <p><strong>Contest:</strong> ${item.contestName || 'N/A'}</p>
                  <p><strong>Score:</strong> ${item.score || 'N/A'}</p>
                  <p><strong>Date:</strong> ${item.date.toLocaleDateString()}</p>
                  ${item.placement ? `<p><strong>Placement:</strong> #${item.placement}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <h3>Contact & Collaboration</h3>
            <div class="contact-info">
              <p><strong>Email:</strong> ${kitData.userInfo.email || 'Available upon request'}</p>
              <p><strong>Preferred Contact:</strong> ${kitData.contact.preferredContact}</p>
              <p><strong>Availability:</strong> ${kitData.contact.availability}</p>
              <p><strong>Collaboration Interests:</strong> ${kitData.contact.collaborationInterests.join(', ')}</p>
            </div>
          </div>

          <div class="section">
            <h3>Recent Activity</h3>
            <ul>
              ${kitData.stats.recentActivity.slice(0, 5).map(activity => `
                <li><strong>${activity.title}</strong> - ${activity.date.toLocaleDateString()} ${activity.result ? `(${activity.result})` : ''}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const mediaKitService = new MediaKitService(); 