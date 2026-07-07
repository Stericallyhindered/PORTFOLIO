import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  createReturn,
  getReturns,
  getReturn,
  approveReturn,
  rejectReturn,
  completeReturn,
} from '@/lib/services/returns'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')
    const id = searchParams.get('id')

    if (id) {
      const returnRecord = await getReturn(id)
      return NextResponse.json({ return: returnRecord })
    }

    const result = await getReturns({
      page,
      limit,
      status: status || undefined,
      orderId: orderId || undefined,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch returns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create') {
      const returnRecord = await createReturn(data)
      return NextResponse.json({ return: returnRecord })
    } else if (action === 'approve') {
      const returnRecord = await approveReturn(data.id)
      return NextResponse.json({ return: returnRecord })
    } else if (action === 'reject') {
      const returnRecord = await rejectReturn(data.id, data.reason)
      return NextResponse.json({ return: returnRecord })
    } else if (action === 'complete') {
      const returnRecord = await completeReturn(data.id)
      return NextResponse.json({ return: returnRecord })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process return' },
      { status: 500 }
    )
  }
}


