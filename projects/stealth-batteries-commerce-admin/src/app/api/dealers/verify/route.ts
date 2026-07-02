import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { errors: [{ message: 'Verification token is required' }] },
        { status: 400 },
      )
    }

    const payload = await getPayloadClient()

    // Find the dealer with the matching verification token
    const dealers = await payload.find({
      collection: 'dealers',
      where: {
        _verificationToken: {
          equals: token,
        },
      },
    })

    if (!dealers.docs.length) {
      return NextResponse.json(
        { errors: [{ message: 'Invalid or expired verification token' }] },
        { status: 400 },
      )
    }

    const dealer = dealers.docs[0]
    console.log('Found dealer:', dealer.email)

    // Update the dealer to mark them as verified
    console.log('Updating dealer verification status:', dealer.id)
    await payload.update({
      collection: 'dealers',
      id: dealer.id,
      data: {
        _verified: true,
        _verificationToken: null, // Clear the verification token
      },
    })
    console.log('Successfully verified dealer:', dealer.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json({ errors: [{ message: 'Failed to verify email' }] }, { status: 500 })
  }
}
