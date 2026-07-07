import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users, pointsTransactions, paymentHistory } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { createPaymentIntent, createCustomer, retrieveCustomer } from '@/lib/stripe'

const pointsPurchaseSchema = z.object({
  pointsAmount: z.number().min(100, 'Minimum purchase is 100 points').max(10000, 'Maximum purchase is 10,000 points'),
  paymentMethodId: z.string().min(1, 'Payment method is required').optional()
})

const createPaymentIntentSchema = z.object({
  pointsAmount: z.number().min(100, 'Minimum purchase is 100 points').max(10000, 'Maximum purchase is 10,000 points')
})

// Point packages with pricing
const POINT_PACKAGES = [
  { points: 100, price: 4.99, description: 'Starter Pack' },
  { points: 250, price: 9.99, description: 'Value Pack' },
  { points: 500, price: 19.99, description: 'Popular Pack' },
  { points: 1000, price: 34.99, description: 'Power Pack' },
  { points: 2500, price: 79.99, description: 'Premium Pack' },
  { points: 5000, price: 149.99, description: 'Ultimate Pack' }
]

export const dynamic = 'force-dynamic';

// GET - Get point packages and pricing
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get user's current points balance
    const [userData] = await db
      .select({ pointsBalance: users.pointsBalance })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    return successResponse({
      currentBalance: userData?.pointsBalance || 0,
      packages: POINT_PACKAGES,
      benefits: [
        'Enter exclusive giveaways',
        'Access premium contests',
        'Higher chances of winning',
        'Special member rewards'
      ]
    }, 'Point packages retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create payment intent for points purchase
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input for payment intent creation
    const validation = createPaymentIntentSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { pointsAmount } = validation.data

    // Find the appropriate package or calculate custom price
    let selectedPackage = POINT_PACKAGES.find(pkg => pkg.points === pointsAmount)
    
    if (!selectedPackage) {
      // Calculate custom pricing (5 cents per point)
      selectedPackage = {
        points: pointsAmount,
        price: pointsAmount * 0.05,
        description: 'Custom Package'
      }
    }

    try {
      // Get or create Stripe customer
      const [userData] = await db
        .select({ 
          stripeCustomerId: users.stripeCustomerId,
          email: users.email,
          name: users.name
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      if (!userData) {
        return errorResponse('User not found', 404)
      }

      let customerId = userData.stripeCustomerId

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await createCustomer({
          email: userData.email,
          name: userData.name || undefined,
          metadata: {
            userId: user.id,
            source: 'points_purchase'
          }
        })
        
        customerId = customer.id
        
        // Update user with Stripe customer ID
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id))
      }

      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount: Math.round(selectedPackage.price * 100), // Convert to cents
        currency: 'usd',
        customerId,
        description: `Points purchase: ${pointsAmount} points - ${selectedPackage.description}`,
        metadata: {
          userId: user.id,
          pointsAmount: pointsAmount.toString(),
          packageDescription: selectedPackage.description
        }
      })

      // Return payment intent for frontend to complete
      return successResponse({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: selectedPackage.price,
        pointsAmount,
        packageDescription: selectedPackage.description
      }, 'Payment intent created successfully')

    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return errorResponse('Failed to create payment intent. Please try again.', 500)
    }

  } catch (error) {
    return handleApiError(error)
  }
} 