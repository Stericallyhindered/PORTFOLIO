import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import payload from 'payload'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
} as unknown as Stripe.StripeConfig)

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = headers()
  const signature = (await headersList).get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature || '',
      process.env.STRIPE_WEBHOOK_SECRET || '',
    )
  } catch (err) {
    const error = err as Error
    console.error(`Webhook signature verification failed: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Update order status to processing
      try {
        const orders = await payload.find({
          collection: 'orders',
          where: {
            stripePaymentIntentId: {
              equals: paymentIntent.id,
            },
          },
        })

        if (orders.docs.length > 0) {
          await payload.update({
            collection: 'orders',
            id: orders.docs[0].id,
            data: {
              status: 'processing',
            },
          })

          // Send confirmation email here if needed
        }
      } catch (error) {
        console.error('Error updating order:', error)
      }
      break

    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent

      // Update order status to cancelled
      try {
        const orders = await payload.find({
          collection: 'orders',
          where: {
            stripePaymentIntentId: {
              equals: failedPaymentIntent.id,
            },
          },
        })

        if (orders.docs.length > 0) {
          await payload.update({
            collection: 'orders',
            id: orders.docs[0].id,
            data: {
              status: 'cancelled',
            },
          })
        }
      } catch (error) {
        console.error('Error updating order:', error)
      }
      break

    case 'customer.created':
    case 'customer.updated':
      // These events are handled automatically by the Stripe plugin
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
