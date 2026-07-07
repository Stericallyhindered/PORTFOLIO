import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, giveaways, giveawayEntries, users, paymentHistory } from '@/lib/db'
import { eq, count, and, max } from 'drizzle-orm'
import { requireAuth, checkActiveMembership } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
})

export const dynamic = 'force-dynamic';

const purchaseEntrySchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1) // Allow purchasing 1-10 additional entries at once
})

// POST - Purchase additional giveaway entries
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: giveawayId } = await params
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = purchaseEntrySchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { quantity } = validation.data

    // Check if user has active membership
    const membershipCheck = await checkActiveMembership(user.id)
    if (!membershipCheck.isActive) {
      return errorResponse(membershipCheck.message || 'Active membership required', 403)
    }

    // Check if giveaway exists
    const [giveaway] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, giveawayId))
      .limit(1)

    if (!giveaway) {
      return notFoundResponse('Giveaway not found')
    }

    // Check if giveaway is active and within entry period
    const now = new Date()
    if (giveaway.status !== 'active' || giveaway.startDate > now || giveaway.endDate <= now) {
      return errorResponse('Giveaway is not currently accepting entries', 400)
    }

    // Check if user has used their free entry
    const [freeEntry] = await db
      .select()
      .from(giveawayEntries)
      .where(and(
        eq(giveawayEntries.giveawayId, giveawayId),
        eq(giveawayEntries.userId, user.id),
        eq(giveawayEntries.entryType, 'free')
      ))
      .limit(1)

    if (!freeEntry) {
      return errorResponse('You must use your free entry first before purchasing additional entries', 400)
    }

    // Check if giveaway has reached max entries
    if (giveaway.maxEntries) {
      const [currentEntries] = await db
        .select({ count: count() })
        .from(giveawayEntries)
        .where(eq(giveawayEntries.giveawayId, giveawayId))

      if (currentEntries.count + quantity > giveaway.maxEntries) {
        return errorResponse(`Only ${giveaway.maxEntries - currentEntries.count} entries remaining`, 400)
      }
    }

    // Get entry price (default to $5.00 if not set)
    const entryPrice = giveaway.additionalEntryPrice ? parseFloat(giveaway.additionalEntryPrice.toString()) : 5.00
    const totalAmount = entryPrice * quantity

    // Get user's Stripe customer ID
    const [userData] = await db
      .select({
        stripeCustomerId: users.stripeCustomerId,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData) {
      return errorResponse('User not found', 404)
    }

    // Create Stripe Payment Intent
    let customerId = userData.stripeCustomerId

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId: user.id
        }
      })
      customerId = customer.id

      // Update user with customer ID
      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        userId: user.id,
        giveawayId,
        quantity: quantity.toString(),
        type: 'giveaway_entry_purchase'
      },
      description: `${quantity} additional entry/entries for giveaway: ${giveaway.title}`
    })

    // Get next entry numbers
    const [maxEntryNumber] = await db
      .select({ maxEntry: max(giveawayEntries.entryNumber) })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.giveawayId, giveawayId))

    let nextEntryNumber = (maxEntryNumber.maxEntry || 0) + 1

    // Create entry records (will be confirmed when payment succeeds via webhook)
    const entries = []
    for (let i = 0; i < quantity; i++) {
      const [entry] = await db
        .insert(giveawayEntries)
        .values({
          giveawayId,
          userId: user.id,
          entryNumber: nextEntryNumber + i,
          entryType: 'purchased',
          purchasePrice: entryPrice.toString(),
          stripePaymentIntentId: paymentIntent.id,
          status: 'pending' // Will be updated to 'entered' when payment confirms
        })
        .returning()

      entries.push(entry)
    }

    // Create payment history record
    await db
      .insert(paymentHistory)
      .values({
        userId: user.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: totalAmount.toString(),
        currency: 'usd',
        status: 'pending',
        description: `${quantity} additional entry/entries for giveaway: ${giveaway.title}`,
        metadata: {
          giveawayId,
          quantity,
          entryIds: entries.map(e => e.id)
        }
      })

    return successResponse({
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        currency: 'usd'
      },
      entries: entries.map(entry => ({
        id: entry.id,
        entryNumber: entry.entryNumber,
        status: entry.status
      })),
      quantity,
      totalAmount
    }, 'Payment intent created. Complete payment to confirm entries.')

  } catch (error) {
    return handleApiError(error)
  }
}
