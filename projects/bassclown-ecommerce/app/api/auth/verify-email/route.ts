import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const dynamic = 'force-dynamic';

// Check if we're in build mode
const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export';

export async function POST(request: NextRequest) {
  // Skip during build time
  if (isBuildTime) {
    return errorResponse('Build time - verification disabled', 400)
  }
  
  try {
    let body;
    try {
      body = await request.json()
    } catch (error) {
      return errorResponse('Invalid JSON in request body', 400)
    }
    
    // Check if body is valid
    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid request body', 400)
    }
    
    // Check if database is available
    if (!db) {
      return errorResponse('Database not available', 500)
    }
    
    // Validate input
    const validation = verifyEmailSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { token } = validation.data

    // Find user with this verification token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1)

    if (!user) {
      return errorResponse('Invalid or expired verification token', 404)
    }

    // Check if already verified
    if (user.emailVerified) {
      return errorResponse('Email is already verified', 400)
    }

    // Update user as verified
    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role
      })

    return successResponse(
      {
        user: updatedUser,
        message: 'Email verified successfully! You can now log in.'
      },
      'Email verification successful'
    )

  } catch (error) {
    return handleApiError(error)
  }
}

// GET method for direct link verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return errorResponse('Token is required', 400)
    }

    // Find user with this verification token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1)

    if (!user) {
      return errorResponse('Invalid or expired verification token', 404)
    }

    // Check if already verified
    if (user.emailVerified) {
      return errorResponse('Email is already verified', 400)
    }

    // Update user as verified
    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role
      })

    return successResponse(
      {
        user: updatedUser,
        message: 'Email verified successfully! You can now log in.'
      },
      'Email verification successful'
    )

  } catch (error) {
    return handleApiError(error)
  }
} 