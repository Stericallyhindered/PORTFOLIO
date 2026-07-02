import { Dealer } from '@/payload-types'

type DealerRegistrationNotificationProps = {
  dealer: Dealer
}

export const DealerRegistrationNotification = ({ dealer }: DealerRegistrationNotificationProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Dealer Registration - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #F53604; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">New Dealer Registration</span>
        </div>

        <h1 style="color: #333; text-align: center;">New Dealer Application Received</h1>
        <p style="margin-bottom: 20px; font-weight: bold; text-align: center;">Dealer ID: ${dealer.id}</p>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Business Information</h2>
          <p><strong>Company Name:</strong> ${dealer.companyName}</p>
          <p><strong>Registration Date:</strong> ${new Date(dealer.createdAt).toLocaleString()}</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Contact Information</h2>
          <p><strong>Name:</strong> ${dealer.contactName}</p>
          <p><strong>Email:</strong> ${dealer.email}</p>
          <p><strong>Phone:</strong> ${dealer.phoneNumber}</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Business Address</h2>
          <p>${dealer.address.line1}</p>
          ${dealer.address.line2 ? `<p>${dealer.address.line2}</p>` : ''}
          <p>${dealer.address.city}, ${dealer.address.state} ${dealer.address.zip}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="margin-bottom: 10px;">Please review this application and take appropriate action.</p>
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/dealers" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Powered by <a href="https://solheim.tech/" style="color: #007bff; text-decoration: none;">Solheim Technologies</a></p>
        </div>
      </body>
    </html>
  `
}