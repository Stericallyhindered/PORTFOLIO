import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { db, brandProposals, brandCollaborations, users } from '@/lib/db'
import { eq, or, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

// GET - Get proposals for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role') as 'brand' | 'creator' | null

    // Filter by user role - need to join with collaborations table
    // Show proposals from collaborations where user is brand or creator
    const proposals = await db
      .select({
        proposal: brandProposals,
        collaboration: brandCollaborations,
        brandName: users.name
      })
      .from(brandProposals)
      .innerJoin(brandCollaborations, eq(brandProposals.collaborationId, brandCollaborations.id))
      .leftJoin(users, eq(brandCollaborations.brandId, users.id))
      .where(
        role === 'brand' 
          ? eq(brandCollaborations.brandId, user.id)
          : role === 'creator'
          ? eq(brandCollaborations.creatorId, user.id)
          : or(
              eq(brandCollaborations.brandId, user.id),
              eq(brandCollaborations.creatorId, user.id)
            )
      )
      .orderBy(desc(brandProposals.createdAt))

    if (status) {
      // Filter by status after the fact since we need the join
      const filtered = proposals.filter(p => p.proposal.status === status)
      return successResponse({
        proposals: filtered.map(p => ({
          ...p.proposal,
          collaboration: p.collaboration,
          brandName: p.brandName
        }))
      }, 'Proposals retrieved successfully')
    }

    return successResponse({
      proposals: proposals.map(p => ({
        ...p.proposal,
        collaboration: p.collaboration,
        brandName: p.brandName
      }))
    }, 'Proposals retrieved successfully')


  } catch (error) {
    return handleApiError(error)
  }
}

