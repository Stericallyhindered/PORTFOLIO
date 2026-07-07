import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { shipmentId } = body

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID required' }, { status: 400 })
    }

    try {
      const client = getShipStationClient()
      
      // Get shipment to find ShipStation ID
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
      })

      if (!shipment || !shipment.shipstationId) {
        return NextResponse.json(
          { error: 'Shipment not found or not synced with ShipStation' },
          { status: 404 }
        )
      }

      // Void label in ShipStation
      await client.voidLabel(parseInt(shipment.shipstationId))

      // Update shipment status
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: 'VOIDED' },
      })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      // If ShipStation API fails, just update local status
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: 'VOIDED' },
      })

      return NextResponse.json({ success: true, warning: 'Label voided locally only' })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to void label' },
      { status: 500 }
    )
  }
}


