import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'

export async function POST(req: Request) {
  try {
    const { code, action } = await req.json()
    if (!code || !['increment', 'decrement'].includes(action)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const payload = await getPayloadClient()
    const found = await payload.find({
      collection: 'discount-codes',
      where: { code: { equals: code } },
      limit: 1,
    })
    if (!found?.docs?.length) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
    }
    const discount = found.docs[0] as any
    let newPending = discount.pendingUses || 0
    if (action === 'increment') newPending++
    if (action === 'decrement' && newPending > 0) newPending--
    await payload.update({
      collection: 'discount-codes',
      id: discount.id,
      data: { pendingUses: newPending },
    })
    return NextResponse.json({ pendingUses: newPending })
  } catch (err) {
    console.error('[DISCOUNT PENDING] Error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
