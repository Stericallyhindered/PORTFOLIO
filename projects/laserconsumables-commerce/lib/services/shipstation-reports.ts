import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'

export async function getShipStationSalesReport(params?: {
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}) {
  const client = getShipStationClient()

  const startDateStr = params?.startDate?.toISOString().split('T')[0]
  const endDateStr = params?.endDate?.toISOString().split('T')[0]

  try {
    // Get orders from ShipStation
    const shipStationOrders = await client.listOrders({
      orderDateStart: startDateStr,
      orderDateEnd: endDateStr,
      page: params?.page,
      pageSize: params?.pageSize || 50,
    })

    // Match with our orders by order number or ShipStation order ID
    const orderNumbers = shipStationOrders.orders?.map((order: any) => order.orderNumber) || []
    const ourOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          in: orderNumbers,
        },
      },
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
        shipments: true,
      },
    })

    // Combine data
    const report = shipStationOrders.orders?.map((ssOrder: any) => {
      const ourOrder = ourOrders.find((o) => o.orderNumber === ssOrder.orderNumber)

      return {
        orderNumber: ssOrder.orderNumber,
        orderDate: ssOrder.orderDate,
        orderStatus: ssOrder.orderStatus,
        paymentStatus: ourOrder?.paymentStatus,
        customerName: ssOrder.customerName || ourOrder?.email,
        total: ssOrder.orderTotal || (ourOrder?.total ? ourOrder.total / 100 : 0),
        shippingCost: ssOrder.shippingAmount || (ourOrder?.shipping ? ourOrder.shipping / 100 : 0),
        taxAmount: ssOrder.taxAmount || (ourOrder?.tax ? ourOrder.tax / 100 : 0),
        items: ourOrder?.items || [],
        shipments: ourOrder?.shipments || [],
        shipStationData: ssOrder,
      }
    }) || []

    return {
      report,
      pagination: {
        page: shipStationOrders.page || 1,
        pageSize: shipStationOrders.pageSize || 50,
        totalPages: shipStationOrders.totalPages || 1,
        total: shipStationOrders.total || report.length,
      },
    }
  } catch (error: any) {
    // Fallback to our database if ShipStation API fails
    return getFallbackSalesReport(params)
  }
}

async function getFallbackSalesReport(params?: {
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
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
      shipments: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    report: orders.map((order) => ({
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.email,
      total: order.total / 100,
      shippingCost: order.shipping / 100,
      taxAmount: order.tax / 100,
      items: order.items,
      shipments: order.shipments,
    })),
    pagination: {
      page: 1,
      pageSize: orders.length,
      totalPages: 1,
      total: orders.length,
    },
  }
}

export async function getShipStationShippingReport(params?: {
  startDate?: Date
  endDate?: Date
  carrierCode?: string
  serviceCode?: string
}) {
  const client = getShipStationClient()

  const startDateStr = params?.startDate?.toISOString().split('T')[0]
  const endDateStr = params?.endDate?.toISOString().split('T')[0]

  try {
    // Get shipments from ShipStation
    const shipments = await client.listShipments({
      page: 1,
      pageSize: 500, // ShipStation max
    })

    // Filter by date range if provided
    let filteredShipments = shipments.shipments || []
    if (startDateStr || endDateStr) {
      filteredShipments = filteredShipments.filter((shipment: any) => {
        const shipDate = shipment.shipDate
        if (startDateStr && shipDate < startDateStr) return false
        if (endDateStr && shipDate > endDateStr) return false
        return true
      })
    }

    // Filter by carrier/service if provided
    if (params?.carrierCode) {
      filteredShipments = filteredShipments.filter(
        (s: any) => s.carrierCode === params.carrierCode
      )
    }
    if (params?.serviceCode) {
      filteredShipments = filteredShipments.filter(
        (s: any) => s.serviceCode === params.serviceCode
      )
    }

    // Aggregate statistics
    const stats = {
      totalShipments: filteredShipments.length,
      totalCost: filteredShipments.reduce((sum: number, s: any) => sum + (s.shipmentCost || 0), 0),
      byCarrier: {} as Record<string, { count: number; cost: number }>,
      byService: {} as Record<string, { count: number; cost: number }>,
    }

    filteredShipments.forEach((shipment: any) => {
      const carrier = shipment.carrierCode || 'Unknown'
      const service = shipment.serviceCode || 'Unknown'
      const cost = shipment.shipmentCost || 0

      if (!stats.byCarrier[carrier]) {
        stats.byCarrier[carrier] = { count: 0, cost: 0 }
      }
      stats.byCarrier[carrier].count++
      stats.byCarrier[carrier].cost += cost

      if (!stats.byService[service]) {
        stats.byService[service] = { count: 0, cost: 0 }
      }
      stats.byService[service].count++
      stats.byService[service].cost += cost
    })

    return {
      shipments: filteredShipments,
      statistics: stats,
    }
  } catch (error: any) {
    // Fallback to our database
    return getFallbackShippingReport(params)
  }
}

async function getFallbackShippingReport(params?: {
  startDate?: Date
  endDate?: Date
  carrierCode?: string
  serviceCode?: string
}) {
  const where: any = {}
  if (params?.carrierCode) where.carrier = params.carrierCode
  if (params?.serviceCode) where.service = params.serviceCode

  const shipments = await prisma.shipment.findMany({
    where,
    include: {
      order: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const filteredShipments = shipments.filter((shipment) => {
    if (params?.startDate && shipment.createdAt < params.startDate) return false
    if (params?.endDate && shipment.createdAt > params.endDate) return false
    return true
  })

  const stats = {
    totalShipments: filteredShipments.length,
    totalCost: filteredShipments.reduce((sum, s) => sum + (s.cost || 0), 0),
    byCarrier: {} as Record<string, { count: number; cost: number }>,
    byService: {} as Record<string, { count: number; cost: number }>,
  }

  filteredShipments.forEach((shipment) => {
    const carrier = shipment.carrier || 'Unknown'
    const service = shipment.service || 'Unknown'
    const cost = shipment.cost || 0

    if (!stats.byCarrier[carrier]) {
      stats.byCarrier[carrier] = { count: 0, cost: 0 }
    }
    stats.byCarrier[carrier].count++
    stats.byCarrier[carrier].cost += cost

    if (!stats.byService[service]) {
      stats.byService[service] = { count: 0, cost: 0 }
    }
    stats.byService[service].count++
    stats.byService[service].cost += cost
  })

  return {
    shipments: filteredShipments,
    statistics: stats,
  }
}

export async function getShipStationTaxReport(params?: {
  startDate?: Date
  endDate?: Date
}) {
  // ShipStation doesn't have a direct tax report endpoint
  // We'll use our orders data combined with ShipStation order data
  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      shippingAddress: true,
      billingAddress: true,
    },
  })

  // Group by state/country
  const taxByState: Record<string, { orders: number; taxAmount: number }> = {}
  const taxByCountry: Record<string, { orders: number; taxAmount: number }> = {}

  orders.forEach((order) => {
    const state = order.shippingAddress?.state || order.billingAddress?.state || 'Unknown'
    const country = order.shippingAddress?.country || order.billingAddress?.country || 'Unknown'
    const taxAmount = order.tax / 100 // Convert cents to dollars

    if (!taxByState[state]) {
      taxByState[state] = { orders: 0, taxAmount: 0 }
    }
    taxByState[state].orders++
    taxByState[state].taxAmount += taxAmount

    if (!taxByCountry[country]) {
      taxByCountry[country] = { orders: 0, taxAmount: 0 }
    }
    taxByCountry[country].orders++
    taxByCountry[country].taxAmount += taxAmount
  })

  return {
    summary: {
      totalOrders: orders.length,
      totalTax: orders.reduce((sum, o) => sum + o.tax / 100, 0),
      averageTaxPerOrder:
        orders.length > 0
          ? orders.reduce((sum, o) => sum + o.tax / 100, 0) / orders.length
          : 0,
    },
    byState: taxByState,
    byCountry: taxByCountry,
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      state: order.shippingAddress?.state || order.billingAddress?.state,
      country: order.shippingAddress?.country || order.billingAddress?.country,
      taxAmount: order.tax / 100,
    })),
  }
}

export async function getShipStationProductPerformanceReport(params?: {
  startDate?: Date
  endDate?: Date
}) {
  // Combine ShipStation order data with our product data
  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
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
      shipments: true,
    },
  })

  // Aggregate by product
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
          shippingCost: 0,
        }
      }

      productStats[productId].quantitySold += item.quantity
      productStats[productId].revenue += (item.price * item.quantity) / 100
      productStats[productId].orders.add(order.id)

      // Allocate shipping cost proportionally
      if (order.shipments.length > 0) {
        const itemValue = (item.price * item.quantity) / 100
        const orderTotal = order.total / 100
        const shippingAllocation = (itemValue / orderTotal) * (order.shipping / 100)
        productStats[productId].shippingCost += shippingAllocation
      }
    })
  })

  return Object.values(productStats)
    .map((stat: any) => ({
      productId: stat.productId,
      productName: stat.productName,
      quantitySold: stat.quantitySold,
      revenue: stat.revenue,
      shippingCost: stat.shippingCost,
      orderCount: stat.orders.size,
      averageOrderValue: stat.orders.size > 0 ? stat.revenue / stat.orders.size : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getShipStationCustomerAcquisitionReport(params?: {
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {
    status: {
      not: 'CANCELLED',
    },
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
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
    orderBy: { createdAt: 'asc' },
  })

  // Group by acquisition date (first order date)
  const acquisitionData: Record<string, any> = {}

  orders.forEach((order) => {
    if (!order.customerId) return

    const customerId = order.customerId
    const firstOrder = orders.find((o) => o.customerId === customerId)
    const acquisitionDate = firstOrder?.createdAt.toISOString().split('T')[0] || ''

    if (!acquisitionData[acquisitionDate]) {
      acquisitionData[acquisitionDate] = {
        date: acquisitionDate,
        newCustomers: new Set(),
        totalRevenue: 0,
      }
    }

    acquisitionData[acquisitionDate].newCustomers.add(customerId)
    acquisitionData[acquisitionDate].totalRevenue += order.total / 100
  })

  return Object.values(acquisitionData).map((data: any) => ({
    date: data.date,
    newCustomers: data.newCustomers.size,
    totalRevenue: data.totalRevenue,
    averageRevenuePerCustomer:
      data.newCustomers.size > 0 ? data.totalRevenue / data.newCustomers.size : 0,
  }))
}



