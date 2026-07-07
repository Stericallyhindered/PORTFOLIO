import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function GET() {
  try {
    await requireAdmin()
    const client = getShipStationClient()
    const result = await client.listWebhooks()
    return NextResponse.json({ webhooks: result.webhooks || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}


