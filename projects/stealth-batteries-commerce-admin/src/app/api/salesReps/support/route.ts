import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'
import { SalesRepSupportRequest } from '@/email/templates/SalesRepSupportRequest'

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

    // Get the sales rep's information using the token
    const salesRepResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/me`, {
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!salesRepResponse.ok) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized - Invalid token' }] },
        { status: 401 },
      )
    }

    const { user: salesRep } = await salesRepResponse.json()

    if (!salesRep) {
      return NextResponse.json({ errors: [{ message: 'Sales rep not found' }] }, { status: 404 })
    }

    // Send the support request email
    await payload.sendEmail({
      to: 'sales-support@stealthbatteries.com',
      from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
      subject: `Sales Rep ${salesRep.name} Support Request: ${subject}`,
      html: SalesRepSupportRequest({ salesRep, subject, message }),
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
