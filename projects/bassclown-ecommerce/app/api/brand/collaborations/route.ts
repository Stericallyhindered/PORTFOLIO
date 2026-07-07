import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { db, brandCollaborations, brandProposals, users } from '@/lib/db'
import { eq, and, or, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

const createProposalSchema = z.object({
  creatorId: z.string().uuid(),
  type: z.enum(['sponsored-post', 'contest-sponsorship', 'product-review', 'brand-ambassador', 'event-partnership']),
  title: z.string().min(1).max(255),
  description: z.string().min(10),
  budget: z.number().positive(),
  timeline: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    milestones: z.array(z.object({
      title: z.string(),
      dueDate: z.string().datetime(),
      description: z.string(),
      deliverables: z.array(z.string())
    }))
  }),
  requirements: z.object({
    platforms: z.array(z.string()),
    contentTypes: z.array(z.string()),
    audienceSize: z.number().optional(),
    demographics: z.object({
      ageRange: z.string().optional(),
      location: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional()
    }).optional(),
    exclusivity: z.boolean().optional(),
    usageRights: z.string().optional()
  }),
  compensation: z.object({
    type: z.enum(['fixed', 'performance', 'hybrid']),
    amount: z.number().positive(),
    performanceMetrics: z.array(z.object({
      metric: z.string(),
      target: z.number(),
      bonus: z.number()
    })).optional(),
    paymentSchedule: z.array(z.object({
      milestone: z.string(),
      percentage: z.number().min(0).max(100),
      dueDate: z.string().datetime()
    }))
  })
})

// GET - Get brand collaborations for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'brand' | 'creator' | null

    // Get collaborations where user is brand or creator
    const collaborations = await db
      .select({
        id: brandCollaborations.id,
        brandId: brandCollaborations.brandId,
        creatorId: brandCollaborations.creatorId,
        status: brandCollaborations.status,
        createdAt: brandCollaborations.createdAt,
        updatedAt: brandCollaborations.updatedAt
      })
      .from(brandCollaborations)
      .where(or(
        eq(brandCollaborations.brandId, user.id),
        eq(brandCollaborations.creatorId, user.id)
      ))
      .orderBy(desc(brandCollaborations.createdAt))

    return successResponse({
      collaborations
    }, 'Collaborations retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create a new collaboration proposal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = createProposalSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const proposalData = validation.data

    // Check if user is a brand (role check)
    const [brandUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!brandUser || brandUser.role !== 'brand') {
      return handleApiError(new Error('Only brands can create proposals'))
    }

    // Create collaboration record first
    const [collaboration] = await db
      .insert(brandCollaborations)
      .values({
        brandId: user.id,
        creatorId: proposalData.creatorId,
        title: proposalData.title,
        description: proposalData.description,
        type: proposalData.type,
        status: 'draft',
        budget: proposalData.budget.toString(),
        timeline: `${proposalData.timeline.startDate} - ${proposalData.timeline.endDate}`,
        deliverables: proposalData.timeline.milestones.flatMap(m => m.deliverables),
        requirements: proposalData.requirements,
        proposedTerms: {
          timeline: proposalData.timeline,
          compensation: proposalData.compensation
        }
      })
      .returning()

    // Create proposal
    const [proposal] = await db
      .insert(brandProposals)
      .values({
        collaborationId: collaboration.id,
        proposedBy: user.id,
        proposalType: 'initial',
        terms: {
          timeline: proposalData.timeline,
          requirements: proposalData.requirements,
          compensation: proposalData.compensation
        },
        message: proposalData.description,
        budget: proposalData.budget.toString(),
        timeline: `${proposalData.timeline.startDate} - ${proposalData.timeline.endDate}`,
        deliverables: proposalData.timeline.milestones.flatMap(m => m.deliverables),
        status: 'pending'
      })
      .returning()

    return successResponse({
      proposal
    }, 'Proposal created successfully', 201)

  } catch (error) {
    return handleApiError(error)
  }
}

