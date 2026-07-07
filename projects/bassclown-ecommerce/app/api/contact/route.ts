import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/services-init";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const FROM_EMAIL = process.env.FROM_EMAIL!;

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, company, email, message } = await req.json();
    const name = `${firstName} ${lastName}`;
    // Admin notification email
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background: #23211C; color: #ECE9D9; padding: 2rem; border-radius: 12px; max-width: 600px; margin: auto;">
        <div style='text-align:center;margin-bottom:1.5rem;'>
          <img src='https://bassclown.com/logo-title.png' alt='Bass Clown Co Logo' style='max-width:220px;width:70%;height:auto;display:inline-block;' />
        </div>
        <h2 style="color: #ECE9D9;">🎣 New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #ECE9D9; color: #23211C; padding: 1rem; border-radius: 8px;">${message ? message.replace(/\n/g, '<br/>') : '<em>No message provided.</em>'}</div>
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ECE9D9;" />
        <p style="font-size: 0.9rem; color: #A9A7A1; text-align: center;">This is an automated message from <strong>Bass Clown Co.</strong></p>
        <p style="font-size: 0.7rem; color: #A9A7A1; text-align: center;">Powered by <a href="https://solheim.tech" style="color: #A9A7A1;">Solheim Technologies</a></p>
      </div>
    `;
    // User confirmation email
    const userHtml = `
      <div style="font-family: Arial, sans-serif; background: #23211C; color: #ECE9D9; padding: 2rem; border-radius: 12px; max-width: 600px; margin: auto;">
        <div style='text-align:center;margin-bottom:1.5rem;'>
          <img src='https://bassclown.com/logo-title.png' alt='Bass Clown Co Logo' style='max-width:220px;width:70%;height:auto;display:inline-block;' />
        </div>
        <h2 style="color: #ECE9D9;">Thank you for reaching out to Bass Clown Co.!</h2>
        <p>Hi ${name},</p>
        <p>We received your message and will get back to you soon. Here's what you sent us:</p>
        <div style="background: #ECE9D9; color: #23211C; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">${message ? message.replace(/\n/g, '<br/>') : '<em>No message provided.</em>'}</div>
        <p style="margin-top: 2rem;">🎣 Stay tuned for more action from Bass Clown Co.!</p>
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ECE9D9;" />
        <p style="font-size: 0.9rem; color: #A9A7A1; text-align: center;">This is an automated message from <strong>Bass Clown Co.</strong></p>
        <p style="font-size: 0.7rem; color: #A9A7A1; text-align: center;">Powered by <a href="https://solheim.tech" style="color: #A9A7A1;">Solheim Technologies</a></p>
      </div>
    `;
    // Send to admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      bcc: "support+bassclownlanding@solheim.tech",
      subject: `🎣 New Contact Form Submission from ${name}`,
      html: adminHtml,
      replyTo: email,
    });
    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Thank you for contacting Bass Clown Co.! 🎣",
      html: userHtml,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error)?.message || 'Failed to send email.' }, { status: 500 });
  }
} 