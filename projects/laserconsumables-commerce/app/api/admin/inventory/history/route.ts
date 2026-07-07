import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getInventoryHistory } from '@/lib/services/inventory-advanced'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const variantId = searchParams.get('variantId')
    const locationId = searchParams.get('locationId')
    const changeType = searchParams.get('changeType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const history = await getInventoryHistory({
      variantId: variantId || undefined,
      locationId: locationId || undefined,
      changeType: changeType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    })

    return NextResponse.json(history)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory history' },
      { status: 500 }
    )
  }
}


