import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  createGiftCard,
  getGiftCards,
  getGiftCardByCode,
  generateUniqueGiftCardCode,
} from '@/lib/services/gift-cards'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const active = searchParams.get('active')
    const customerId = searchParams.get('customerId')
    const code = searchParams.get('code')

    if (code) {
      const giftCard = await getGiftCardByCode(code)
      return NextResponse.json({ giftCard })
    }

    const result = await getGiftCards({
      page,
      limit,
      active: active ? active === 'true' : undefined,
      customerId: customerId || undefined,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gift cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'generate_code') {
      const code = await generateUniqueGiftCardCode()
      return NextResponse.json({ code })
    } else {
      // Create gift card
      if (!data.code) {
        data.code = await generateUniqueGiftCardCode()
      }
      const giftCard = await createGiftCard(data)
      return NextResponse.json({ giftCard })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create gift card' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    const { prisma } = await import('@/lib/db/prisma')
    const giftCard = await prisma.giftCard.update({
      where: { id },
      data,
    })

    return NextResponse.json({ giftCard })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update gift card' },
      { status: 500 }
    )
  }
}


