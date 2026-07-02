import { Dealer } from '@/payload-types'

type DealerEmailVerifiedNotificationProps = {
  dealer: Dealer
}

export const DealerEmailVerifiedNotification = ({ dealer }: DealerEmailVerifiedNotificationProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Dealer Email Verified - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #16a34a; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">Email Verified</span>
        </div>

        <h1 style="color: #333; text-align: center;">Dealer Email Address Verified</h1>
        <p style="margin-bottom: 20px; font-weight: bold; text-align: center;">Dealer ID: ${dealer.id}</p>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
          <h2 style="margin-top: 0; color: #16a34a;">✅ Email Verification Complete</h2>
          <p><strong>${dealer.companyName}</strong> has successfully verified their email address and is now ready for admin approval.</p>
          <p><strong>Verified Email:</strong> ${dealer.email}</p>
          <p><strong>Verification Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Dealer Information</h2>
          <p><strong>Company Name:</strong> ${dealer.companyName}</p>
          <p><strong>Contact Name:</strong> ${dealer.contactName}</p>
          <p><strong>Phone:</strong> ${dealer.phoneNumber}</p>
          <p><strong>Registration Date:</strong> ${new Date(dealer.createdAt).toLocaleString()}</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Business Address</h2>
          <p>${dealer.address.line1}</p>
          ${dealer.address.line2 ? `<p>${dealer.address.line2}</p>` : ''}
          <p>${dealer.address.city}, ${dealer.address.state} ${dealer.address.zip}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h2 style="margin-top: 0; color: #f59e0b;">⏳ Next Step Required</h2>
          <p>This dealer has completed email verification and is now awaiting <strong>admin approval</strong> to access the dealer portal.</p>
          <p>Please review their application and approve or reject their dealer account.</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="margin-bottom: 10px;">Review and approve this dealer application:</p>
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/dealers/${dealer.id}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Review Dealer</a>
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/dealers" style="display: inline-block; background-color: #F53604; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View All Dealers</a>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Powered by <a href="https://solheim.tech/" style="color: #007bff; text-decoration: none;">Solheim Technologies</a></p>
        </div>
      </body>
    </html>
  `
}
