import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { hashPassword, validatePassword, generatePasswordResetToken } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { resend } from '@/lib/services-init'

export const dynamic = 'force-dynamic';

// Check if we're in build mode
const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export'

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// POST - Request password reset
export async function POST(request: NextRequest) {
  // Skip during build time
  if (isBuildTime) {
    return errorResponse('Build time - service disabled', 400)
  }
  
  try {
    const body = await request.json()
    
    // Check if this is a password reset request or actual reset
    if (body.token) {
      return handlePasswordReset(body)
    } else {
      return handlePasswordResetRequest(body)
    }
  } catch (error) {
    return handleApiError(error)
  }
}

async function handlePasswordResetRequest(body: any) {
  // Validate input
  const validation = requestResetSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors)
  }

  const { email } = validation.data

  // Check if database is available
  if (!db) {
    return errorResponse('Database not available', 500)
  }

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    // Don't reveal that the email doesn't exist
    return successResponse(
      { message: 'If an account with that email exists, you will receive a password reset link.' },
      'Password reset email sent'
    )
  }

  // Generate password reset token
  const resetToken = await generatePasswordResetToken()
  const resetExpires = new Date(Date.now() + 3600000) // 1 hour from now

  // Update user with reset token
  await db
    .update(users)
    .set({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))

  // Send password reset email
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: 'Bass Clown Co <noreply@bassclown.com>',
        to: email,
        subject: 'Reset your Bass Clown Co password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Reset Your Password</h2>
            <p>You requested to reset your password. Click the link below to create a new password:</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${resetToken}" 
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The Bass Clown Co Team</p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      return errorResponse('Failed to send password reset email', 500)
    }
  }

  return successResponse(
    { message: 'If an account with that email exists, you will receive a password reset link.' },
    'Password reset email sent'
  )
}

async function handlePasswordReset(body: any) {
  // Validate input
  const validation = resetPasswordSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors)
  }

  const { token, password } = validation.data

  // Additional password validation
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return validationErrorResponse({ password: [passwordValidation.message!] })
  }

  // Check if database is available
  if (!db) {
    return errorResponse('Database not available', 500)
  }

  // Find user with valid reset token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetPasswordToken, token))
    .limit(1)

  if (!user) {
    return errorResponse('Invalid or expired reset token', 404)
  }

  // Check if token has expired
  if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
    return errorResponse('Reset token has expired', 400)
  }

  // Hash new password
  const hashedPassword = await hashPassword(password)

  // Update user password and clear reset token
  const [updatedUser] = await db
    .update(users)
    .set({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    })

  return successResponse(
    {
      user: updatedUser,
      message: 'Password has been reset successfully! You can now log in with your new password.'
    },
    'Password reset successful'
  )
} 