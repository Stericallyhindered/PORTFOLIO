import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { orderId, holdUntilDate } = body

    if (!orderId || !holdUntilDate) {
      return NextResponse.json({ error: 'Order ID and hold until date required' }, { status: 400 })
    }

    const client = getShipStationClient()
    await client.holdUntil(parseInt(orderId), holdUntilDate)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to hold order' },
      { status: 500 }
    )
  }
}


