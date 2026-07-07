import { prisma } from '@/lib/db/prisma'

export interface SalesReportParams {
  startDate?: Date
  endDate?: Date
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

export async function getSalesReport(params: SalesReportParams = {}) {
  const { startDate, endDate, groupBy = 'day' } = params

  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
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
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group orders by date
  const grouped: Record<string, any> = {}

  orders.forEach((order) => {
    const date = new Date(order.createdAt)
    let key: string

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'year':
        key = String(date.getFullYear())
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        orders: 0,
        revenue: 0,
        items: 0,
        averageOrderValue: 0,
      }
    }

    grouped[key].orders += 1
    grouped[key].revenue += order.total / 100 // Convert cents to dollars
    grouped[key].items += order.items.reduce((sum, item) => sum + item.quantity, 0)
  })

  // Calculate average order value
  Object.keys(grouped).forEach((key) => {
    grouped[key].averageOrderValue =
      grouped[key].orders > 0 ? grouped[key].revenue / grouped[key].orders : 0
  })

  const report = Object.values(grouped).sort((a: any, b: any) =>
    a.date.localeCompare(b.date)
  )

  // Calculate totals
  const totals = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total / 100, 0),
    totalItems: orders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    ),
    averageOrderValue:
      orders.length > 0
        ? orders.reduce((sum, order) => sum + order.total / 100, 0) / orders.length
        : 0,
  }

  return {
    report,
    totals,
  }
}

export async function getProductPerformanceReport(params?: {
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const { startDate, endDate, limit = 20 } = params || {}

  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
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
    },
  })

  // Aggregate product performance
  const productStats: Record<string, any> = {}

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productId = item.variant.product.id
      const productName = item.variant.product.name

      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          productName,
          quantitySold: 0,
          revenue: 0,
          orders: new Set(),
        }
      }

      productStats[productId].quantitySold += item.quantity
      productStats[productId].revenue += (item.price * item.quantity) / 100 // Convert cents to dollars
      productStats[productId].orders.add(order.id)
    })
  })

  // Convert to array and calculate order count
  const report = Object.values(productStats)
    .map((stat: any) => ({
      productId: stat.productId,
      productName: stat.productName,
      quantitySold: stat.quantitySold,
      revenue: stat.revenue,
      orderCount: stat.orders.size,
      averageOrderValue: stat.orders.size > 0 ? stat.revenue / stat.orders.size : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return report
}

export async function getCustomerAnalyticsReport(params?: {
  startDate?: Date
  endDate?: Date
}) {
  const { startDate, endDate } = params || {}

  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: {
        include: {
          user: true,
        },
      },
    },
  })

  // Aggregate customer statistics
  const customerStats: Record<string, any> = {}

  orders.forEach((order) => {
    if (!order.customerId) return

    const customerId = order.customerId

    if (!customerStats[customerId]) {
      customerStats[customerId] = {
        customerId,
        customerName: order.customer?.user?.name || order.email,
        customerEmail: order.email,
        orderCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        firstOrderDate: order.createdAt,
        lastOrderDate: order.createdAt,
      }
    }

    customerStats[customerId].orderCount += 1
    customerStats[customerId].totalSpent += order.total / 100 // Convert cents to dollars
    customerStats[customerId].lastOrderDate = order.createdAt
    if (order.createdAt < customerStats[customerId].firstOrderDate) {
      customerStats[customerId].firstOrderDate = order.createdAt
    }
  })

  // Calculate average order value
  Object.keys(customerStats).forEach((customerId) => {
    const stat = customerStats[customerId]
    stat.averageOrderValue = stat.orderCount > 0 ? stat.totalSpent / stat.orderCount : 0
  })

  const report = Object.values(customerStats)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
    .slice(0, 100) // Top 100 customers

  // Calculate summary statistics
  const summary = {
    totalCustomers: Object.keys(customerStats).length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total / 100, 0),
    averageCustomerLifetimeValue:
      Object.keys(customerStats).length > 0
        ? Object.values(customerStats).reduce((sum: number, stat: any) => sum + stat.totalSpent, 0) /
          Object.keys(customerStats).length
        : 0,
    averageOrdersPerCustomer:
      Object.keys(customerStats).length > 0
        ? orders.length / Object.keys(customerStats).length
        : 0,
  }

  return {
    report,
    summary,
  }
}

export async function getInventoryReport() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: true,
    },
  })

  const report = variants.map((variant) => ({
    variantId: variant.id,
    productName: variant.product.name,
    variantName: variant.name || 'Default',
    sku: variant.sku,
    currentStock: variant.inventoryQuantity,
    lowStockThreshold: variant.lowStockThreshold,
    status:
      variant.inventoryQuantity === 0
        ? 'out_of_stock'
        : variant.inventoryQuantity <= variant.lowStockThreshold
        ? 'low_stock'
        : 'in_stock',
    price: variant.price / 100, // Convert cents to dollars
    cost: variant.cost ? variant.cost / 100 : null,
    totalValue: (variant.inventoryQuantity * (variant.cost || variant.price)) / 100,
  }))

  const summary = {
    totalVariants: variants.length,
    outOfStock: variants.filter((v) => v.inventoryQuantity === 0).length,
    lowStock: variants.filter(
      (v) => v.inventoryQuantity > 0 && v.inventoryQuantity <= v.lowStockThreshold
    ).length,
    inStock: variants.filter((v) => v.inventoryQuantity > v.lowStockThreshold).length,
    totalInventoryValue: report.reduce((sum, item) => sum + item.totalValue, 0),
  }

  return {
    report,
    summary,
  }
}



