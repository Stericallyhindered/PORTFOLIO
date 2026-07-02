import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dealerId = searchParams.get('dealerId')

    const payload = await getPayload({ config })

    // Get all dealers
    const dealers = await payload.find({
      collection: 'dealers',
      limit: 100,
    })

    // Get all orders with dealer info
    const orders = await payload.find({
      collection: 'orders',
      depth: 1,
      limit: 100,
      sort: '-createdAt',
    })

    // Filter orders that have dealers
    const ordersWithDealers = orders.docs.filter((order) => order.dealer)

    // If specific dealer requested, show detailed info
    let specificDealerInfo: any = null
    if (dealerId) {
      const dealerIdNum = parseInt(dealerId, 10)

      // Find the dealer
      const dealer = dealers.docs.find((d) => d.id === dealerIdNum)

      // Find orders for this dealer
      const dealerOrders = orders.docs.filter((order) => {
        const orderDealerId = typeof order.dealer === 'object' ? order.dealer?.id : order.dealer
        return orderDealerId === dealerIdNum
      })

      specificDealerInfo = {
        dealerId: dealerIdNum,
        dealerExists: !!dealer,
        dealerInfo: dealer
          ? {
              id: dealer.id,
              companyName: dealer.companyName,
              email: dealer.email,
            }
          : null,
        ordersFound: dealerOrders.length,
        orderSample: dealerOrders.slice(0, 3).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          dealer: order.dealer,
          total: order.total,
        })),
      }
    }

    return NextResponse.json({
      summary: {
        totalDealers: dealers.totalDocs,
        totalOrders: orders.totalDocs,
        ordersWithDealers: ordersWithDealers.length,
      },
      dealers: dealers.docs.slice(0, 5).map((dealer) => ({
        id: dealer.id,
        companyName: dealer.companyName,
        email: dealer.email,
      })),
      ordersWithDealers: ordersWithDealers.slice(0, 5).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        dealer: order.dealer,
        dealerType: typeof order.dealer,
        dealerId: typeof order.dealer === 'object' ? order.dealer?.id : order.dealer,
        total: order.total,
      })),
      specificDealerInfo,
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
