import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { syncOrderToShipStation, syncAllPendingOrders } from '@/lib/services/shipstation-sync'

// Sync a single order to ShipStation
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { orderId, syncAll } = body

    if (syncAll) {
      // Sync all pending orders
      const results = await syncAllPendingOrders()
      return NextResponse.json({
        message: `Synced ${results.filter(r => r.success).length} orders to ShipStation`,
        results,
      })
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    const result = await syncOrderToShipStation(orderId)

    return NextResponse.json({
      message: 'Order synced to ShipStation',
      shipStationOrderId: result.orderId,
    })
  } catch (error: any) {
    console.error('Failed to sync order to ShipStation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync order' },
      { status: 500 }
    )
  }
}
