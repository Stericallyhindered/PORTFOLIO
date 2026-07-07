import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'
import { createOrder } from '@/lib/services/orders'
import { getCart, clearCart } from '@/lib/services/cart'
import { applyDiscountCode, validateDiscountCode } from '@/lib/services/discounts'
import { sendTemplateEmail } from '@/lib/email/client'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      // Get cart items
      const customerId = session.metadata?.customerId
      const cart = await getCart(customerId)

      if (cart.items.length === 0) {
        console.error('Cart is empty for completed checkout session')
        return NextResponse.json({ received: true })
      }

      // Calculate totals
      let subtotal = cart.subtotal
      let discount = 0
      const discountCode = session.metadata?.discountCode

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

      const tax = Math.round(subtotal * 0.08)
      const shipping = 0
      const total = subtotal - discount + tax + shipping

      // Create order
      const order = await createOrder({
        email: session.customer_email || session.customer_details?.email || '',
        phone: session.customer_details?.phone || undefined,
        customerId: customerId || undefined,
        shippingAddress: {
          firstName: session.shipping_details?.name?.split(' ')[0] || '',
          lastName: session.shipping_details?.name?.split(' ').slice(1).join(' ') || '',
          address1: session.shipping_details?.address?.line1 || '',
          address2: session.shipping_details?.address?.line2 || '',
          city: session.shipping_details?.address?.city || '',
          state: session.shipping_details?.address?.state || '',
          zip: session.shipping_details?.address?.postal_code || '',
          country: session.shipping_details?.address?.country || 'US',
        },
        billingAddress: {
          firstName: session.customer_details?.name?.split(' ')[0] || '',
          lastName: session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
          address1: session.customer_details?.address?.line1 || '',
          address2: session.customer_details?.address?.line2 || '',
          city: session.customer_details?.address?.city || '',
          state: session.customer_details?.address?.state || '',
          zip: session.customer_details?.address?.postal_code || '',
          country: session.customer_details?.address?.country || 'US',
        },
        items: cart.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        discountCodeId: undefined, // Will be set after order creation
        subtotal: subtotal / 100,
        tax: tax / 100,
        shipping: shipping / 100,
        discount: discount / 100,
        total: total / 100,
      })

      // Apply discount code if provided
      if (discountCode) {
        await applyDiscountCode(discountCode, order.id)
      }

      // Update order with Stripe session ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          paymentStatus: 'PAID',
        },
      })

      // Clear cart
      await clearCart(customerId)

      // Send order confirmation email
      try {
        await sendTemplateEmail('order_confirmation', order.email, {
          orderNumber: order.orderNumber,
          customerName: order.shippingAddress?.firstName || 'Customer',
          orderTotal: `$${(order.total / 100).toFixed(2)}`,
          orderItems: order.items
            .map((item) => `${item.variant.product.name} x${item.quantity}`)
            .join(', '),
        })
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
      }

      // Sync order to ShipStation
      try {
        const { syncOrderToShipStation } = await import('@/lib/services/shipstation-sync')
        await syncOrderToShipStation(order.id)
        console.log(`Order ${order.orderNumber} synced to ShipStation`)
      } catch (syncError) {
        console.error('ShipStation sync failed:', syncError)
      }

      // Auto-create shipping label if enabled
      try {
        const { createLabelAutomatically } = await import('@/lib/services/shipping')
        await createLabelAutomatically(order.id)
      } catch (labelError) {
        console.error('Auto-label creation failed:', labelError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

