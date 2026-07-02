import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'
import { createShipment } from '@/lib/shipping/services/ups'
import { getStateCode } from '@/lib/shipping/utils'
import { ShippingLabelNotification } from '@/email/templates/ShippingLabelNotification'
import type { Order, Customer, Dealer } from '@/payload-types'

type OrderWithRelations = Order & {
  customer: Customer | null
  dealer: Dealer | null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.json()
    const payload = await getPayloadClient()

    // Get the order with customer and dealer info
    const order = (await payload.findByID({
      collection: 'orders',
      id: data.orderId,
      depth: 2, // Needed to get customer and dealer info
    })) as OrderWithRelations

    if (!order) {
      throw new Error('Order not found')
    }

    // Get the origin address based on whether it's a dropship order
    const originAddress =
      order.isDropship && order.dealer
        ? {
            name: order.dealer.companyName || 'Dealer',
            attention_name: order.dealer.contactName || 'Shipping Department',
            address: order.dealer.address?.line1 || '',
            city: order.dealer.address?.city || '',
            state: getStateCode(order.dealer.address?.state || ''),
            postalCode: order.dealer.address?.zip || '',
            country: 'US',
          }
        : {
            name: 'Stealth Batteries',
            attention_name: 'Shipping Department',
            address: process.env.SHIPPING_ORIGIN_ADDRESS || '',
            city: process.env.SHIPPING_ORIGIN_CITY || '',
            state: process.env.SHIPPING_ORIGIN_STATE || '',
            postalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE || '',
            country: 'US',
          }

    // Add UPS credentials and origin address to the request
    const request = {
      ...data,
      credentials: {
        environment: process.env.UPS_ENVIRONMENT || 'test',
        client_id: process.env.UPS_CLIENT_ID,
        client_secret: process.env.UPS_CLIENT_SECRET,
        account_number: process.env.UPS_ACCOUNT_NUMBER,
      },
      origin: originAddress,
      destination: {
        name: `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim(),
        address: order.shippingAddress.line1,
        address2: order.shippingAddress.line2 || undefined,
        city: order.shippingAddress.city,
        state: getStateCode(order.shippingAddress.state),
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country || 'US',
      },
    }

    // Validate required origin address fields
    const requiredFields = ['name', 'address', 'city', 'state', 'postalCode'] as const
    for (const field of requiredFields) {
      if (!request.origin[field]) {
        throw new Error(
          `Missing required shipping origin field: ${field} for ${order.isDropship ? 'dealer' : 'warehouse'} address`,
        )
      }
    }

    // Basic package validation
    if (!data.packages || !Array.isArray(data.packages)) {
      throw new Error('No packages provided in request')
    }

    // Update request with packages
    request.packages = data.packages

    const shipment = await createShipment(request)

    console.log('UPS Shipment created:', {
      trackingNumber: shipment.tracking_number,
      packageCount: shipment.packages.length,
      packages: shipment.packages.map((pkg) => ({
        trackingNumber: pkg.tracking_number,
        hasLabel: Boolean(pkg.label_url),
      })),
    })

    // Process the labels - they are already base64 encoded from the UPS API
    const packagesWithLabels = shipment.packages.map((pkg, index) => ({
      number: pkg.tracking_number,
      label_url: pkg.label_url, // Store URL in label_url field
      packageNumber: index + 1,
      totalPackages: shipment.packages.length,
    }))

    console.log('Storing packages with labels:', {
      orderId: data.orderId,
      packagesCount: packagesWithLabels.length,
      packages: packagesWithLabels.map((pkg) => ({
        number: pkg.number,
        hasLabelUrl: Boolean(pkg.label_url),
        packageNumber: pkg.packageNumber,
        totalPackages: pkg.totalPackages,
      })),
    })

    // Update order with tracking info and labels
    await payload.update({
      collection: 'orders',
      id: data.orderId,
      data: {
        status: 'completed',
        shippedAt: new Date().toISOString(),
        trackingNumber: shipment.tracking_number,
        packageTrackingNumbers: packagesWithLabels,
      },
    })

    // Send email notification
    try {
      // Determine recipient and name based on whether it's a dealer order
      const recipientEmail = order.dealer ? order.dealer.email : order.customer?.email
      const recipientName = order.dealer
        ? order.dealer.companyName
        : `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim()

      if (recipientEmail) {
        await payload.sendEmail({
          to: recipientEmail,
          from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
          subject: `Shipping Label Created for Order #${order.orderNumber}`,
          html: ShippingLabelNotification({
            order,
            trackingNumber: shipment.tracking_number,
            customerName: recipientName,
          }),
        })
      }
      console.log('Shipping label created and email sent successfully')
    } catch (emailError) {
      console.error('Failed to send shipping notification email:', emailError)
      // Don't throw the error - we don't want to fail the whole request if just the email fails
    }

    return NextResponse.json(shipment)
  } catch (error) {
    console.error('Error creating shipping label:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create shipping label' },
      { status: 500 },
    )
  }
}
