import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

const updateSubscriptionSchema = z.object({
  subscription: z.enum(['free', 'pro', 'premium']).optional(),
  subscriptionStatus: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
  stripeCustomerId: z.string().optional(),
  subscriptionId: z.string().optional()
})

export const dynamic = 'force-dynamic';

// GET - Get user subscription info
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get user subscription details
    const [subscription] = await db
      .select({
        id: users.id,
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        stripeCustomerId: users.stripeCustomerId,
        subscriptionId: users.subscriptionId,
        subscriptionPeriodStart: users.subscriptionPeriodStart,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!subscription) {
      return errorResponse('User not found', 404)
    }

    // Calculate subscription info
    const now = new Date()
    const isActive = subscription.subscriptionStatus === 'active' && 
                    subscription.subscriptionPeriodEnd && 
                    subscription.subscriptionPeriodEnd > now

    const daysRemaining = subscription.subscriptionPeriodEnd
      ? Math.ceil((subscription.subscriptionPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const subscriptionInfo = {
      ...subscription,
      isActive,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      features: getSubscriptionFeatures(subscription.subscription || 'free')
    }

    return successResponse(subscriptionInfo, 'Subscription info retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update subscription (internal use, typically called by webhook)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = updateSubscriptionSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const updateData = validation.data

    // Update subscription
    const [updatedSubscription] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        stripeCustomerId: users.stripeCustomerId,
        subscriptionId: users.subscriptionId,
        subscriptionPeriodStart: users.subscriptionPeriodStart,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd,
        updatedAt: users.updatedAt
      })

    if (!updatedSubscription) {
      return errorResponse('Failed to update subscription', 500)
    }

    return successResponse(updatedSubscription, 'Subscription updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Update subscription status to cancelled
    const [cancelledSubscription] = await db
      .update(users)
      .set({
        subscriptionStatus: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd
      })

    if (!cancelledSubscription) {
      return errorResponse('Failed to cancel subscription', 500)
    }

    return successResponse(cancelledSubscription, 'Subscription cancelled successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

function getSubscriptionFeatures(subscription: string) {
  switch (subscription) {
    case 'free':
      return {
        contestParticipation: true,
        giveawayEntries: true,
        monthlyPoints: 100,
        supportLevel: 'community',
        features: ['Basic contest participation', 'Giveaway entries', '100 monthly points']
      }
    case 'pro':
      return {
        contestParticipation: true,
        giveawayEntries: true,
        monthlyPoints: 500,
        prioritySupport: true,
        earlyAccess: true,
        supportLevel: 'email',
        features: ['All free features', '500 monthly points', 'Priority support', 'Early access to contests']
      }
    case 'premium':
      return {
        contestParticipation: true,
        giveawayEntries: true,
        monthlyPoints: 1000,
        prioritySupport: true,
        earlyAccess: true,
        exclusiveContests: true,
        supportLevel: 'priority',
        features: ['All pro features', '1000 monthly points', 'Exclusive contests', 'Priority support']
      }
    default:
      return getSubscriptionFeatures('free')
  }
} 