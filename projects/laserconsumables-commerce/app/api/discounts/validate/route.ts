import { NextRequest, NextResponse } from 'next/server'
import { validateDiscountCode } from '@/lib/services/discounts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal, productIds, collectionIds } = body

    const result = await validateDiscountCode(
      code,
      subtotal,
      productIds,
      collectionIds
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to validate discount' },
      { status: 500 }
    )
  }
}





