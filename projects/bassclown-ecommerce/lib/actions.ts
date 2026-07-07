"use server";

import { ContactFormValues } from "@/lib/types";
import { resend } from "@/lib/services-init";

// Create HTML email templates
const createAdminEmailHTML = (data: ContactFormValues) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
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
      background-color: #f9f9f9;
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
    .service-highlight {
      background-color: #f8f8f8;
      padding: 10px;
      border-left: 4px solid #c62828;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/logo-title.png" alt="Bass Clown Co" class="logo">
      <h1>New Contact Form Submission</h1>
    </div>
    
    <p>You have received a new inquiry from your website contact form.</p>
    
    <div class="message-content">
      <div class="field">
        <span class="label">Name:</span> 
        <div>${data.name}</div>
      </div>
      
      <div class="field">
        <span class="label">Email:</span> 
        <div>${data.email}</div>
      </div>
      
      <div class="field">
        <span class="label">Service/Topic:</span> 
        <div class="service-highlight">${data.service}</div>
      </div>
      
      <div class="field">
        <span class="label">Message:</span> 
        <div>${data.message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    
    <p style="color: #777; font-size: 12px; margin-top: 20px; text-align: center;">
      This is an automated message from your website's contact form.
    </p>
    
    <p style="color: #999; font-size: 11px; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
      <a href="https://solheim.tech" style="color: #999; text-decoration: none;">Powered by Solheim Technologies</a>
    </p>
  </div>
</body>
</html>
`;

const createCustomerEmailHTML = (data: ContactFormValues) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for contacting Bass Clown Co</title>
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
      background-color: #f9f9f9;
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
    .service-highlight {
      background-color: #f8f8f8;
      padding: 10px;
      border-left: 4px solid #c62828;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/logo-title.png" alt="Bass Clown Co" class="logo">
      <h1>Thank You for Reaching Out</h1>
    </div>
    
    <div class="content">
      <p>Dear ${data.name},</p>
      
      <p>Thank you for contacting Bass Clown Co. We have received your inquiry and one of our team members will get back to you shortly.</p>
      
      <p>Here's a copy of the information you submitted:</p>
      
      <div class="message-details">
        <div class="field">
          <span class="label">Name:</span> 
          <div>${data.name}</div>
        </div>
        
        <div class="field">
          <span class="label">Email:</span> 
          <div>${data.email}</div>
        </div>
        
        <div class="field">
          <span class="label">Service/Topic:</span> 
          <div class="service-highlight">${data.service}</div>
        </div>
        
        <div class="field">
          <span class="label">Message:</span> 
          <div>${data.message.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
      
      <p>We appreciate your interest in our services and look forward to discussing your project.</p>
      
      <div class="signature">
        <p>Best regards,<br>The Bass Clown Co Team</p>
      </div>
    </div>
    
    <p style="color: #777; font-size: 12px; margin-top: 20px; text-align: center;">
      This is an automated response. Please do not reply to this email.
    </p>
    
    <p style="color: #999; font-size: 11px; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
      <a href="https://solheim.tech" style="color: #999; text-decoration: none;">Powered by Solheim Technologies</a>
    </p>
  </div>
</body>
</html>
`;

export async function submitContactForm(data: ContactFormValues) {
  try {
    // Validate the form data
    if (!data.name || !data.email || !data.service || !data.message) {
      return { success: false, error: "All required fields must be completed" };
    }

    const recipientEmail = process.env.SEND_EMAILS_TO;
    const senderEmail = process.env.SEND_EMAILS_FROM || "Contact Form <onboarding@resend.dev>";
    
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
      subject: `New Contact Form Submission from ${data.name}`,
      replyTo: data.email,
      html: createAdminEmailHTML(data),
      text: `
Name: ${data.name}
Email: ${data.email}
Service: ${data.service}
Message: ${data.message}
      `, // Plain text fallback
    });
    
    if (adminEmailError) {
      console.error("Resend API error (admin email):", adminEmailError);
      return { 
        success: false, 
        error: "There was an error sending your message. Please try again." 
      };
    }
    
    // Email 2: Send confirmation to the customer
    const { error: customerEmailError } = await resend.emails.send({
      from: senderEmail,
      to: data.email,
      subject: "Thank you for contacting Bass Clown Co",
      html: createCustomerEmailHTML(data),
      text: `
Dear ${data.name},

Thank you for reaching out to Bass Clown Co. We have received your inquiry and one of our team members will get back to you shortly.

Here's a copy of the information you submitted:

Name: ${data.name}
Email: ${data.email}
Service: ${data.service}
Message: ${data.message}

We appreciate your interest in our services and look forward to discussing your project.

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
        message: "Your message has been received. We'll get back to you soon!" 
      };
    }
    
    return { 
      success: true, 
      message: "Your message has been sent successfully. We'll get back to you soon!" 
    };
  } catch (error) {
    console.error("Error submitting form:", error);
    return { 
      success: false, 
      error: "There was an error submitting your form. Please try again." 
    };
  }
}
