import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const client = getShipStationClient()
    const stores = await client.listStores()
    
    // Get currently configured store ID
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'shipstation_store_id' }
    })
    
    return NextResponse.json({
      stores: stores || [],
      selectedStoreId: setting?.value ? parseInt(setting.value) : null
    })
  } catch (error: any) {
    console.error('Failed to list ShipStation stores:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list stores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { storeId } = await request.json()
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Save the store ID
    await prisma.siteSetting.upsert({
      where: { key: 'shipstation_store_id' },
      update: { value: storeId.toString() },
      create: { key: 'shipstation_store_id', value: storeId.toString(), type: 'string', group: 'shipping' }
    })
    
    return NextResponse.json({ success: true, storeId })
  } catch (error: any) {
    console.error('Failed to set ShipStation store:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set store' },
      { status: 500 }
    )
  }
}
