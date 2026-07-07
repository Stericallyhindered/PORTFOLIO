import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

const updateRoleSchema = z.object({
  role: z.enum(['member', 'bass-clown-admin', 'brand', 'brand-admin', 'guest']),
})

export const dynamic = 'force-dynamic'

// PATCH - Update user role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    await requireAdmin(request)
    
    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const validation = updateRoleSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { role } = validation.data

    if (!db) {
      return errorResponse('Database connection unavailable', 500)
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!existingUser) {
      return errorResponse('User not found', 404)
    }

    // Prevent removing the last admin
    if (existingUser.role === 'bass-clown-admin' && role !== 'bass-clown-admin') {
      const [adminCount] = await db
        .select()
        .from(users)
        .where(eq(users.role, 'bass-clown-admin'))
        .limit(1)

      if (adminCount) {
        // Check if there are other admins
        const allAdmins = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'bass-clown-admin'))

        if (allAdmins.length === 1 && allAdmins[0].id === id) {
          return errorResponse('Cannot remove the last admin. Please create another admin first.', 400)
        }
      }
    }

    // Update user role
    const [updatedUser] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        updatedAt: users.updatedAt
      })

    if (!updatedUser) {
      return errorResponse('Failed to update user role', 500)
    }

    return successResponse(
      updatedUser,
      `User role updated to ${role} successfully`
    )

  } catch (error) {
    return handleApiError(error)
  }
}



