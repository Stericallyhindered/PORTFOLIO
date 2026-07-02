import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract orderId from URL using a more reliable approach
    const url = new URL(req.url)
    const pathname = url.pathname
    const segments = pathname.split('/')
    const orderIdOrUuid = segments[segments.length - 1]

    if (!orderIdOrUuid || orderIdOrUuid === 'undefined' || orderIdOrUuid === 'null') {
      console.error('Invalid order ID received:', orderIdOrUuid)
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Decode the ID in case it was URL encoded
    const decodedId = decodeURIComponent(orderIdOrUuid)

    // Check if we're looking up by UUID
    const searchParams = new URL(req.url).searchParams
    const isUuidLookup = searchParams.get('uuidLookup') === 'true'

    // Initialize Payload
    const payload = await getPayload({ config })

    console.log('Order lookup:', {
      id: decodedId,
      isUuidLookup,
      method: isUuidLookup ? 'UUID' : 'Numeric ID',
    })

    let order

    if (isUuidLookup) {
      // Validate UUID format (basic check)
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        decodedId,
      )

      if (!isValidUuid) {
        console.error('Invalid UUID format:', decodedId)
        return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 })
      }

      // Find the order by UUID
      const orders = await payload.find({
        collection: 'orders',
        where: {
          uuid: {
            equals: decodedId,
          },
        },
        depth: 3,
        sort: '-createdAt',
      })

      if (!orders.docs || orders.docs.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      order = orders.docs[0]

      // Debug logging for product relationship
      if (order.items && order.items.length > 0) {
        // Try to fetch product directly to test access
        try {
          const productData = await payload.findByID({
            collection: 'products',
            id: order.items[0].product.id,
            depth: 1,
          })
        } catch (error) {
          console.error('DEBUG - Error fetching product directly:', error)
        }
      }
    } else {
      // Legacy: find by numeric ID
      const orderId = parseInt(decodedId, 10)
      if (isNaN(orderId)) {
        console.error('Invalid numeric ID format:', decodedId)
        return NextResponse.json(
          { error: 'Invalid order ID format - not a number' },
          { status: 400 },
        )
      }

      try {
        // Fetch order first
        order = await payload.findByID({
          collection: 'orders',
          id: orderId,
          depth: 3,
        })

        // Then fetch full product details for each item
        if (order?.items?.length > 0) {
          const productsWithDetails = await Promise.all(
            order.items.map(async (item) => {
              if (typeof item.product === 'object' && item.product?.id) {
                try {
                  const product = await payload.findByID({
                    collection: 'products',
                    id: item.product.id,
                    depth: 1,
                  })
                  return product
                } catch (error) {
                  console.error('Error fetching product:', {
                    itemId: item.id,
                    productId: item.product.id,
                    error: error.message,
                  })
                  return null
                }
              }
              console.log('Skipping product fetch - invalid product reference:', {
                itemId: item.id,
                product: item.product,
              })
              return null
            }),
          )

          // Update order items with full product details
          order.items = order.items.map((item, index) => {
            const updatedItem = {
              ...item,
              product: productsWithDetails[index] || item.product,
            }
            return updatedItem
          })
        }
      } catch (error) {
        console.error('Error finding order by ID:', error)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Return the complete order data
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Error fetching order details' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract orderId from URL
    const url = new URL(req.url)
    const pathname = url.pathname
    const segments = pathname.split('/')
    const orderId = segments[segments.length - 1]

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    let data
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await req.formData()
      // Convert FormData to object
      data = Object.fromEntries(formData.entries())

      // Convert numeric strings to numbers
      if (typeof data.dealerTotal === 'string') {
        data.dealerTotal = parseFloat(data.dealerTotal)
      }
    } else {
      // Handle JSON data
      const rawBody = await req.text()

      try {
        data = JSON.parse(rawBody)
      } catch (parseError) {
        console.error('Error parsing request body:', parseError)
        return NextResponse.json(
          {
            error: 'Invalid JSON in request body',
            details: parseError.message,
            rawBody,
          },
          { status: 400 },
        )
      }
    }

    // Initialize Payload
    const payload = await getPayload({ config })

    // Update the order
    try {
      const updatedOrder = await payload.update({
        collection: 'orders',
        id: orderId,
        data: data,
      })

      return NextResponse.json(updatedOrder)
    } catch (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        {
          error: 'Failed to update order',
          details: error.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error in PATCH handler:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
