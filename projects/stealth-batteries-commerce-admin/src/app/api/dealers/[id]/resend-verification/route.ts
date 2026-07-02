import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationToken } from '@/lib/auth'
import { getPayloadClient } from '@/getPayload'

// Increase timeout for email operations
export const maxDuration = 60

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ errors: [{ message: 'Missing dealer ID' }] }, { status: 400 })
    }

    // Get the initialized Payload client
    const payload = await getPayloadClient()

    // Get the dealer
    const doc = await payload.findByID({
      collection: 'dealers',
      id,
    })

    if (!doc) {
      return NextResponse.json({ errors: [{ message: 'Dealer not found' }] }, { status: 404 })
    }

    // Generate new verification token and send email
    const token = generateVerificationToken()
    await payload.update({
      collection: 'dealers',
      id,
      data: {
        _verificationToken: token,
      },
    })

    // Send verification email
    await payload.sendEmail({
      to: doc.email,
      from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
      subject: 'Verify Your Email',
      html: `
        <p>Please verify your email by clicking the link below:</p>
        <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}">Verify Email</a>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resending verification email:', error)
    return NextResponse.json(
      { errors: [{ message: 'Failed to resend verification email' }] },
      { status: 500 },
    )
  }
}
