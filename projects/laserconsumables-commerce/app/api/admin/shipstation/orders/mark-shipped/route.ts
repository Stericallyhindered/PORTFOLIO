import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { orderId, carrierCode, shipDate, trackingNumber, notifyCustomer, notifySalesChannel } = body

    if (!orderId || !carrierCode) {
      return NextResponse.json({ error: 'Order ID and carrier code required' }, { status: 400 })
    }

    const client = getShipStationClient()
    await client.markAsShipped({
      orderId: parseInt(orderId),
      carrierCode,
      shipDate,
      trackingNumber,
      notifyCustomer,
      notifySalesChannel,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to mark order as shipped' },
      { status: 500 }
    )
  }
}


