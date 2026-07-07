import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  getSalesReport,
  getProductPerformanceReport,
  getCustomerAnalyticsReport,
  getInventoryReport,
} from '@/lib/services/reports'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | 'year' | undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    const params = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      groupBy,
      limit,
    }

    switch (type) {
      case 'sales':
        const salesReport = await getSalesReport(params)
        return NextResponse.json(salesReport)
      case 'product_performance':
        const productReport = await getProductPerformanceReport(params)
        return NextResponse.json({ report: productReport })
      case 'customer_analytics':
        const customerReport = await getCustomerAnalyticsReport(params)
        return NextResponse.json(customerReport)
      case 'inventory':
        const inventoryReport = await getInventoryReport()
        return NextResponse.json(inventoryReport)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}


