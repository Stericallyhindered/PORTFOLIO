import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { sendTemplateEmail } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { templateName, to, variables } = body

    if (!templateName || !to) {
      return NextResponse.json(
        { error: 'Template name and recipient email are required' },
        { status: 400 }
      )
    }

    await sendTemplateEmail(templateName, to, variables || {})

    return NextResponse.json({ success: true, message: 'Test email sent' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}





