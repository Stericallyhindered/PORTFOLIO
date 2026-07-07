import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  getShipStationSalesReport,
  getShipStationShippingReport,
  getShipStationTaxReport,
  getShipStationProductPerformanceReport,
  getShipStationCustomerAcquisitionReport,
} from '@/lib/services/shipstation-reports'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const carrierCode = searchParams.get('carrierCode')
    const serviceCode = searchParams.get('serviceCode')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const params = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
      carrierCode: carrierCode || undefined,
      serviceCode: serviceCode || undefined,
    }

    switch (type) {
      case 'sales':
        const salesReport = await getShipStationSalesReport(params)
        return NextResponse.json(salesReport)
      case 'shipping':
        const shippingReport = await getShipStationShippingReport(params)
        return NextResponse.json(shippingReport)
      case 'tax':
        const taxReport = await getShipStationTaxReport(params)
        return NextResponse.json(taxReport)
      case 'product_performance':
        const productReport = await getShipStationProductPerformanceReport(params)
        return NextResponse.json({ report: productReport })
      case 'customer_acquisition':
        const customerReport = await getShipStationCustomerAcquisitionReport(params)
        return NextResponse.json({ report: customerReport })
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


