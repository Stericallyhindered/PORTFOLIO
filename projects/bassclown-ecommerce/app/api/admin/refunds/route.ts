import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { createRefund, retrieveRefund, listRefunds } from '@/lib/stripe'
import { db, paymentHistory, users } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { emailService } from '@/lib/email-service'

export const dynamic = 'force-dynamic';

const createRefundSchema = z.object({
  paymentIntentId: z.string().optional(),
  chargeId: z.string().optional(),
  amount: z.number().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
  reasonDescription: z.string().optional(),
  userId: z.string().uuid().optional()
})

// GET - List refunds
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    
    const paymentIntentId = searchParams.get('paymentIntentId')
    const chargeId = searchParams.get('chargeId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Gracefully handle missing/invalid Stripe key
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('...')) {
      return successResponse({
        refunds: [],
        warning: 'Stripe is not configured. Add a valid STRIPE_SECRET_KEY to enable refund management.'
      }, 'Refunds retrieved successfully')
    }

    const refunds = await listRefunds({
      paymentIntentId: paymentIntentId || undefined,
      chargeId: chargeId || undefined,
      limit
    })

    return successResponse({
      refunds
    }, 'Refunds retrieved successfully')

  } catch (error) {
    // If Stripe auth fails, return empty list with a warning instead of 400
    if (error && typeof error === 'object' && 'type' in error && (error as any).type === 'StripeAuthenticationError') {
      return successResponse({
        refunds: [],
        warning: 'Stripe authentication failed. Check your STRIPE_SECRET_KEY.'
      }, 'Refunds retrieved successfully')
    }
    return handleApiError(error)
  }
}

// POST - Create refund
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = createRefundSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { paymentIntentId, chargeId, amount, reason, reasonDescription, userId } = validation.data

    if (!paymentIntentId && !chargeId) {
      return validationErrorResponse({
        paymentIntentId: ['Either paymentIntentId or chargeId is required'],
        chargeId: ['Either paymentIntentId or chargeId is required']
      })
    }

    // Create refund with Stripe
    const refund = await createRefund({
      paymentIntentId: paymentIntentId || undefined,
      chargeId: chargeId || undefined,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason: reason || 'requested_by_customer',
      metadata: {
        refundedBy: user.id,
        reasonDescription: reasonDescription || '',
        refundedAt: new Date().toISOString()
      }
    })

    // Update payment history
    if (paymentIntentId && db) {
      const [payment] = await db
        .select()
        .from(paymentHistory)
        .where(eq(paymentHistory.stripePaymentIntentId, paymentIntentId))
        .limit(1)

      if (payment) {
        await db
          .update(paymentHistory)
          .set({
            status: 'refunded',
            metadata: {
              ...(typeof payment.metadata === 'object' && payment.metadata ? payment.metadata : {}),
              refundId: refund.id,
              refundedAt: new Date().toISOString(),
              refundedBy: user.id,
              refundReason: reason || 'requested_by_customer',
              refundAmount: refund.amount / 100 // Convert from cents
            }
          })
          .where(eq(paymentHistory.id, payment.id))

        // Send notification to user if userId provided or found from payment
        const targetUserId = userId || payment.userId
        if (targetUserId) {
          try {
            await emailService.sendNotification(targetUserId, 'refund_processed', {
              refundId: refund.id,
              refundAmount: refund.amount / 100,
              currency: refund.currency,
              reason: reason || 'requested_by_customer'
            })
          } catch (emailError) {
            console.error('Failed to send refund notification:', emailError)
          }
        }
      }
    }

    return successResponse({
      refund
    }, 'Refund created successfully', 201)

  } catch (error) {
    return handleApiError(error)
  }
}

