import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  getAbandonedCarts,
  markAbandonedCartEmailSent,
  markAbandonedCartRecovered,
} from '@/lib/services/abandoned-carts'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const recovered = searchParams.get('recovered')

    const result = await getAbandonedCarts({
      page,
      limit,
      recovered: recovered ? recovered === 'true' : undefined,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch abandoned carts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { action, id } = body

    if (action === 'mark_sent') {
      const cart = await markAbandonedCartEmailSent(id)
      return NextResponse.json({ cart })
    } else if (action === 'mark_recovered') {
      const cart = await markAbandonedCartRecovered(id)
      return NextResponse.json({ cart })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update abandoned cart' },
      { status: 500 }
    )
  }
}


