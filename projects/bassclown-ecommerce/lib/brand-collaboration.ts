import { db } from '@/lib/db';
import { 
  users, 
  contests, 
  giveaways, 
  brandCollaborations, 
  brandProposals, 
  brandContracts,
  mediaKits
} from '@/lib/db/schema';
import { eq, and, or, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

export interface CollaborationProposal {
  id: string;
  brandId: string;
  creatorId: string;
  type: 'sponsored-post' | 'contest-sponsorship' | 'product-review' | 'brand-ambassador' | 'event-partnership';
  title: string;
  description: string;
  budget: number;
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: Array<{
      title: string;
      dueDate: Date;
      description: string;
      deliverables: string[];
    }>;
  };
  requirements: {
    platforms: string[];
    contentTypes: string[];
    audienceSize?: number;
    demographics?: {
      ageRange?: string;
      location?: string[];
      interests?: string[];
    };
    exclusivity?: boolean;
    usageRights?: string;
  };
  compensation: {
    type: 'fixed' | 'performance' | 'hybrid';
    amount: number;
    performanceMetrics?: {
      metric: string;
      target: number;
      bonus: number;
    }[];
    paymentSchedule: Array<{
      milestone: string;
      percentage: number;
      dueDate: Date;
    }>;
  };
  status: 'draft' | 'sent' | 'under-review' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationContract {
  id: string;
  proposalId: string;
  brandId: string;
  creatorId: string;
  terms: {
    scope: string;
    deliverables: Array<{
      type: string;
      description: string;
      quantity: number;
      deadline: Date;
      specifications: Record<string, any>;
    }>;
    timeline: {
      startDate: Date;
      endDate: Date;
      milestones: Array<{
        title: string;
        dueDate: Date;
        payment: number;
        deliverables: string[];
      }>;
    };
    compensation: {
      totalAmount: number;
      currency: string;
      paymentTerms: string;
      schedule: Array<{
        milestone: string;
        amount: number;
        dueDate: Date;
        status: 'pending' | 'paid' | 'overdue';
      }>;
    };
    rights: {
      usage: string;
      duration: string;
      exclusivity: boolean;
      territory: string[];
    };
    performance: {
      metrics: Array<{
        name: string;
        target: number;
        measurement: string;
      }>;
      reporting: {
        frequency: string;
        format: string;
        deadline: string;
      };
    };
  };
  legalTerms: {
    cancellation: string;
    liability: string;
    disputeResolution: string;
    governingLaw: string;
  };
  signatures: {
    brand: {
      signedAt?: Date;
      signedBy?: string;
      ipAddress?: string;
    };
    creator: {
      signedAt?: Date;
      signedBy?: string;
      ipAddress?: string;
    };
  };
  status: 'draft' | 'pending-signatures' | 'active' | 'completed' | 'terminated' | 'disputed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationMetrics {
  reach: number;
  impressions: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  clickThroughs: number;
  conversions: number;
  revenue?: number;
  roi?: number;
  audienceGrowth: number;
  brandMentions: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  reportedAt: Date;
}

export class BrandCollaborationService {
  // Proposal Management
  async createProposal(
    brandId: string,
    proposalData: Omit<CollaborationProposal, 'id' | 'brandId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<CollaborationProposal> {
    const proposal: CollaborationProposal = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brandId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...proposalData
    };

    // Store in database (simulated)
    await this.storeProposal(proposal);

    return proposal;
  }

  async sendProposal(proposalId: string): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    // Update status
    proposal.status = 'sent';
    proposal.updatedAt = new Date();
    await this.updateProposal(proposal);

    // Get creator and brand info
    const [creator, brand] = await Promise.all([
      this.getUser(proposal.creatorId),
      this.getUser(proposal.brandId)
    ]);

    // Send notification email to creator
    await emailService.sendNotification(creator.id, 'collaboration_proposal', {
      brandName: brand.name,
      proposalTitle: proposal.title,
      budget: proposal.budget
    });

    // Send confirmation to brand
    await emailService.sendNotification(brand.id, 'proposal_sent', {
      creatorName: creator.name,
      proposalTitle: proposal.title
    });
  }

  async respondToProposal(
    proposalId: string,
    creatorId: string,
    response: 'accept' | 'reject' | 'negotiate',
    message?: string,
    counterOffer?: Partial<CollaborationProposal>
  ): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.creatorId !== creatorId) throw new Error('Unauthorized');

    switch (response) {
      case 'accept':
        proposal.status = 'accepted';
        // Create contract
        await this.createContract(proposal);
        break;
      case 'reject':
        proposal.status = 'rejected';
        break;
      case 'negotiate':
        proposal.status = 'negotiating';
        if (counterOffer) {
          // Create counter-proposal
          await this.createCounterProposal(proposal, counterOffer);
        }
        break;
    }

    proposal.updatedAt = new Date();
    await this.updateProposal(proposal);

    // Notify brand of response
    const brand = await this.getUser(proposal.brandId);
    const creator = await this.getUser(proposal.creatorId);

    await emailService.sendNotification(brand.id, 'proposal_response', {
      creatorName: creator.name,
      response,
      proposalTitle: proposal.title,
      message: message || ''
    });
  }

  // Contract Management
  async createContract(proposal: CollaborationProposal): Promise<CollaborationContract> {
    const contract: CollaborationContract = {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proposalId: proposal.id,
      brandId: proposal.brandId,
      creatorId: proposal.creatorId,
      terms: {
        scope: proposal.description,
        deliverables: proposal.timeline.milestones.map(milestone => ({
          type: 'content',
          description: milestone.description,
          quantity: milestone.deliverables.length,
          deadline: milestone.dueDate,
          specifications: {}
        })),
        timeline: {
          startDate: proposal.timeline.startDate,
          endDate: proposal.timeline.endDate,
          milestones: proposal.timeline.milestones.map((milestone, index) => ({
            title: milestone.title,
            dueDate: milestone.dueDate,
            payment: proposal.compensation.amount / proposal.timeline.milestones.length, // Distribute payment evenly
            deliverables: milestone.deliverables
          }))
        },
        compensation: {
          totalAmount: proposal.compensation.amount,
          currency: 'USD',
          paymentTerms: 'Net 30',
          schedule: proposal.compensation.paymentSchedule.map(payment => ({
            milestone: payment.milestone,
            amount: (proposal.compensation.amount * payment.percentage) / 100,
            dueDate: payment.dueDate,
            status: 'pending' as const
          }))
        },
        rights: {
          usage: proposal.requirements.usageRights || 'Standard usage rights',
          duration: '1 year',
          exclusivity: proposal.requirements.exclusivity || false,
          territory: proposal.requirements.demographics?.location || ['US']
        },
        performance: {
          metrics: proposal.compensation.performanceMetrics?.map(metric => ({
            name: metric.metric,
            target: metric.target,
            measurement: 'Monthly'
          })) || [],
          reporting: {
            frequency: 'Monthly',
            format: 'Dashboard + Report',
            deadline: 'End of month + 5 days'
          }
        }
      },
      legalTerms: {
        cancellation: 'Either party may terminate with 30 days written notice',
        liability: 'Limited to contract value',
        disputeResolution: 'Binding arbitration',
        governingLaw: 'State of California'
      },
      signatures: {
        brand: {},
        creator: {}
      },
      status: 'pending-signatures',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storeContract(contract);

    // Send contract for signatures
    await this.sendContractForSignature(contract);

    return contract;
  }

  async signContract(
    contractId: string,
    userId: string,
    userType: 'brand' | 'creator',
    ipAddress: string
  ): Promise<void> {
    const contract = await this.getContract(contractId);
    if (!contract) throw new Error('Contract not found');

    const signature = {
      signedAt: new Date(),
      signedBy: userId,
      ipAddress
    };

    if (userType === 'brand' && contract.brandId === userId) {
      contract.signatures.brand = signature;
    } else if (userType === 'creator' && contract.creatorId === userId) {
      contract.signatures.creator = signature;
    } else {
      throw new Error('Unauthorized to sign this contract');
    }

    // Check if both parties have signed
    if (contract.signatures.brand.signedAt && contract.signatures.creator.signedAt) {
      contract.status = 'active';
      
      // Send confirmation emails
      const [brand, creator] = await Promise.all([
        this.getUser(contract.brandId),
        this.getUser(contract.creatorId)
      ]);

      await Promise.all([
        emailService.sendNotification(brand.id, 'contract_signed', {
          contractId: contract.id,
          message: 'Your collaboration contract has been fully signed and is now active.'
        }),
        emailService.sendNotification(creator.id, 'contract_signed', {
          contractId: contract.id,
          message: 'Your collaboration contract has been fully signed and is now active.'
        })
      ]);
    }

    contract.updatedAt = new Date();
    await this.updateContract(contract);
  }

  // Campaign Management
  async createCampaign(
    contractId: string,
    campaignData: {
      name: string;
      description: string;
      startDate: Date;
      endDate: Date;
      objectives: string[];
      targetMetrics: Record<string, number>;
    }
  ) {
    const contract = await this.getContract(contractId);
    if (!contract) throw new Error('Contract not found');

    const campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contractId,
      ...campaignData,
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storeCampaign(campaign);
    return campaign;
  }

  async trackCampaignMetrics(
    campaignId: string,
    metrics: CollaborationMetrics
  ): Promise<void> {
    await this.storeMetrics(campaignId, metrics);

    // Check if metrics meet contract targets
    const campaign = await this.getCampaign(campaignId);
    const contract = await this.getContract(campaign.contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    for (const target of contract.terms.performance.metrics) {
      const actualValue = this.getMetricValue(metrics, target.name);
      if (actualValue >= target.target) {
        // Trigger performance bonus if applicable
        await this.processPerformanceBonus(contract, target.name, actualValue);
      }
    }
  }

  // Discovery and Matching
  async findBrandCollaborationOpportunities(
    creatorId: string,
    filters?: {
      budget?: { min?: number; max?: number };
      type?: string[];
      timeline?: { maxDuration?: number };
      categories?: string[];
    }
  ): Promise<CollaborationProposal[]> {
    // This would query active proposals that match creator's profile
    const creator = await this.getUser(creatorId);
    const mediaKit = await this.getCreatorMediaKit(creatorId);

    // Simulate matching algorithm
    const opportunities = await this.getOpenCollaborationOpportunities(filters);
    
    return opportunities.filter(opportunity => 
      this.isCreatorMatch(creator, mediaKit, opportunity)
    );
  }

  async findCreatorsForBrand(
    brandId: string,
    requirements: {
      audienceSize?: { min?: number; max?: number };
      categories?: string[];
      location?: string[];
      engagement?: { min?: number };
      budget?: number;
    }
  ): Promise<Array<{ user: any; mediaKit: any; matchScore: number }>> {
    const creators = await this.getCreatorsWithMediaKits();
    
    return creators
      .map(({ user, mediaKit }) => ({
        user,
        mediaKit,
        matchScore: this.calculateBrandCreatorMatch(requirements, user, mediaKit)
      }))
      .filter(result => result.matchScore > 0.6)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);
  }

  // Analytics and Reporting
  async generateCollaborationReport(
    contractId: string,
    period?: { startDate: Date; endDate: Date }
  ) {
    const contract = await this.getContract(contractId);
    const campaigns = await this.getContractCampaigns(contractId);
    const metrics = await this.getContractMetrics(contractId, period);

    if (!contract) {
      throw new Error(`Contract with ID ${contractId} not found`);
    }

    return {
      contract: {
        id: contract.id,
        status: contract.status,
        totalValue: contract.terms.compensation.totalAmount,
        startDate: contract.terms.timeline.startDate,
        endDate: contract.terms.timeline.endDate
      },
      campaigns: campaigns.length,
      performance: {
        totalReach: metrics.reduce((sum, m) => sum + m.reach, 0),
        totalImpressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
        totalEngagement: metrics.reduce((sum, m) => 
          sum + m.engagement.likes + m.engagement.comments + m.engagement.shares, 0
        ),
        averageEngagementRate: this.calculateAverageEngagementRate(metrics),
        conversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
        roi: this.calculateROI(metrics, contract.terms.compensation.totalAmount)
      },
      milestones: contract.terms.timeline.milestones.map(milestone => ({
        title: milestone.title,
        dueDate: milestone.dueDate,
        status: this.getMilestoneStatus(milestone, new Date()),
        payment: milestone.payment
      })),
      generatedAt: new Date()
    };
  }

  // Helper Methods
  private async storeProposal(proposal: CollaborationProposal): Promise<void> {
    // In a real implementation, this would store in the database
    console.log('Storing proposal:', proposal.id);
  }

  private async getProposal(proposalId: string): Promise<CollaborationProposal | null> {
    // Mock implementation
    return null;
  }

  private async updateProposal(proposal: CollaborationProposal): Promise<void> {
    console.log('Updating proposal:', proposal.id);
  }

  private async storeContract(contract: CollaborationContract): Promise<void> {
    console.log('Storing contract:', contract.id);
  }

  private async getContract(contractId: string): Promise<CollaborationContract | null> {
    return null;
  }

  private async updateContract(contract: CollaborationContract): Promise<void> {
    console.log('Updating contract:', contract.id);
  }

  private async getUser(userId: string): Promise<any> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user[0];
  }

  private async getCreatorMediaKit(creatorId: string): Promise<any> {
    const mediaKit = await db.select().from(mediaKits).where(eq(mediaKits.userId, creatorId)).limit(1);
    return mediaKit[0];
  }

  private async sendContractForSignature(contract: CollaborationContract): Promise<void> {
    const [brand, creator] = await Promise.all([
      this.getUser(contract.brandId),
      this.getUser(contract.creatorId)
    ]);

    await Promise.all([
      emailService.sendNotification(brand.id, 'contract_signature', {
        contractId: contract.id,
        contractTitle: 'Collaboration Contract'
      }),
      emailService.sendNotification(creator.id, 'contract_signature', {
        contractId: contract.id,
        contractTitle: 'Collaboration Contract'
      })
    ]);
  }

  private generateProposalEmail(
    proposal: CollaborationProposal,
    brand: any,
    creator: any
  ): string {
    return `
      <h2>New Collaboration Proposal</h2>
      <p>Hello ${creator.name},</p>
      <p>${brand.name} has sent you a collaboration proposal:</p>
      <ul>
        <li><strong>Type:</strong> ${proposal.type}</li>
        <li><strong>Budget:</strong> $${proposal.budget}</li>
        <li><strong>Timeline:</strong> ${proposal.timeline.startDate.toDateString()} - ${proposal.timeline.endDate.toDateString()}</li>
      </ul>
      <p><strong>Description:</strong> ${proposal.description}</p>
      <p>Please log in to your account to review the full details and respond.</p>
    `;
  }

  private generateResponseEmail(
    proposal: CollaborationProposal,
    creator: any,
    response: string,
    message?: string
  ): string {
    return `
      <h2>Proposal ${response.charAt(0).toUpperCase() + response.slice(1)}ed</h2>
      <p>${creator.name} has ${response}ed your collaboration proposal for "${proposal.title}".</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p>Please log in to your account for more details.</p>
    `;
  }

  private async createCounterProposal(
    originalProposal: CollaborationProposal,
    counterOffer: Partial<CollaborationProposal>
  ): Promise<void> {
    // Create a new proposal with counter-offer terms
    const counterProposal = {
      ...originalProposal,
      ...counterOffer,
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storeProposal(counterProposal);
  }

  private isCreatorMatch(
    creator: any,
    mediaKit: any,
    opportunity: CollaborationProposal
  ): boolean {
    // Implement matching logic based on creator profile and opportunity requirements
    return true;
  }

  private calculateBrandCreatorMatch(
    requirements: any,
    creator: any,
    mediaKit: any
  ): number {
    // Implement matching score calculation
    return Math.random(); // Mock implementation
  }

  private async getOpenCollaborationOpportunities(filters?: any): Promise<CollaborationProposal[]> {
    return []; // Mock implementation
  }

  private async getCreatorsWithMediaKits(): Promise<Array<{ user: any; mediaKit: any }>> {
    return []; // Mock implementation
  }

  private async storeCampaign(campaign: any): Promise<void> {
    console.log('Storing campaign:', campaign.id);
  }

  private async getCampaign(campaignId: string): Promise<any> {
    return null;
  }

  private async storeMetrics(campaignId: string, metrics: CollaborationMetrics): Promise<void> {
    console.log('Storing metrics for campaign:', campaignId);
  }

  private getMetricValue(metrics: CollaborationMetrics, metricName: string): number {
    switch (metricName) {
      case 'reach': return metrics.reach;
      case 'impressions': return metrics.impressions;
      case 'engagement': return Object.values(metrics.engagement).reduce((sum, val) => sum + val, 0);
      case 'conversions': return metrics.conversions;
      default: return 0;
    }
  }

  private async processPerformanceBonus(
    contract: CollaborationContract,
    metricName: string,
    actualValue: number
  ): Promise<void> {
    // Process performance bonus payment
    console.log(`Performance bonus triggered for ${metricName}: ${actualValue}`);
  }

  private async getContractCampaigns(contractId: string): Promise<any[]> {
    return [];
  }

  private async getContractMetrics(
    contractId: string,
    period?: { startDate: Date; endDate: Date }
  ): Promise<CollaborationMetrics[]> {
    return [];
  }

  private calculateAverageEngagementRate(metrics: CollaborationMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const totalEngagement = metrics.reduce((sum, m) => 
      sum + m.engagement.likes + m.engagement.comments + m.engagement.shares, 0
    );
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    
    return totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
  }

  private calculateROI(metrics: CollaborationMetrics[], investment: number): number {
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    return investment > 0 ? ((totalRevenue - investment) / investment) * 100 : 0;
  }

  private getMilestoneStatus(milestone: any, currentDate: Date): string {
    if (currentDate < milestone.dueDate) return 'pending';
    if (currentDate.toDateString() === milestone.dueDate.toDateString()) return 'due-today';
    return 'overdue';
  }
}

export const brandCollaborationService = new BrandCollaborationService(); 