import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config })

    // Find all discount codes with pending uses
    const discountCodes = await payload.find({
      collection: 'discount-codes',
      where: {
        pendingUses: {
          greater_than: 0,
        },
      },
    })

    // Reset pending uses for all found codes
    await Promise.all(
      discountCodes.docs.map((code) =>
        payload.update({
          collection: 'discount-codes',
          id: code.id,
          data: {
            pendingUses: 0,
          },
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      codesUpdated: discountCodes.docs.length,
    })
  } catch (error) {
    console.error('Error cleaning up discount codes:', error)
    return NextResponse.json(
      { error: 'Error cleaning up discount codes' },
      { status: 500 },
    )
  }
} 