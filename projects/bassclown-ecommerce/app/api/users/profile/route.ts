import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  location: z.string().max(255, 'Location is too long').optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  socialLinks: z.record(z.string().url()).optional()
})

export const dynamic = 'force-dynamic';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get full user profile
    const [profile] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
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
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!profile) {
      return errorResponse('User not found', 404)
    }

    return successResponse(profile, 'Profile retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const updateData = validation.data

    // Update user profile
    const [updatedProfile] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
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
        updatedAt: users.updatedAt
      })

    if (!updatedProfile) {
      return errorResponse('Failed to update profile', 500)
    }

    return successResponse(updatedProfile, 'Profile updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 