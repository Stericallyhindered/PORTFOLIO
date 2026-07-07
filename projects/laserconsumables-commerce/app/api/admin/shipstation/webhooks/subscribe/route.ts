import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { target_url, event, store_id, friendly_name } = body

    if (!target_url || !event) {
      return NextResponse.json({ error: 'Target URL and event required' }, { status: 400 })
    }

    const client = getShipStationClient()
    const result = await client.subscribeWebhook({
      target_url,
      event,
      store_id,
      friendly_name,
    })

    return NextResponse.json({ success: true, webhookId: result.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe webhook' },
      { status: 500 }
    )
  }
}


