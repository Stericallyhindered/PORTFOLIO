import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { createSubscription, createCustomer, listPrices } from '@/lib/stripe'

const createSubscriptionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required')
})

export const dynamic = 'force-dynamic';

// GET - Get available subscription plans
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get available prices from Stripe
    const prices = await listPrices()
    
    // Filter for subscription prices only
    const subscriptionPrices = prices.filter(price => price.recurring)

    // Map to our subscription plans
    const plans = subscriptionPrices.map(price => ({
      id: price.id,
      productId: price.product,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      nickname: price.nickname,
      active: price.active
    }))

    // Get user's current subscription info
    const [userData] = await db
      .select({
        subscription: users.subscription,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionId: users.subscriptionId,
        subscriptionPeriodEnd: users.subscriptionPeriodEnd
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    return successResponse({
      plans,
      currentSubscription: userData || {
        subscription: 'free',
        subscriptionStatus: 'inactive',
        subscriptionId: null,
        subscriptionPeriodEnd: null
      }
    }, 'Subscription plans retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = createSubscriptionSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { priceId, paymentMethodId } = validation.data

    // Get user data
    const [userData] = await db
      .select({
        stripeCustomerId: users.stripeCustomerId,
        email: users.email,
        name: users.name,
        subscriptionId: users.subscriptionId
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData) {
      return errorResponse('User not found', 404)
    }

    // Check if user already has an active subscription
    if (userData.subscriptionId) {
      return errorResponse('User already has an active subscription', 400)
    }

    let customerId = userData.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createCustomer({
        email: userData.email,
        name: userData.name || undefined,
        metadata: {
          userId: user.id,
          source: 'subscription'
        }
      })
      
      customerId = customer.id
      
      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id))
    }

    try {
      // Create subscription
      const subscription = await createSubscription({
        customerId,
        priceId,
        metadata: {
          userId: user.id
        }
      })

      // The subscription will be updated via webhook when payment is confirmed
      const latestInvoice = subscription.latest_invoice as any
      const clientSecret = latestInvoice?.payment_intent?.client_secret
      
      return successResponse({
        subscriptionId: subscription.id,
        clientSecret,
        status: subscription.status
      }, 'Subscription created successfully')

    } catch (stripeError) {
      console.error('Stripe subscription creation error:', stripeError)
      return errorResponse('Failed to create subscription. Please try again.', 500)
    }

  } catch (error) {
    return handleApiError(error)
  }
} 