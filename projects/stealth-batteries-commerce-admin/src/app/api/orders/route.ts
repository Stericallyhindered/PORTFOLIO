import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const dealerId = searchParams.get('dealerId')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const payload = await getPayload({ config })

    // Build the where query
    const where: any = {}

    // Add date filtering if dates are provided
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.greater_than_equal = startDate
      }
      if (endDate) {
        where.createdAt.less_than_equal = endDate
      }
    }

    // If orderId is provided, look up a specific order
    if (orderId) {
      where.stripePaymentIntentId = {
        equals: orderId,
      }

      const orders = await payload.find({
        collection: 'orders',
        where,
      })

      if (!orders.docs.length) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({
        orderNumber: orders.docs[0].orderNumber,
      })
    }

    // If dealerId is provided, get all orders for that dealer
    if (dealerId) {
      console.log('Debug - API dealerId filtering:', {
        dealerId,
        dealerIdType: typeof dealerId,
        dealerIdParsed: parseInt(dealerId, 10),
        isAllDealer: dealerId === 'all',
      })

      if (dealerId !== 'all') {
        where.dealer = {
          equals: parseInt(dealerId, 10),
        }
      }

      console.log('Debug - Where query for orders:', JSON.stringify(where, null, 2))

      // First, let's see all orders to understand the data structure
      const allOrders = await payload.find({
        collection: 'orders',
        depth: 1,
        limit: 10,
        sort: '-createdAt',
      })

      console.log('Debug - Sample of all orders:', {
        totalOrders: allOrders.totalDocs,
        sampleOrders: allOrders.docs.slice(0, 3).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          dealer: order.dealer,
          dealerType: typeof order.dealer,
          dealerId: typeof order.dealer === 'object' ? order.dealer?.id : order.dealer,
        })),
      })

      const orders = await payload.find({
        collection: 'orders',
        where,
        depth: 3,
        page,
        limit,
        sort: '-createdAt',
      })

      console.log('Debug - Orders found:', {
        totalDocs: orders.totalDocs,
        docsLength: orders.docs.length,
        firstOrderDealer: orders.docs[0]?.dealer,
        firstOrderDealerId:
          typeof orders.docs[0]?.dealer === 'object'
            ? orders.docs[0]?.dealer?.id
            : orders.docs[0]?.dealer,
      })

      return NextResponse.json(orders)
    }

    // If customerId is provided, get all orders for that customer
    if (customerId) {
      // First, try to find the customer to validate the ID
      try {
        const customer = await payload.findByID({
          collection: 'customers',
          id: customerId,
        })

        if (!customer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Add customer filter to where query
        where.customer = {
          equals: customerId,
        }

        // Now fetch the orders for this customer
        const orders = await payload.find({
          collection: 'orders',
          where,
          depth: 2,
          page,
          limit,
          sort: '-createdAt',
        })

        return NextResponse.json(orders)
      } catch (error) {
        console.error('Error finding customer or their orders:', error)
        return NextResponse.json({ error: 'Error fetching customer orders' }, { status: 500 })
      }
    }

    // If no parameters are provided
    return NextResponse.json(
      { error: 'Order ID, Dealer ID, or Customer ID is required' },
      { status: 400 },
    )
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
