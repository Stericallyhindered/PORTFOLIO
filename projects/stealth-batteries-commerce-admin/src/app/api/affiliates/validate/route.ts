import { NextResponse } from 'next/server'
import payload from 'payload'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Affiliate code is required' }, { status: 400 })
    }

    // Find the affiliate
    const affiliates = await payload.find({
      collection: 'affiliates',
      where: {
        affiliateCode: {
          equals: code,
        },
        verified: {
          equals: true,
        },
      },
    })

    if (affiliates.totalDocs === 0) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 400 })
    }

    const affiliate = affiliates.docs[0]

    return NextResponse.json({
      code: affiliate.affiliateCode,
      customerDiscount: affiliate.customerDiscount,
    })
  } catch (error) {
    console.error('Error validating affiliate code:', error)
    return NextResponse.json({ error: 'Failed to validate affiliate code' }, { status: 500 })
  }
}
