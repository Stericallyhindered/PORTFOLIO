import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const orderIdParam = searchParams.get('orderId')

    // ShipStation's `orderId` filter is numeric. Our internal Order `id` is a string.
    // If the caller passes a non-numeric value, we omit the ShipStation filter and rely on DB fallback.
    const shipstationOrderIdRaw = orderIdParam ? Number(orderIdParam) : NaN
    const shipstationOrderId =
      Number.isFinite(shipstationOrderIdRaw) ? shipstationOrderIdRaw : undefined

    try {
      const client = getShipStationClient()
      const shipments = await client.listShipments({
        page,
        pageSize,
        orderId: shipstationOrderId,
      })

      return NextResponse.json(shipments)
    } catch (error: any) {
      // Fallback to our database
      const where: any = {}
      if (orderIdParam) {
        const order = await prisma.order.findUnique({
          where: { id: orderIdParam },
        })
        if (order) {
          where.orderId = order.id
        }
      }

      const shipments = await prisma.shipment.findMany({
        where,
        include: {
          order: {
            include: {
              customer: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })

      return NextResponse.json({
        shipments: shipments.map((shipment) => ({
          shipmentId: shipment.id,
          orderId: shipment.orderId,
          orderNumber: shipment.order.orderNumber,
          carrierCode: shipment.carrier,
          serviceCode: shipment.service,
          trackingNumber: shipment.trackingNumber,
          shipmentCost: shipment.cost || 0,
          cost: shipment.cost || 0,
          labelUrl: shipment.labelUrl,
          status: shipment.status,
        })),
        page,
        pageSize,
        total: await prisma.shipment.count({ where }),
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}


