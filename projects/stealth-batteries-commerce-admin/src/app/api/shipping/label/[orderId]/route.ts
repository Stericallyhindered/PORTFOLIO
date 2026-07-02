import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface PackageTrackingNumber {
  number: string
  label?: string
  label_url?: string
  id?: string | null
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract orderId from URL
    const url = new URL(req.url)
    const pathname = url.pathname
    const segments = pathname.split('/')
    const orderId = segments[segments.length - 1]

    console.log('Fetching shipping label for order:', {
      orderId,
      pathname,
      segments,
    })

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config })

    // Get the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
    })

    if (!order) {
      console.log('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('Found order:', {
      id: order.id,
      hasPackageTrackingNumbers: Boolean(order.packageTrackingNumbers),
      packageTrackingNumbersCount: order.packageTrackingNumbers?.length,
      packageTrackingNumbers: order.packageTrackingNumbers,
    })

    // Get the first package tracking number with a label
    const labelPackage = (order.packageTrackingNumbers as PackageTrackingNumber[])?.find(
      (pkg) => pkg.label,
    )

    if (!labelPackage) {
      console.log('No label package found in order:', {
        orderId,
        packageTrackingNumbers: order.packageTrackingNumbers,
      })
      return NextResponse.json({ error: 'No shipping label found for this order' }, { status: 404 })
    }

    console.log('Found label package:', {
      number: labelPackage.number,
      hasLabel: Boolean(labelPackage.label),
      labelStartsWithData: labelPackage.label?.startsWith('data:'),
      labelStartsWithHttp: labelPackage.label?.startsWith('http'),
    })

    let buffer: Buffer

    // If we have a label, determine if it's base64 data or a URL
    if (labelPackage.label) {
      if (labelPackage.label.startsWith('data:') || !labelPackage.label.startsWith('http')) {
        // If it's a data URL or base64 data, extract the base64 part
        const base64Data = labelPackage.label.startsWith('data:')
          ? labelPackage.label.split(',')[1]
          : labelPackage.label
        buffer = Buffer.from(base64Data, 'base64')
      } else {
        // If it's a URL, fetch it
        console.log('Fetching label from URL:', labelPackage.label)
        const response = await fetch(labelPackage.label)
        if (!response.ok) {
          throw new Error(`Failed to fetch label from URL: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      }
    } else {
      return NextResponse.json({ error: 'Label data not found' }, { status: 404 })
    }

    // Return the label as a GIF image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Disposition': `inline; filename="shipping-label-${orderId}.gif"`,
      },
    })
  } catch (error) {
    console.error('Error serving shipping label:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve shipping label' },
      { status: 500 },
    )
  }
}
