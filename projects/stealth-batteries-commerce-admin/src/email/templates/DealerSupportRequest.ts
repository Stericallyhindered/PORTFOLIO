import { Dealer } from '@/payload-types'

type DealerSupportRequestProps = {
  dealer: Dealer
  subject: string
  message: string
}

export const DealerSupportRequest = ({ dealer, subject, message }: DealerSupportRequestProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Dealer Support Request - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://stealthbatteries.com/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #F53604; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">Dealer Support Request</span>
        </div>
        
        <h1 style="color: #333; text-align: center;">New Dealer Support Request</h1>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Dealer Information</h2>
          <p><strong>Business Name:</strong> ${dealer.companyName}</p>
          <p><strong>Contact Name:</strong> ${dealer.contactName}</p>
          <p><strong>Email:</strong> ${dealer.email}</p>
          <p><strong>Phone:</strong> ${dealer.phoneNumber}</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Support Request Details</h2>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <p><a href="https://stealthbatteries.com/admin/collections/dealers/${dealer.id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dealer in Admin Panel</a></p>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Powered by <a href="https://solheim.tech/" style="color: #007bff; text-decoration: none;">Solheim Technologies</a></p>
        </div>
      </body>
    </html>
  `
} 