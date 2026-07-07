import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError, notFoundResponse } from '@/lib/api-response'
import { db, brandProposals, brandCollaborations } from '@/lib/db'
import { eq, and, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

const respondToProposalSchema = z.object({
  response: z.enum(['accept', 'reject', 'negotiate']),
  message: z.string().optional(),
  counterOffer: z.object({
    budget: z.number().optional(),
    timeline: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    }).optional(),
    compensation: z.object({
      amount: z.number().optional()
    }).optional()
  }).optional()
})

// GET - Get specific proposal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: proposalId } = await params

    // Need to join with collaborations to check permissions
    const [result] = await db
      .select({
        proposal: brandProposals,
        collaboration: brandCollaborations
      })
      .from(brandProposals)
      .innerJoin(brandCollaborations, eq(brandProposals.collaborationId, brandCollaborations.id))
      .where(and(
        eq(brandProposals.id, proposalId),
        or(
          eq(brandCollaborations.brandId, user.id),
          eq(brandCollaborations.creatorId, user.id)
        )
      ))
      .limit(1)

    const proposal = result?.proposal

    if (!proposal) {
      return notFoundResponse('Proposal not found')
    }

    return successResponse({
      proposal
    }, 'Proposal retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Send proposal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: proposalId } = await params

    // Get proposal with collaboration info
    const [result] = await db
      .select({
        proposal: brandProposals,
        collaboration: brandCollaborations
      })
      .from(brandProposals)
      .innerJoin(brandCollaborations, eq(brandProposals.collaborationId, brandCollaborations.id))
      .where(and(
        eq(brandProposals.id, proposalId),
        eq(brandCollaborations.brandId, user.id)
      ))
      .limit(1)

    if (!result) {
      return notFoundResponse('Proposal not found or access denied')
    }

    const proposal = result.proposal
    const collaboration = result.collaboration

    if (proposal.status !== 'pending' && collaboration.status !== 'draft') {
      return handleApiError(new Error('Proposal has already been sent'))
    }

    // Update proposal and collaboration status
    await db
      .update(brandProposals)
      .set({ status: 'pending' })
      .where(eq(brandProposals.id, proposalId))

    await db
      .update(brandCollaborations)
      .set({ status: 'proposed' })
      .where(eq(brandCollaborations.id, collaboration.id))

    // TODO: Send email notification to creator

    return successResponse({
      message: 'Proposal sent successfully'
    }, 'Proposal sent successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Respond to proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: proposalId } = await params
    const body = await request.json()

    // Validate input
    const validation = respondToProposalSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { response, message, counterOffer } = validation.data

    // Get proposal with collaboration to verify user is creator
    const [result] = await db
      .select({
        proposal: brandProposals,
        collaboration: brandCollaborations
      })
      .from(brandProposals)
      .innerJoin(brandCollaborations, eq(brandProposals.collaborationId, brandCollaborations.id))
      .where(and(
        eq(brandProposals.id, proposalId),
        eq(brandCollaborations.creatorId, user.id)
      ))
      .limit(1)

    if (!result) {
      return notFoundResponse('Proposal not found or access denied')
    }

    const proposal = result.proposal
    const collaboration = result.collaboration

    // Update proposal status based on response
    if (response === 'accept') {
      await db
        .update(brandProposals)
        .set({ status: 'accepted' })
        .where(eq(brandProposals.id, proposalId))

      await db
        .update(brandCollaborations)
        .set({ status: 'approved' })
        .where(eq(brandCollaborations.id, collaboration.id))

      // TODO: Create contract
    } else if (response === 'reject') {
      await db
        .update(brandProposals)
        .set({ status: 'rejected' })
        .where(eq(brandProposals.id, proposalId))

      await db
        .update(brandCollaborations)
        .set({ status: 'cancelled' })
        .where(eq(brandCollaborations.id, collaboration.id))
    } else if (response === 'negotiate') {
      await db
        .update(brandCollaborations)
        .set({ status: 'negotiating' })
        .where(eq(brandCollaborations.id, collaboration.id))

      // TODO: Create counter-proposal if counterOffer provided
    }

    // TODO: Send email notification to brand

    return successResponse({
      message: `Proposal ${response}ed successfully`
    }, `Proposal ${response}ed successfully`)

  } catch (error) {
    return handleApiError(error)
  }
}

