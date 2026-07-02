import { Dealer } from '@/payload-types'

type DealerWelcomeProps = {
  dealer: Dealer
}

export const DealerWelcome = ({ dealer }: DealerWelcomeProps & { dealer: Dealer & { verificationLink?: string } }): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Stealth Batteries Dealer Program</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://stealthbatteries.com/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>
        
        <h1 style="color: #333; text-align: center;">Welcome to Stealth Batteries</h1>
        <p style="margin-bottom: 20px; text-align: center;">Thank you for applying to become a Stealth Batteries dealer.</p>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Next Steps</h2>
          ${dealer.verificationLink ? `
            <p><strong>Verify your email address:</strong></p>
            <div style="text-align:center;margin:20px 0;">
              <a href="${dealer.verificationLink}" style="display:inline-block;padding:12px 24px;background:#E94E31;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">Verify Email Address</a>
            </div>
          ` : ''}
          <ol style="margin-top: 10px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Application Review: Our team will verify your business information</li>
            <li style="margin-bottom: 10px;">Account Activation: Once approved, you'll receive access to dealer pricing and resources</li>
            <li style="margin-bottom: 10px;">Welcome Call: A team member will schedule an onboarding call to walk you through our dealer program</li>
          </ol>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Your Application Details</h2>
          <p><strong>Business Name:</strong> ${dealer.companyName}</p>
          <p><strong>Contact Name:</strong> ${dealer.contactName}</p>
          <p><strong>Email:</strong> ${dealer.email}</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Questions?</h2>
          <p>If you have any questions about your application or our dealer program, please don't hesitate to contact us:</p>
          <ul style="list-style: none; padding: 0; margin: 10px 0;">
            <li style="margin-bottom: 5px;">📧 Email: sales@stealthbatteries.com</li>
            <li style="margin-bottom: 5px;">📞 Phone: (877) 277-2025</li>
          </ul>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <p style="color: #666; font-size: 14px;">
            Thank you for choosing Stealth Batteries. We look forward to building a successful partnership with you.
          </p>
        </div>
      </body>
    </html>
  `
} 