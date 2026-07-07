import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { db, users } from './db'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-config'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export interface UserSession {
  id: string
  email: string
  name: string | null
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createJWT(payload: any): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function getCurrentUser(request: NextRequest): Promise<UserSession | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return null
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<UserSession> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireAdmin(request: NextRequest): Promise<UserSession> {
  const user = await requireAuth(request)
  
  if (user.role !== 'bass-clown-admin') {
    throw new Error('Admin access required')
  }

  return user
}

export async function requireBrand(request: NextRequest): Promise<UserSession> {
  const user = await requireAuth(request)
  
  if (user.role !== 'brand') {
    throw new Error('Brand access required')
  }

  return user
}

export async function generateEmailVerificationToken(): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return token
}

export async function generatePasswordResetToken(): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return token
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  
  return { isValid: true }
}

/**
 * Check if a user has an active paid membership subscription
 * Membership is required for giveaways and contests
 */
export async function checkActiveMembership(userId: string): Promise<{ isActive: boolean; message?: string }> {
  try {
    const [user] = await db
      .select({
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return { isActive: false, message: 'User not found' }
    }

    const now = new Date()
    const isActive = user.subscriptionStatus === 'active' && 
                    user.subscriptionPeriodEnd && 
                    user.subscriptionPeriodEnd > now &&
                    (user.subscription === 'pro' || user.subscription === 'premium')

    if (!isActive) {
      return { 
        isActive: false, 
        message: 'Active membership subscription ($9.99/month) is required to enter giveaways and contests. Please upgrade your account.' 
      }
    }

    return { isActive: true }
  } catch (error) {
    console.error('Error checking membership:', error)
    return { isActive: false, message: 'Error checking membership status' }
  }
} 