import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    
    const orderStatus = searchParams.get('orderStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const orderDateStart = searchParams.get('orderDateStart')
    const orderDateEnd = searchParams.get('orderDateEnd')
    const customerName = searchParams.get('customerName')

    try {
      const client = getShipStationClient()
      const shipStationOrders = await client.listOrders({
        orderStatus: orderStatus || undefined,
        page,
        pageSize,
        orderDateStart: orderDateStart || undefined,
        orderDateEnd: orderDateEnd || undefined,
        customerName: customerName || undefined,
      })

      return NextResponse.json(shipStationOrders)
    } catch (error: any) {
      // Fallback to our database if ShipStation API fails
      const where: any = {
        status: {
          not: 'CANCELLED',
        },
      }

      if (orderDateStart || orderDateEnd) {
        where.createdAt = {}
        if (orderDateStart) where.createdAt.gte = new Date(orderDateStart)
        if (orderDateEnd) where.createdAt.lte = new Date(orderDateEnd)
      }

      if (customerName) {
        where.OR = [
          { email: { contains: customerName, mode: 'insensitive' } },
          { customer: { user: { name: { contains: customerName, mode: 'insensitive' } } } },
        ]
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          shippingAddress: true,
          customer: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })

      return NextResponse.json({
        orders: orders.map((order) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          orderStatus: order.status,
          customerName: order.customer?.user?.name || order.email,
          email: order.email,
          orderTotal: order.total / 100,
          total: order.total / 100,
        })),
        page,
        pageSize,
        total: await prisma.order.count({ where }),
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

