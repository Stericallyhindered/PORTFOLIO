import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      paymentStatus: 'PAID',
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [orders, revenue, orderCount, topProducts] = await Promise.all([
      prisma.order.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.order.count({ where }),
      prisma.orderItem.groupBy({
        by: ['variantId'],
        where: {
          order: where,
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: true,
          },
        })
        return {
          ...item,
          product: variant?.product,
          variant: variant,
        }
      })
    )

    // Calculate daily revenue
    const dailyRevenue = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + order.total
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      revenue: revenue._sum.total || 0,
      orderCount,
      topProducts: topProductsWithDetails,
      dailyRevenue,
      orders: orders.slice(0, 50), // Limit for performance
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}





