import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { db, users, pointsTransactions, paymentHistory } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { constructWebhookEvent } from '@/lib/stripe'
import { successResponse, errorResponse } from '@/lib/api-response'
import { emailService } from '@/lib/email-service'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return errorResponse('No signature provided', 400)
    }

    // Verify webhook signature
    let event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return errorResponse('Invalid signature', 400)
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return successResponse({ received: true }, 'Webhook processed successfully')

  } catch (error) {
    console.error('Webhook error:', error)
    return errorResponse('Webhook processing failed', 500)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const { id: paymentIntentId, metadata, amount, currency, customer } = paymentIntent
    const { userId, pointsAmount, packageDescription } = metadata

    if (!userId || !pointsAmount) {
      console.error('Missing metadata in payment intent:', paymentIntentId)
      return
    }

    const pointsAmountNumber = parseInt(pointsAmount, 10)

    // Get current user points
    const [currentUser] = await db
      .select({ pointsBalance: users.pointsBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!currentUser) {
      console.error('User not found for payment intent:', paymentIntentId, 'userId:', userId)
      return
    }

    // Update user's points balance
    const newBalance = (currentUser.pointsBalance || 0) + pointsAmountNumber
    await db
      .update(users)
      .set({
        pointsBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    // Create points transaction record
    await db
      .insert(pointsTransactions)
      .values({
        userId,
        type: 'purchased',
        amount: pointsAmountNumber,
        description: `Purchased ${pointsAmountNumber} points - ${packageDescription}`,
        stripePaymentIntentId: paymentIntentId
      })

    // Create payment history record
    await db
      .insert(paymentHistory)
      .values({
        userId,
        stripePaymentIntentId: paymentIntentId,
        amount: (amount / 100).toString(), // Convert from cents
        currency,
        status: 'succeeded',
        description: `Points purchase: ${pointsAmountNumber} points`,
        metadata: {
          pointsAmount: pointsAmountNumber,
          packageDescription
        }
      })

    console.log(`Successfully processed points purchase for user ${userId}: ${pointsAmountNumber} points`)

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    const { id: paymentIntentId, metadata, amount, currency } = paymentIntent
    const { userId, pointsAmount, packageDescription } = metadata

    if (!userId) {
      console.error('Missing userId in payment intent metadata:', paymentIntentId)
      return
    }

    // Create payment history record for failed payment
    await db
      .insert(paymentHistory)
      .values({
        userId,
        stripePaymentIntentId: paymentIntentId,
        amount: (amount / 100).toString(),
        currency,
        status: 'failed',
        description: `Failed points purchase: ${pointsAmount} points`,
        metadata: {
          pointsAmount: parseInt(pointsAmount || '0', 10),
          packageDescription,
          failureReason: 'payment_intent_failed'
        }
      })

    console.log(`Payment failed for user ${userId}: ${paymentIntentId}`)

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const { id: subscriptionId, customer, status, current_period_start, current_period_end, items } = subscription
    
    // Get the price ID to determine subscription type
    const priceId = items.data[0]?.price?.id
    let subscriptionType = 'pro' // Default
    
    // Map price IDs to subscription types (you'll need to set these up in Stripe)
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      subscriptionType = 'pro'
    } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
      subscriptionType = 'premium'
    }

    // Find user by Stripe customer ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customer))
      .limit(1)

    if (!user) {
      console.error('User not found for customer:', customer)
      return
    }

    // Update user subscription
    await db
      .update(users)
      .set({
        subscription: subscriptionType,
        subscriptionStatus: status,
        subscriptionId,
        subscriptionPeriodStart: new Date(current_period_start * 1000),
        subscriptionPeriodEnd: new Date(current_period_end * 1000),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    console.log(`Subscription created for user ${user.id}: ${subscriptionType}`)

    // Send welcome email for active subscriptions
    if (status === 'active') {
      try {
        const monthlyPoints = subscriptionType === 'creator' ? 1000 : subscriptionType === 'brand' ? 5000 : 100
        await emailService.sendNotification(user.id, 'subscription_welcome', {
          planName: subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1),
          monthlyPoints,
          nextBilling: new Date(current_period_end * 1000)
        })
      } catch (emailError) {
        console.error('Error sending subscription welcome email:', emailError)
      }
    }

  } catch (error) {
    console.error('Error handling customer.subscription.created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const { id: subscriptionId, customer, status, current_period_start, current_period_end, items } = subscription
    
    // Get the price ID to determine subscription type
    const priceId = items.data[0]?.price?.id
    let subscriptionType = 'pro'
    
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      subscriptionType = 'pro'
    } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
      subscriptionType = 'premium'
    }

    // Find user by Stripe customer ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customer))
      .limit(1)

    if (!user) {
      console.error('User not found for customer:', customer)
      return
    }

    // Update user subscription
    await db
      .update(users)
      .set({
        subscription: subscriptionType,
        subscriptionStatus: status,
        subscriptionPeriodStart: new Date(current_period_start * 1000),
        subscriptionPeriodEnd: new Date(current_period_end * 1000),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    console.log(`Subscription updated for user ${user.id}: ${subscriptionType}, status: ${status}`)

  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const { customer } = subscription

    // Find user by Stripe customer ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customer))
      .limit(1)

    if (!user) {
      console.error('User not found for customer:', customer)
      return
    }

    // Reset user subscription to free
    await db
      .update(users)
      .set({
        subscription: 'free',
        subscriptionStatus: 'inactive',
        subscriptionId: null,
        subscriptionPeriodStart: null,
        subscriptionPeriodEnd: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    console.log(`Subscription cancelled for user ${user.id}`)

  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    const { customer, subscription, amount_paid, currency } = invoice

    // Find user by Stripe customer ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customer))
      .limit(1)

    if (!user) {
      console.error('User not found for customer:', customer)
      return
    }

    // Create payment history record
    await db
      .insert(paymentHistory)
      .values({
        userId: user.id,
        stripePaymentIntentId: invoice.id,
        amount: (amount_paid / 100).toString(),
        currency,
        status: 'succeeded',
        description: 'Subscription payment',
        metadata: {
          subscriptionId: subscription,
          invoiceId: invoice.id
        }
      })

    console.log(`Invoice payment succeeded for user ${user.id}: $${amount_paid / 100}`)

  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  try {
    const { customer, subscription, amount_due, currency } = invoice

    // Find user by Stripe customer ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customer))
      .limit(1)

    if (!user) {
      console.error('User not found for customer:', customer)
      return
    }

    // Create payment history record for failed payment
    await db
      .insert(paymentHistory)
      .values({
        userId: user.id,
        stripePaymentIntentId: invoice.id,
        amount: (amount_due / 100).toString(),
        currency,
        status: 'failed',
        description: 'Subscription payment failed',
        metadata: {
          subscriptionId: subscription,
          invoiceId: invoice.id,
          failureReason: 'invoice_payment_failed'
        }
      })

    console.log(`Invoice payment failed for user ${user.id}: $${amount_due / 100}`)

  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error)
  }
} 