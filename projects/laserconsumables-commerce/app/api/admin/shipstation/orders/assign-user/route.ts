import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { orderIds, userId } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !userId) {
      return NextResponse.json({ error: 'Order IDs array and user ID required' }, { status: 400 })
    }

    const client = getShipStationClient()
    await client.assignUser(orderIds.map((id: string | number) => parseInt(id.toString())), userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign user' },
      { status: 500 }
    )
  }
}


