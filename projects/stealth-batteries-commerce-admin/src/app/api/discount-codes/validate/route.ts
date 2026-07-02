import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface DiscountCodeWithPending {
  id: string | number
  code: string
  email?: string
  discountType: 'percentage' | 'fixed'
  discountAmount: number
  maxUses: number
  totalUses: number
  pendingUses: number
  active: boolean
  validFrom?: string | null
  validUntil?: string | null
  applicableProducts?: string[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Discount code validation request:', body)

    const { code, email } = body

    if (!code) {
      console.log('No code provided in request')
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config })

    // First find if the code exists and is active
    const query = {
      collection: 'discount-codes' as const,
      where: {
        code: {
          equals: code,
        },
        active: {
          equals: true,
        },
      },
    }

    console.log('Discount code query:', JSON.stringify(query, null, 2))
    const discountCodes = await payload.find(query)
    console.log('Discount codes found:', discountCodes.docs)

    if (!discountCodes.docs.length) {
      console.log('No valid discount codes found')
      return NextResponse.json({ error: 'Invalid or expired discount code' }, { status: 400 })
    }

    const discountCode = discountCodes.docs[0]

    // If the code has an email restriction but no email was provided, reject it
    if (discountCode.email && !email) {
      console.log('Email required but not provided')
      return NextResponse.json(
        { error: 'Email is required for this discount code' },
        { status: 400 },
      )
    }

    // If the code has an email restriction and email was provided, validate it matches
    if (discountCode.email && email && discountCode.email !== email) {
      console.log('Email provided does not match restriction')
      return NextResponse.json({ error: 'Invalid or expired discount code' }, { status: 400 })
    }

    // Check if code has reached max uses (including pending)
    if (discountCode.totalUses + (discountCode.pendingUses || 0) >= discountCode.maxUses) {
      console.log('Discount code has reached max uses (including pending)')
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 })
    }

    // Check date validity
    const now = new Date()
    if (discountCode.validFrom && new Date(discountCode.validFrom) > now) {
      console.log('Discount code not yet valid')
      return NextResponse.json({ error: 'Discount code not yet valid' }, { status: 400 })
    }
    if (discountCode.validUntil && new Date(discountCode.validUntil) < now) {
      console.log('Discount code has expired')
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 })
    }

    // Increment pending uses
    await payload.update({
      collection: 'discount-codes',
      id: discountCode.id,
      data: {
        pendingUses: (discountCode.pendingUses || 0) + 1,
      },
    })

    // Return the discount code details
    const response = {
      code: discountCode.code,
      discountType: discountCode.discountType,
      discountAmount: discountCode.discountAmount,
      applicableProducts: discountCode.applicableProducts || [],
    }
    console.log('Returning discount code details:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json({ error: 'Error validating discount code' }, { status: 500 })
  }
}
