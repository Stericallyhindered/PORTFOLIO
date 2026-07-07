import { db, mediaKitTemplates, mediaKits, mediaKitAssets, mediaKitAnalytics, users, contests, contestSubmissions, giveaways, pointsTransactions } from '@/lib/db';
import { eq, and, desc, count, sum, avg, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import puppeteer from 'puppeteer';
import { put } from '@vercel/blob';

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
  // Basic Info
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
  
  // Statistics
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
  
  // Portfolio/Showcase
  portfolio: Array<{
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    contestName?: string;
    score?: number;
    placement?: number;
    date: Date;
  }>;
  
  // Brand-specific data
  brandInfo?: {
    companyName: string;
    industry: string;
    targetAudience: string;
    brandValues: string[];
    collaborationTypes: string[];
    budget?: string;
    previousCollaborations?: Array<{
      partner: string;
      type: string;
      outcome: string;
      date: Date;
    }>;
  };
  
  // Contact/Collaboration
  contact: {
    preferredContact: string;
    availability: string;
    collaborationInterests: string[];
    rates?: Record<string, string>;
  };
}

export interface MediaKitCustomization {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    sections: string[];
    sectionOrder: number[];
  };
  branding: {
    logoUrl?: string;
    headerImageUrl?: string;
    showWatermark: boolean;
  };
}

export interface GeneratedMediaKit {
  id: string;
  title: string;
  type: 'brand' | 'creator' | 'contest';
  status: 'draft' | 'published' | 'archived';
  pdfUrl?: string;
  htmlUrl?: string;
  shareToken?: string;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class MediaKitService {
  
  /**
   * Initialize default templates if they don't exist
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      const existingTemplates = await db.select().from(mediaKitTemplates).limit(1);
      
      if (existingTemplates.length > 0) {
        return; // Templates already exist
      }

      const defaultTemplates = [
        {
          name: 'Creator Portfolio',
          description: 'Standard template for content creators showcasing their work and statistics',
          type: 'creator' as const,
          templateData: {
            layout: 'portfolio',
            sections: ['header', 'stats', 'portfolio', 'contact'],
            colors: {
              primary: '#c62828',
              secondary: '#1976d2',
              accent: '#ff9800',
              background: '#ffffff',
              text: '#333333'
            },
            fonts: {
              heading: 'Arial, sans-serif',
              body: 'Arial, sans-serif'
            }
          },
          isActive: true,
          isPremium: false
        },
        {
          name: 'Brand Showcase',
          description: 'Professional template for brands to showcase their campaigns and collaborations',
          type: 'brand' as const,
          templateData: {
            layout: 'showcase',
            sections: ['header', 'brandInfo', 'collaborations', 'contact'],
            colors: {
              primary: '#1976d2',
              secondary: '#c62828',
              accent: '#4caf50',
              background: '#f5f5f5',
              text: '#212121'
            },
            fonts: {
              heading: 'Arial, sans-serif',
              body: 'Arial, sans-serif'
            }
          },
          isActive: true,
          isPremium: false
        },
        {
          name: 'Contest Highlights',
          description: 'Template for showcasing contest entries and achievements',
          type: 'contest' as const,
          templateData: {
            layout: 'highlights',
            sections: ['header', 'stats', 'portfolio', 'recentActivity'],
            colors: {
              primary: '#ff9800',
              secondary: '#c62828',
              accent: '#1976d2',
              background: '#ffffff',
              text: '#333333'
            },
            fonts: {
              heading: 'Arial, sans-serif',
              body: 'Arial, sans-serif'
            }
          },
          isActive: true,
          isPremium: false
        }
      ];

      await db.insert(mediaKitTemplates).values(defaultTemplates);
      console.log('✅ Default media kit templates initialized');
    } catch (error) {
      console.error('Error initializing default templates:', error);
      // Don't throw - templates might already exist
    }
  }
  
  /**
   * Get available templates
   */
  async getTemplates(type?: 'brand' | 'creator' | 'contest', includeInactive = false): Promise<MediaKitTemplate[]> {
    // Ensure default templates exist
    await this.initializeDefaultTemplates();
    try {
      const conditions = [eq(mediaKitTemplates.isActive, true)];
      
      if (type) {
        conditions.push(eq(mediaKitTemplates.type, type));
      }
      
      if (includeInactive) {
        conditions.pop(); // Remove isActive condition
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
          totalWins: count(contestSubmissions.id),
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

       return submissions.map((submission, index) => ({
         id: submission.id,
         title: submission.title || 'Untitled Submission',
         description: submission.description || undefined,
         imageUrl: submission.fileType?.includes('image') ? submission.fileUrl : undefined,
         videoUrl: submission.fileType?.includes('video') ? submission.fileUrl : undefined,
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

       // Merge custom data if provided
       if (customData) {
         Object.assign(kitData, customData);
       }

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
      customization?: MediaKitCustomization;
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
          customization: updates.customization || existingKit.customization,
          status: updates.status || existingKit.status,
          isPublic: updates.isPublic !== undefined ? updates.isPublic : existingKit.isPublic,
          updatedAt: new Date()
        })
        .where(eq(mediaKits.id, mediaKitId));

      // If publishing, regenerate PDF
      if (updates.status === 'published') {
        await this.generatePDF(mediaKitId);
      }
    } catch (error) {
      console.error('Error updating media kit:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from media kit
   */
  async generatePDF(mediaKitId: string): Promise<string> {
    try {
      // Get media kit data
      const [mediaKit] = await db
        .select()
        .from(mediaKits)
        .where(eq(mediaKits.id, mediaKitId))
        .limit(1);

      if (!mediaKit) {
        throw new Error('Media kit not found');
      }

      // Get template
      const [template] = await db
        .select()
        .from(mediaKitTemplates)
        .where(eq(mediaKitTemplates.id, mediaKit.templateId || ''))
        .limit(1);

      // Generate HTML content
      const htmlContent = this.generateHTML(mediaKit, template);

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      await browser.close();

      // Upload PDF to storage (implementation depends on your storage provider)
      const pdfUrl = await this.uploadPDF(Buffer.from(pdfBuffer), `media-kit-${mediaKitId}.pdf`);

      // Update media kit with PDF URL
      await db
        .update(mediaKits)
        .set({
          generatedPdfUrl: pdfUrl,
          updatedAt: new Date()
        })
        .where(eq(mediaKits.id, mediaKitId));

      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Track analytics event
   */
  async trackEvent(
    mediaKitId: string,
    eventType: 'view' | 'download' | 'share' | 'contact',
    metadata?: any,
    userId?: string,
    visitorId?: string
  ): Promise<void> {
    try {
      await db.insert(mediaKitAnalytics).values({
        mediaKitId,
        eventType,
        userId,
        visitorId,
        metadata,
        createdAt: new Date()
      });

      // Update counters on media kit
      if (eventType === 'view') {
        const [currentKit] = await db
          .select({ viewCount: mediaKits.viewCount })
          .from(mediaKits)
          .where(eq(mediaKits.id, mediaKitId))
          .limit(1);
        
        await db
          .update(mediaKits)
          .set({
            viewCount: (currentKit?.viewCount || 0) + 1
          })
          .where(eq(mediaKits.id, mediaKitId));
      } else if (eventType === 'download') {
        const [currentKit] = await db
          .select({ downloadCount: mediaKits.downloadCount })
          .from(mediaKits)
          .where(eq(mediaKits.id, mediaKitId))
          .limit(1);
        
        await db
          .update(mediaKits)
          .set({
            downloadCount: (currentKit?.downloadCount || 0) + 1
          })
          .where(eq(mediaKits.id, mediaKitId));
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
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

      if (!mediaKit) {
        return null;
      }

      // Track view
      await this.trackEvent(mediaKit.id, 'view', { source: 'public_link' });

      return mediaKit;
    } catch (error) {
      console.error('Error getting media kit by token:', error);
      throw error;
    }
  }

  /**
   * Get user's media kits
   */
  async getUserMediaKits(
    userId: string, 
    type?: 'brand' | 'creator' | 'contest',
    status?: 'draft' | 'published' | 'archived'
  ): Promise<GeneratedMediaKit[]> {
    try {
      let conditions: any[] = [eq(mediaKits.userId, userId)];
      
      if (type) {
        conditions.push(eq(mediaKits.type, type));
      }
      
      if (status) {
        conditions.push(eq(mediaKits.status, status));
      }

      const kits = await db
        .select()
        .from(mediaKits)
        .where(and(...conditions))
        .orderBy(desc(mediaKits.updatedAt));

      return kits.map(kit => ({
        id: kit.id,
        title: kit.title,
        type: kit.type as 'brand' | 'creator' | 'contest',
        status: kit.status as 'draft' | 'published' | 'archived',
        pdfUrl: kit.generatedPdfUrl || undefined,
        htmlUrl: kit.generatedHtmlUrl || undefined,
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

  // Private helper methods

  private generateHTML(mediaKit: any, template: any): string {
    const kitData = mediaKit.kitData as MediaKitData;
    const customization = mediaKit.customization as MediaKitCustomization | null;
    const templateData = template?.templateData || {};
    
    // Use customization colors if available, otherwise use template colors, otherwise defaults
    const colors = customization?.colors || templateData.colors || {
      primary: '#c62828',
      secondary: '#1976d2',
      accent: '#ff9800',
      background: '#ffffff',
      text: '#333333'
    };
    
    const fonts = customization?.fonts || templateData.fonts || {
      heading: 'Arial, sans-serif',
      body: 'Arial, sans-serif'
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${mediaKit.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${fonts.body}; 
            margin: 0; 
            padding: 0;
            background-color: ${colors.background};
            color: ${colors.text};
            line-height: 1.6;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 3px solid ${colors.primary};
          }
          .header h1 {
            font-family: ${fonts.heading};
            font-size: 2.5em;
            color: ${colors.primary};
            margin-bottom: 10px;
          }
          .header h2 {
            font-family: ${fonts.heading};
            font-size: 1.8em;
            color: ${colors.secondary};
            margin-bottom: 15px;
          }
          .header p {
            font-size: 1.1em;
            color: ${colors.text};
            max-width: 600px;
            margin: 0 auto;
          }
          .section { 
            margin-bottom: 40px;
            padding: 30px;
            background: ${colors.background === '#ffffff' ? '#f9f9f9' : colors.background};
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .section h3 {
            font-family: ${fonts.heading};
            font-size: 1.8em;
            color: ${colors.primary};
            margin-bottom: 20px;
            border-bottom: 2px solid ${colors.accent};
            padding-bottom: 10px;
          }
          .stats { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .stat-item { 
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-top: 4px solid ${colors.primary};
          }
          .stat-item strong {
            display: block;
            font-size: 2em;
            color: ${colors.primary};
            font-weight: bold;
            margin-bottom: 5px;
          }
          .stat-item div {
            color: ${colors.text};
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .portfolio { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px;
            margin-top: 20px;
          }
          .portfolio-item { 
            border: 1px solid #ddd; 
            padding: 20px; 
            border-radius: 8px;
            background: white;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .portfolio-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }
          .portfolio-item h4 {
            color: ${colors.primary};
            margin-bottom: 10px;
            font-size: 1.2em;
          }
          .portfolio-item p {
            margin: 5px 0;
            color: ${colors.text};
            font-size: 0.9em;
          }
          .contact-info {
            background: linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%);
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid ${colors.primary};
          }
          .contact-info p {
            margin: 10px 0;
            font-size: 1em;
          }
          .contact-info strong {
            color: ${colors.primary};
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
          @media print {
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${mediaKit.title}</h1>
            <h2>${kitData.userInfo.name}</h2>
            ${kitData.description ? `<p>${kitData.description}</p>` : ''}
          </div>
          
          <div class="section">
            <h3>Performance Statistics</h3>
            <div class="stats">
              <div class="stat-item">
                <strong>${kitData.stats.totalContests}</strong>
                <div>Total Contests</div>
              </div>
              <div class="stat-item">
                <strong>${kitData.stats.totalWins}</strong>
                <div>Wins</div>
              </div>
              <div class="stat-item">
                <strong>${kitData.stats.winRate.toFixed(1)}%</strong>
                <div>Win Rate</div>
              </div>
              <div class="stat-item">
                <strong>${kitData.stats.totalPoints}</strong>
                <div>Total Points</div>
              </div>
              <div class="stat-item">
                <strong>${kitData.stats.averageScore.toFixed(1)}</strong>
                <div>Avg Score</div>
              </div>
              <div class="stat-item">
                <strong>${kitData.stats.contestsThisYear}</strong>
                <div>This Year</div>
              </div>
            </div>
          </div>

          ${kitData.portfolio.length > 0 ? `
          <div class="section">
            <h3>Portfolio Highlights</h3>
            <div class="portfolio">
              ${kitData.portfolio.slice(0, 12).map(item => `
                <div class="portfolio-item">
                  <h4>${item.title}</h4>
                  ${item.contestName ? `<p><strong>Contest:</strong> ${item.contestName}</p>` : ''}
                  ${item.score ? `<p><strong>Score:</strong> ${item.score}</p>` : ''}
                  ${item.placement ? `<p><strong>Placement:</strong> #${item.placement}</p>` : ''}
                  <p><strong>Date:</strong> ${new Date(item.date).toLocaleDateString()}</p>
                  ${item.description ? `<p style="margin-top: 10px; font-size: 0.85em; color: #666;">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h3>Contact & Collaboration</h3>
            <div class="contact-info">
              ${kitData.userInfo.email ? `<p><strong>Email:</strong> ${kitData.userInfo.email}</p>` : ''}
              <p><strong>Preferred Contact:</strong> ${kitData.contact.preferredContact}</p>
              <p><strong>Availability:</strong> ${kitData.contact.availability}</p>
              ${kitData.contact.collaborationInterests.length > 0 ? `
                <p><strong>Collaboration Interests:</strong> ${kitData.contact.collaborationInterests.join(', ')}</p>
              ` : ''}
            </div>
          </div>

          ${kitData.stats.recentActivity.length > 0 ? `
          <div class="section">
            <h3>Recent Activity</h3>
            <ul style="list-style: none; padding: 0;">
              ${kitData.stats.recentActivity.slice(0, 10).map(activity => `
                <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <strong>${activity.title}</strong> - ${new Date(activity.date).toLocaleDateString()}
                  ${activity.result ? ` <span style="color: ${colors.secondary};">(${activity.result})</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div class="footer">
            <p>Generated by Bass Clown Co on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async uploadPDF(pdfBuffer: Buffer, filename: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const uniqueFilename = `media-kits/${timestamp}_${filename}`;
      
      const blob = await put(uniqueFilename, pdfBuffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/pdf'
      });

      return blob.url;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw new Error('Failed to upload PDF to storage');
    }
  }
}

export const mediaKitService = new MediaKitService(); 