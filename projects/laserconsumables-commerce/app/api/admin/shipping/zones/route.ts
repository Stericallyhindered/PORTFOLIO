import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  createShippingZone,
  getShippingZones,
  updateShippingZone,
  deleteShippingZone,
} from '@/lib/services/shipping-advanced'

export async function GET() {
  try {
    await requireAdmin()
    const zones = await getShippingZones()
    return NextResponse.json({ zones })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping zones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const zone = await createShippingZone(body)
    return NextResponse.json({ zone })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create shipping zone' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body
    const zone = await updateShippingZone(id, data)
    return NextResponse.json({ zone })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update shipping zone' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Zone ID required' }, { status: 400 })
    }

    await deleteShippingZone(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete shipping zone' },
      { status: 500 }
    )
  }
}


