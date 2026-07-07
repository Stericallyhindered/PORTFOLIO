import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getOrder, updateOrderStatus, updateOrderPaymentStatus } from '@/lib/services/orders'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const order = await getOrder(params.id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()

    if (body.status) {
      await updateOrderStatus(params.id, body.status, body.note)
    }

    if (body.paymentStatus) {
      await updateOrderPaymentStatus(params.id, body.paymentStatus)
    }

    const order = await getOrder(params.id)

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}





