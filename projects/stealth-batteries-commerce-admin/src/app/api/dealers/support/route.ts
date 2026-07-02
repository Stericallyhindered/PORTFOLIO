import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'
import { DealerSupportRequest } from '@/email/templates/DealerSupportRequest'

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { subject, message } = await request.json()

    // Get the token from cookies
    const token = request.headers.get('Authorization')?.split('JWT ')[1]

    if (!token) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized - No token provided' }] },
        { status: 401 },
      )
    }

    // Get the dealer's information using the token
    const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!dealerResponse.ok) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized - Invalid token' }] },
        { status: 401 },
      )
    }

    const { user: dealer } = await dealerResponse.json()

    if (!dealer) {
      return NextResponse.json({ errors: [{ message: 'Dealer not found' }] }, { status: 404 })
    }

    // Send the support request email
    await payload.sendEmail({
      to: 'support@stealthbatteries.com',
      from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
      subject: `Dealer ${dealer.companyName} Support Request: ${subject}`,
      html: DealerSupportRequest({ dealer, subject, message }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending support request:', error)
    return NextResponse.json(
      { errors: [{ message: 'Failed to send support request' }] },
      { status: 500 },
    )
  }
}
