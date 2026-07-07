"use server";

import { ContactFormValues, VideoReviewFormValues } from "@/lib/types";
import { resend } from "@/lib/services-init";

// Create HTML email templates


// Create HTML email templates for video review form
const createVideoReviewAdminEmailHTML = (data: VideoReviewFormValues) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Video Review Request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      padding: 20px;
      background-color: #5c5c5c;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #c62828;
      padding-bottom: 15px;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .message-content {
      background-color: #fff;
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    h1 {
      color: #c62828;
      font-size: 24px;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .field {
      margin-bottom: 15px;
    }
    .address-section {
      background-color: #f8f8f8;
      padding: 15px;
      border-left: 4px solid #c62828;
      margin: 15px 0;
      border-radius: 4px;
    }
    .address-title {
      font-weight: bold;
      color: #c62828;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/logo-title.png" alt="Bass Clown Co" class="logo">
      <h1>New Video Review Request</h1>
    </div>
    
    <p>You have received a new video review request from your website.</p>
    
    <div class="message-content">
      <div class="field">
        <span class="label">Name:</span> 
        <div>${data.name}</div>
      </div>
      
      <div class="field">
        <span class="label">Company:</span> 
        <div>${data.company}</div>
      </div>
      
      <div class="field">
        <span class="label">Email:</span> 
        <div>${data.email}</div>
      </div>
      
      <div class="field">
        <span class="label">Phone:</span> 
        <div>${data.phone}</div>
      </div>
      
      <div class="address-section">
        <div class="address-title">Physical Address:</div>
        <div>${data.streetAddress}</div>
        <div>${data.city}, ${data.state} ${data.zipCode}</div>
      </div>
      
      <div class="field">
        <span class="label">Product Description:</span> 
        <div>${data.description.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    
    <p style="color: #777; font-size: 12px; margin-top: 20px; text-align: center;">
      This is an automated message from your website's video review form.
    </p>
    
    <p style="color: #999; font-size: 11px; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
      <a href="https://solheim.tech" style="color: #999; text-decoration: none;">Powered by Solheim Technologies</a>
    </p>
  </div>
</body>
</html>
`;

const createVideoReviewCustomerEmailHTML = (data: VideoReviewFormValues) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for your video review request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      padding: 20px;
      background-color: #5c5c5c;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #c62828;
      padding-bottom: 15px;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .content {
      background-color: #fff;
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1 {
      color: #c62828;
      font-size: 24px;
    }
    .message-details {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .signature {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .field {
      margin-bottom: 15px;
    }
    .address-section {
      background-color: #f8f8f8;
      padding: 15px;
      border-left: 4px solid #c62828;
      margin: 15px 0;
      border-radius: 4px;
    }
    .address-title {
      font-weight: bold;
      color: #c62828;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/logo-title.png" alt="Bass Clown Co" class="logo">
      <h1>Thank You for Your Video Review Request</h1>
    </div>
    
    <div class="content">
      <p>Dear ${data.name},</p>
      
      <p>Thank you for submitting a video review request to Bass Clown Co. We have received your information and will be in touch shortly to discuss the next steps.</p>
      
      <p>Here's a copy of the information you submitted:</p>
      
      <div class="message-details">
        <div class="field">
          <span class="label">Name:</span> 
          <div>${data.name}</div>
        </div>
        
        <div class="field">
          <span class="label">Company:</span> 
          <div>${data.company}</div>
        </div>
        
        <div class="field">
          <span class="label">Email:</span> 
          <div>${data.email}</div>
        </div>
        
        <div class="field">
          <span class="label">Phone:</span> 
          <div>${data.phone}</div>
        </div>
        
        <div class="address-section">
          <div class="address-title">Physical Address:</div>
          <div>${data.streetAddress}</div>
          <div>${data.city}, ${data.state} ${data.zipCode}</div>
        </div>
        
        <div class="field">
          <span class="label">Product Description:</span> 
          <div>${data.description.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
      
      <p>We're excited to learn more about your product and create an engaging video review for you.</p>
      
      <div class="signature">
        <p>Best regards,<br>The Bass Clown Co Team</p>
      </div>
    </div>
    
    <p style="color: #BBB; font-size: 12px; margin-top: 20px; text-align: center;">
      This is an automated response. Please do not reply to this email.
    </p>
    
    <p style="color: #BBB; font-size: 11px; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
      <a href="https://solheim.tech" style="color: #BBB; text-decoration: none;">Powered by Solheim Technologies</a>
    </p>
  </div>
</body>
</html>
`;

export async function submitVideoReviewForm(data: VideoReviewFormValues) {
  try {
    // Honeypot check - if the website field is filled, it's likely a bot
    if (data.website && data.website.trim() !== '') {
      // Return fake success to fool bots, but don't actually send emails
      console.log('Honeypot triggered - potential bot submission blocked', {
        honeypotValue: data.website,
        submittedData: { name: data.name, email: data.email }
      });
      return { 
        success: true, 
        message: "Your video review request has been sent successfully. We'll get back to you soon!" 
      };
    }

    // Validate the form data
    if (!data.name || !data.email || !data.phone || !data.company || !data.description || 
        !data.streetAddress || !data.city || !data.state || !data.zipCode) {
      return { success: false, error: "All required fields must be completed" };
    }

    const recipientEmail = process.env.SEND_EMAILS_TO;
    const senderEmail = process.env.SEND_EMAILS_FROM || "Video Review Form <onboarding@resend.dev>";
    
    if (!recipientEmail) {
      console.error("SEND_EMAILS_TO environment variable is not set");
      return { 
        success: false, 
        error: "Server configuration error. Please contact the administrator." 
      };
    }

    // Email 1: Send notification to the business owner
    const { error: adminEmailError } = await resend.emails.send({
      from: senderEmail,
      to: recipientEmail,
      subject: `New Video Review Request from ${data.name} (${data.company})`,
      replyTo: data.email,
      html: createVideoReviewAdminEmailHTML(data),
      text: `
New Video Review Request

Name: ${data.name}
Company: ${data.company}
Email: ${data.email}
Phone: ${data.phone}

Physical Address:
${data.streetAddress}
${data.city}, ${data.state} ${data.zipCode}

Product Description: ${data.description}
      `, // Plain text fallback
    });
    
    if (adminEmailError) {
      console.error("Resend API error (admin email):", adminEmailError);
      return { 
        success: false, 
        error: "There was an error sending your request. Please try again." 
      };
    }
    
    // Email 2: Send confirmation to the customer
    const { error: customerEmailError } = await resend.emails.send({
      from: senderEmail,
      to: data.email,
      subject: "Thank you for your video review request - Bass Clown Co",
      html: createVideoReviewCustomerEmailHTML(data),
      text: `
Dear ${data.name},

Thank you for submitting a video review request to Bass Clown Co. We have received your information and will be in touch shortly to discuss the next steps.

Here's a copy of the information you submitted:

Name: ${data.name}
Company: ${data.company}
Email: ${data.email}
Phone: ${data.phone}

Physical Address:
${data.streetAddress}
${data.city}, ${data.state} ${data.zipCode}

Product Description: ${data.description}

We're excited to learn more about your product and create an engaging video review for you.

Best regards,
The Bass Clown Co Team
      `, // Plain text fallback
    });
    
    if (customerEmailError) {
      console.error("Resend API error (customer email):", customerEmailError);
      // Even if the customer email fails, we've already sent the admin email
      // so we can consider the submission successful
      return { 
        success: true, 
        message: "Your video review request has been received. We'll get back to you soon!" 
      };
    }
    
    return { 
      success: true, 
      message: "Your video review request has been sent successfully. We'll get back to you soon!" 
    };
  } catch (error) {
    console.error("Error submitting video review form:", error);
    return { 
      success: false, 
      error: "There was an error submitting your form. Please try again." 
    };
  }
}
