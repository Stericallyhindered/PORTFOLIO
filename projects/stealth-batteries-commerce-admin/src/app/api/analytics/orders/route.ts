import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Helper function to calculate order metrics
function calculateOrderMetrics(orders: any[]) {
  const productMap = new Map()
  let totalRevenue = 0
  let productRevenue = 0
  let totalDiscounts = 0
  let totalShipping = 0
  let processingOrders = 0
  let completedOrders = 0

  orders.forEach((order) => {
    // Calculate order totals
    const orderTotal = parseFloat(order.total) || 0

    // Handle shipping - use the direct shipping value from the order
    const shippingCost = parseFloat(order.shipping) || 0

    // Handle discounts - check all possible discount sources
    let totalDiscount = 0

    // Check dealer discounts
    if (order.discounts?.dealer) {
      const dealerDiscount = order.discounts.dealer
      if (dealerDiscount.amount) {
        totalDiscount += parseFloat(dealerDiscount.amount)
      } else if (dealerDiscount.percentage) {
        totalDiscount += orderTotal * (parseFloat(dealerDiscount.percentage) / 100)
      }
      // Add volume discount if applied
      if (dealerDiscount.volumeDiscountAmount) {
        totalDiscount += parseFloat(dealerDiscount.volumeDiscountAmount)
      }
    }

    // Check affiliate discounts
    if (order.discounts?.affiliate?.amount) {
      totalDiscount += parseFloat(order.discounts.affiliate.amount)
    }

    // Check discount code
    if (order.discounts?.discountCode?.amount) {
      totalDiscount += parseFloat(order.discounts.discountCode.amount)
    }

    totalRevenue += orderTotal
    totalShipping += shippingCost
    totalDiscounts += totalDiscount

    // Calculate product revenue and breakdown
    order.items?.forEach((item) => {
      if (!item) return

      const product = item.product
      if (product) {
        const productId = product.id
        const quantity = parseInt(item.quantity) || 0
        const price = parseFloat(item.price) || 0
        const itemRevenue = price * quantity

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)
          productMap.set(productId, {
            ...existing,
            quantity: existing.quantity + quantity,
            revenue: existing.revenue + itemRevenue,
          })
        } else {
          productMap.set(productId, {
            productId,
            name: product.name || product.title || 'Unknown Product',
            quantity,
            revenue: itemRevenue,
          })
        }

        productRevenue += itemRevenue
      }
    })

    // Count order statuses
    if (order.status === 'processing') processingOrders++
    if (order.status === 'completed') completedOrders++
  })

  // Sort products by revenue and add percentage of total revenue
  const sortedProducts = Array.from(productMap.values())
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .map((product) => ({
      ...product,
      percentageOfRevenue:
        productRevenue > 0 ? (((product.revenue || 0) / productRevenue) * 100).toFixed(2) : '0.00',
    }))

  return {
    totalOrders: orders.length,
    totalRevenue,
    productRevenue,
    totalDiscounts,
    totalShipping,
    processingOrders,
    completedOrders,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    productBreakdown: sortedProducts,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const comparisonStartDate = searchParams.get('comparisonStartDate')
    const comparisonEndDate = searchParams.get('comparisonEndDate')

    if (!startDate || !endDate || !comparisonStartDate || !comparisonEndDate) {
      return NextResponse.json({ error: 'All date parameters are required' }, { status: 400 })
    }

    // Adjust dates to 2025 since that's when our orders are dated
    const adjustDateTo2025 = (dateStr: string) => {
      const date = new Date(dateStr)
      date.setFullYear(2025)
      return date.toISOString()
    }

    const adjustedStartDate = adjustDateTo2025(startDate)
    const adjustedEndDate = adjustDateTo2025(endDate)
    const adjustedComparisonStartDate = adjustDateTo2025(comparisonStartDate)
    const adjustedComparisonEndDate = adjustDateTo2025(comparisonEndDate)

    const payload = await getPayload({ config })

    // Fetch current period orders
    const currentPeriodOrders = await payload.find({
      collection: 'orders',
      where: {
        createdAt: {
          greater_than_equal: adjustedStartDate,
          less_than_equal: adjustedEndDate,
        },
      },
      depth: 2,
      limit: 250,
      sort: '-createdAt',
    })

    // Fetch comparison period orders
    const comparisonPeriodOrders = await payload.find({
      collection: 'orders',
      where: {
        createdAt: {
          greater_than_equal: adjustedComparisonStartDate,
          less_than_equal: adjustedComparisonEndDate,
        },
      },
      depth: 2,
      limit: 250,
      sort: '-createdAt',
    })

    // Calculate metrics for both periods
    const currentMetrics = calculateOrderMetrics(currentPeriodOrders.docs)
    const comparisonMetrics = calculateOrderMetrics(comparisonPeriodOrders.docs)

    // Create a map of all unique products across both periods
    const allProducts = new Map()

    // Process current period products
    currentMetrics.productBreakdown.forEach((product) => {
      allProducts.set(product.productId, {
        productId: product.productId,
        name: product.name,
        current: {
          quantity: product.quantity,
          revenue: product.revenue,
          percentageOfRevenue: product.percentageOfRevenue,
        },
        comparison: {
          quantity: 0,
          revenue: 0,
          percentageOfRevenue: '0.00',
        },
      })
    })

    // Process comparison period products
    comparisonMetrics.productBreakdown.forEach((product) => {
      if (allProducts.has(product.productId)) {
        // Update existing product with comparison data
        const existingProduct = allProducts.get(product.productId)
        existingProduct.comparison = {
          quantity: product.quantity,
          revenue: product.revenue,
          percentageOfRevenue: product.percentageOfRevenue,
        }
      } else {
        // Add new product with only comparison data
        allProducts.set(product.productId, {
          productId: product.productId,
          name: product.name,
          current: {
            quantity: 0,
            revenue: 0,
            percentageOfRevenue: '0.00',
          },
          comparison: {
            quantity: product.quantity,
            revenue: product.revenue,
            percentageOfRevenue: product.percentageOfRevenue,
          },
        })
      }
    })

    // Convert map to array and calculate growth metrics
    const productComparison = Array.from(allProducts.values())
      .map((product) => {
        const currentRevenue = parseFloat(product.current.revenue) || 0
        const comparisonRevenue = parseFloat(product.comparison.revenue) || 0
        const currentQuantity = parseInt(product.current.quantity) || 0
        const comparisonQuantity = parseInt(product.comparison.quantity) || 0

        // Calculate percentage change safely
        let percentageChange = '0.00'
        if (comparisonRevenue > 0) {
          const change = ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100
          percentageChange = change.toFixed(2)
        } else if (currentRevenue > 0) {
          percentageChange = '100.00'
        }

        return {
          ...product,
          growth: {
            quantity: currentQuantity - comparisonQuantity,
            revenue: currentRevenue - comparisonRevenue,
            percentageChange,
          },
        }
      })
      .sort((a, b) => (parseFloat(b.current.revenue) || 0) - (parseFloat(a.current.revenue) || 0))

    return NextResponse.json({
      current: {
        ...currentMetrics,
        productBreakdown: productComparison,
      },
      comparison: {
        ...comparisonMetrics,
        productBreakdown: productComparison,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
  }
}
