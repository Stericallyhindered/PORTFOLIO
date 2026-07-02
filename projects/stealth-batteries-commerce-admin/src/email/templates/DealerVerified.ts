import { Dealer } from '@/payload-types'

type DealerVerifiedProps = {
  dealer: Dealer
}

export const DealerVerified = ({ dealer }: DealerVerifiedProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Stealth Batteries Dealer Account is Approved!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://stealthbatteries.com/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #F53604; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">Account Approved</span>
        </div>
        
        <h1 style="color: #333; text-align: center;">Welcome to the Stealth Batteries Family!</h1>
        <p style="margin-bottom: 20px; text-align: center;">Your dealer account has been approved and is now active.</p>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Getting Started</h2>
          <p>You can now access your dealer account with the following features:</p>
          <ul style="margin-top: 10px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Exclusive dealer pricing on all products</li>
            <li style="margin-bottom: 10px;">Access to dealer resources and marketing materials</li>
            <li style="margin-bottom: 10px;">Ability to place orders with your dealer discount</li>
            <li style="margin-bottom: 10px;">View and manage your orders</li>
          </ul>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Next Steps</h2>
          <ol style="margin-top: 10px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">
              <strong>Log in to your account:</strong><br>
              Visit <a href="https://stealthbatteries.com/dealer/login" style="color: #F53604;">our dealer portal</a> and sign in with your email address
            </li>
            <li style="margin-bottom: 10px;">
              <strong>Complete your profile:</strong><br>
              Review and update your business information if needed
            </li>
            <li style="margin-bottom: 10px;">
              <strong>Schedule onboarding:</strong><br>
              Our team will contact you shortly to schedule your onboarding call
            </li>
          </ol>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Need Help?</h2>
          <p>Our dealer support team is here to help you succeed:</p>
          <ul style="list-style: none; padding: 0; margin: 10px 0;">
            <li style="margin-bottom: 5px;">📧 Email: support@stealthbatteries.com</li>
            <li style="margin-bottom: 5px;">📞 Phone: (877) 277-2025</li>
          </ul>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <p style="color: #666; font-size: 14px;">
            Thank you for partnering with Stealth Batteries. We're excited to help grow your business!
          </p>
        </div>
      </body>
    </html>
  `
} 