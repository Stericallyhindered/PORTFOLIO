import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const client = getShipStationClient()
    const rates = await client.getRates(body)
    return NextResponse.json({ rates })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get rates' },
      { status: 500 }
    )
  }
}





