import { NextRequest, NextResponse } from 'next/server'
import { updateCartItem, removeFromCart } from '@/lib/services/cart'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined) {
      return NextResponse.json(
        { error: 'quantity is required' },
        { status: 400 }
      )
    }

    await updateCartItem(params.itemId, quantity)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await removeFromCart(params.itemId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}





