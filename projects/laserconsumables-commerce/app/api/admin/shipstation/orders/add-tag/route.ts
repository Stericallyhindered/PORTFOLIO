import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { orderId, tagId } = body

    if (!orderId || !tagId) {
      return NextResponse.json({ error: 'Order ID and tag ID required' }, { status: 400 })
    }

    const client = getShipStationClient()
    await client.addTag(parseInt(orderId), parseInt(tagId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add tag' },
      { status: 500 }
    )
  }
}


