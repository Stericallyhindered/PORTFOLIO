import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getCart, addToCart, clearCart } from '@/lib/services/cart'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const cart = await getCart(user?.id)

    return NextResponse.json(cart)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()

    const { variantId, quantity } = body

    if (!variantId || !quantity) {
      return NextResponse.json(
        { error: 'variantId and quantity are required' },
        { status: 400 }
      )
    }

    const item = await addToCart(variantId, quantity, user?.id)

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    await clearCart(user?.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to clear cart' },
      { status: 500 }
    )
  }
}





