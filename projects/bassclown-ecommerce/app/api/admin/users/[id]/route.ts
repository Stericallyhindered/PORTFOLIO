import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET - Get user by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    
    const { id } = await params

    if (!db) {
      return errorResponse('Database connection unavailable', 500)
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatar: users.avatar,
        bio: users.bio,
        phone: users.phone,
        location: users.location,
        website: users.website,
        socialLinks: users.socialLinks,
        pointsBalance: users.pointsBalance,
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) {
      return errorResponse('User not found', 404)
    }

    return successResponse(user)

  } catch (error) {
    return handleApiError(error)
  }
}



