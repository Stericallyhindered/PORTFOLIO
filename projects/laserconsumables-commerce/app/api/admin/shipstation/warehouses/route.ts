import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function GET() {
  try {
    await requireAdmin()
    const client = getShipStationClient()
    const warehouses = await client.listWarehouses()
    return NextResponse.json({ warehouses })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch warehouses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { warehouseName, originAddress, returnAddress, isDefault } = body

    if (!originAddress) {
      return NextResponse.json({ error: 'Origin address required' }, { status: 400 })
    }

    const client = getShipStationClient()
    const warehouse = await client.createWarehouse({
      warehouseName,
      originAddress,
      returnAddress,
      isDefault,
    })

    return NextResponse.json({ warehouse })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create warehouse' },
      { status: 500 }
    )
  }
}
