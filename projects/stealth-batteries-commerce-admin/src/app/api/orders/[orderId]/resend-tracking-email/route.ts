import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ShippingLabelNotification } from '@/email/templates/ShippingLabelNotification'
import type { Dealer, Customer } from '@/payload-types'

function isDealer(obj: any): obj is Dealer {
  return obj && typeof obj === 'object' && 'email' in obj && 'companyName' in obj
}
function isCustomer(obj: any): obj is Customer {
  return obj && typeof obj === 'object' && 'email' in obj
}

export async function POST(req: NextRequest) {
  try {
    // Extract orderId from URL
    const url = new URL(req.url)
    const pathname = url.pathname
    const segments = pathname.split('/')
    const orderId = segments[segments.length - 2] // [orderId]/resend-tracking-email/route.ts

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Fetch the order with customer and dealer info
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 3,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!order.trackingNumber) {
      return NextResponse.json({ error: 'Order does not have a tracking number' }, { status: 400 })
    }

    // Determine recipient and name based on whether it's a dealer order
    let recipientEmail: string | undefined
    let recipientName: string | undefined
    if (isDealer(order.dealer)) {
      recipientEmail = order.dealer.email
      recipientName = order.dealer.companyName
    } else if (isCustomer(order.customer)) {
      recipientEmail = order.customer.email
      recipientName =
        `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim()
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email found' }, { status: 400 })
    }

    await payload.sendEmail({
      to: recipientEmail,
      from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
      subject: `Shipping Label Created for Order #${order.orderNumber}`,
      html: ShippingLabelNotification({
        order,
        trackingNumber: order.trackingNumber,
        customerName: recipientName || '',
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resending tracking email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend tracking email' },
      { status: 500 },
    )
  }
}
