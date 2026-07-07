import { Resend } from 'resend'
import { prisma } from '@/lib/db/prisma'

// Initialize Resend only if API key is available
let resend: Resend | null = null

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch (error) {
  console.warn('Resend client could not be initialized:', error)
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  // Log email attempt
  let emailLogId: string | undefined

  try {
    if (!resend) {
      throw new Error('Resend API key not configured. Please set RESEND_API_KEY in your .env file.')
    }

    // Resend requires at least one of: html, text, or react
    const emailContent = options.html 
      ? { html: options.html } 
      : { text: options.text || options.subject }

    const result = await resend.emails.send({
      from: options.from || 'Laser Consumables <noreply@laserconsumables.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      ...emailContent,
    })

    // Log successful email
    const log = await prisma.emailLog.create({
      data: {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        body: options.html || options.text || '',
        status: 'sent',
        resendId: (result as any).data?.id || (result as any).id || undefined,
      },
    })

    emailLogId = log.id
    return result
  } catch (error: any) {
    // Log failed email
    try {
      await prisma.emailLog.create({
        data: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          body: options.html || options.text || '',
          status: 'failed',
          error: error.message,
        },
      })
    } catch (logError) {
      console.error('Failed to log email error:', logError)
    }

    throw error
  }
}

export async function sendTemplateEmail(
  templateName: string,
  to: string | string[],
  variables: Record<string, string>
) {
  const template = await prisma.emailTemplate.findUnique({
    where: { name: templateName },
  })

  if (!template) {
    throw new Error(`Email template "${templateName}" not found`)
  }

  let subject = template.subject
  let body = template.bodyHtml || template.body

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  })

  // Send email and link to template
  try {
    if (!resend) {
      throw new Error('Resend API key not configured. Please set RESEND_API_KEY in your .env file.')
    }

    const result = await resend.emails.send({
      from: 'Laser Consumables <noreply@laserconsumables.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body,
    })

    // Log email with template link
    await prisma.emailLog.create({
      data: {
        templateId: template.id,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        body: body,
        status: 'sent',
        resendId: (result as any).data?.id || (result as any).id || undefined,
      },
    })

    return result
  } catch (error: any) {
    // Log failed email with template link
    try {
      await prisma.emailLog.create({
        data: {
          templateId: template.id,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          body: body,
          status: 'failed',
          error: error.message,
        },
      })
    } catch (logError) {
      console.error('Failed to log email error:', logError)
    }

    throw error
  }
}

