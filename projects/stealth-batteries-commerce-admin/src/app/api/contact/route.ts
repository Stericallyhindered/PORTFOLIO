import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { firstName, lastName, email, phone, subject, message } = await request.json()

    // Send email to staff/admin
    await payload.sendEmail({
      to: process.env.CONTACT_EMAIL || 'sales@stealthbatteries.com',
      from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
      replyTo: email,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Contact Form Submission - Stealth Batteries</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
            </div>

            <h1 style="color: #333; text-align: center;">New Contact Form Submission</h1>

            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin-top: 0;">Contact Information</h2>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>

            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px;">
              <h2 style="margin-top: 0;">Message</h2>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </body>
        </html>
      `,
    })

    // Send confirmation email to the user
    await payload.sendEmail({
      to: email,
      from: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
      subject: 'Thank you for contacting Stealth Batteries',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Contact Confirmation - Stealth Batteries</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
            </div>

            <h1 style="color: #333; text-align: center;">Thank You for Contacting Us</h1>

            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <p>Dear ${firstName},</p>
              <p>Thank you for reaching out to Stealth Batteries. We have received your message and will get back to you as soon as possible.</p>
              <p>For your reference, here's a copy of your message:</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
              <p style="color: #666; font-size: 14px;">
                If you have any immediate questions, please don't hesitate to call us at (888) 800-2527.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { errors: [{ message: 'Failed to process contact form submission' }] },
      { status: 500 },
    )
  }
}
