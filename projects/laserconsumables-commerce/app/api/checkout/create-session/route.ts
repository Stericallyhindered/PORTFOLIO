import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getCart } from '@/lib/services/cart'
import { stripe } from '@/lib/stripe/client'
import { validateDiscountCode } from '@/lib/services/discounts'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()

    const { discountCode } = body

    // Get cart
    const cart = await getCart(user?.id)

    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Calculate totals
    let subtotal = cart.subtotal
    let discount = 0

    // Validate discount code if provided
    if (discountCode) {
      const productIds = cart.items.map((item) => item.variant.productId)
      const collectionIds = cart.items.flatMap((item) =>
        item.variant.product.collections?.map((c) => c.collectionId) || []
      )

      const validation = await validateDiscountCode(
        discountCode,
        subtotal,
        productIds,
        collectionIds
      )

      if (validation.valid && validation.discount) {
        discount = validation.discount
      }
    }

    const tax = Math.round(subtotal * 0.08) // 8% tax - should be configurable
    const shipping = 0 // Free shipping for now - should be calculated
    const total = subtotal - discount + tax + shipping

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.variant.product.name,
            images: item.variant.product.images?.map((img) => img.url) || [],
          },
          unit_amount: item.variant.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      customer_email: user?.email || body.email,
      metadata: {
        customerId: user?.id || '',
        discountCode: discountCode || '',
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}





