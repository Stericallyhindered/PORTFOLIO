import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Find the discount code
    const discountCodes = await payload.find({
      collection: 'discount-codes',
      where: {
        code: {
          equals: code,
        },
      },
    })

    if (!discountCodes.docs.length) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 400 })
    }

    const discountCode = discountCodes.docs[0]

    // Move one use from pending to total
    await payload.update({
      collection: 'discount-codes',
      id: discountCode.id,
      data: {
        pendingUses: Math.max(0, (discountCode.pendingUses || 0) - 1),
        totalUses: (discountCode.totalUses || 0) + 1,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing discount code:', error)
    return NextResponse.json(
      { error: 'Error completing discount code' },
      { status: 500 },
    )
  }
} 