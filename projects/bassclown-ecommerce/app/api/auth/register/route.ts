import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { hashPassword, validateEmail, validatePassword, generateEmailVerificationToken } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { resend } from '@/lib/services-init'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { name, email, password } = validation.data

    // Additional email validation
    if (!validateEmail(email)) {
      return validationErrorResponse({ email: ['Invalid email format'] })
    }

    // Additional password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return validationErrorResponse({ password: [passwordValidation.message!] })
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return errorResponse('A user with this email already exists', 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate email verification token
    const emailVerificationToken = await generateEmailVerificationToken()

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        emailVerificationToken,
        emailVerified: false,
        role: 'member'
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified
      })

    // Send verification email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Bass Clown Co <noreply@bassclown.com>',
          to: email,
          subject: 'Welcome to Bass Clown Co - Please verify your email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to Bass Clown Co!</h2>
              <p>Thanks for signing up! Please click the link below to verify your email address:</p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/verify-email/${emailVerificationToken}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Verify Email Address
              </a>
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>Best regards,<br>The Bass Clown Co Team</p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Error sending verification email:', emailError)
        // Don't fail registration if email sending fails
      }
    }

    return successResponse(
      {
        user: newUser,
        message: 'Registration successful! Please check your email to verify your account.'
      },
      'User registered successfully'
    )

  } catch (error) {
    return handleApiError(error)
  }
} 