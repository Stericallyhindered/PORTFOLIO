import type { OrderWithItems } from "./types";
import { formatCurrency } from "./utils";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface EmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

async function sendEmail(params: EmailParams): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === "your-brevo-api-key-here" || apiKey === "") {
    console.log("[Email] Brevo API key not configured. Email skipped.");
    console.log(`[Email] Would have sent to: ${params.to}`);
    console.log(`[Email] Subject: ${params.subject}`);
    return false;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.ORIGIN_NAME || "StrainCollector",
          email: process.env.ORIGIN_EMAIL || "noreply@straincollector.com",
        },
        to: [{ email: params.to, name: params.toName }],
        subject: params.subject,
        htmlContent: params.htmlContent,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Email] Brevo send failed:", errorText);
      return false;
    }

    console.log(`[Email] Sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

// ─── Generate Order Items HTML ───────────────────────────────
function orderItemsHtml(order: OrderWithItems): string {
  const rows = order.order_items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #333;">${item.product_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.category === "fresh_snip" ? "Fresh Snip" : "Rooted Clone"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;">${formatCurrency(item.line_total)}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#1a1a1a;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #00e66d;">Strain</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #00e66d;">Type</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #00e66d;">Qty</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #00e66d;">Unit Price</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #00e66d;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Email Templates ─────────────────────────────────────────

const baseStyle = `
  body { font-family: 'Inter', Arial, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 32px; border: 1px solid #222; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { color: #00e66d; font-size: 24px; margin: 0; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-pending { background: #78350f; color: #fbbf24; }
  .badge-created { background: #064e3b; color: #34d399; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #222; }
  .total-row { font-size: 20px; font-weight: 700; color: #00e66d; padding: 16px 0; text-align: right; }
  .tracking { background: #1a1a1a; border: 1px solid #00e66d; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
  .tracking a { color: #00e66d; text-decoration: none; font-weight: 600; }
  .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; }
`;

// ─── Customer Email ──────────────────────────────────────────
export async function sendCustomerOrderEmail(
  order: OrderWithItems
): Promise<boolean> {
  const trackingSection = order.shippo_tracking_number
    ? `
      <div class="tracking">
        <p style="margin:0 0 8px;font-size:14px;color:#999;">Your Tracking Number</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#00e66d;">${order.shippo_tracking_number}</p>
        ${order.shippo_tracking_url ? `<p style="margin:8px 0 0;"><a href="${order.shippo_tracking_url}">Track Your Package</a></p>` : ""}
      </div>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyle}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>StrainCollector</h1>
          <p style="color:#999;margin:4px 0 0;">Order Confirmation</p>
        </div>
        
        <p>Hey ${order.customer_name},</p>
        <p>Your order <strong>#${order.order_number}</strong> has been placed successfully!</p>
        
        <p style="background:#1a1a1a;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;color:#fbbf24;">
          Payment is handled separately. We'll reach out to arrange payment details.
        </p>

        ${trackingSection}

        <h3 style="color:#00e66d;margin-top:24px;">Order Details</h3>
        ${orderItemsHtml(order)}

        <div style="text-align:right;padding:8px 0;border-top:1px solid #333;">
          <p style="margin:4px 0;color:#999;">Subtotal: ${formatCurrency(order.subtotal)}</p>
          <p style="margin:4px 0;color:#999;">Shipping: ${formatCurrency(order.shipping_cost)}</p>
          <p class="total-row" style="margin:8px 0 0;">Total: ${formatCurrency(order.total)}</p>
        </div>

        <h3 style="color:#00e66d;margin-top:24px;">Shipping To</h3>
        <p style="color:#ccc;">
          ${order.shipping_address.name}<br/>
          ${order.shipping_address.street1}<br/>
          ${order.shipping_address.street2 ? order.shipping_address.street2 + "<br/>" : ""}
          ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}
        </p>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>StrainCollector</p>
        </div>
      </div>
    </body>
    </html>`;

  return sendEmail({
    to: order.customer_email,
    toName: order.customer_name,
    subject: `StrainCollector Order #${order.order_number} Confirmation`,
    htmlContent: html,
  });
}

// ─── Admin Email ─────────────────────────────────────────────
export async function sendAdminOrderEmail(
  order: OrderWithItems
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log("[Email] No admin email configured.");
    return false;
  }

  const labelSection = order.shippo_label_url
    ? `<div class="tracking">
        <p style="margin:0 0 8px;font-size:14px;color:#999;">Shipping Label Ready</p>
        <a href="${order.shippo_label_url}" style="display:inline-block;background:#00e66d;color:#000;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Download Label PDF</a>
        <p style="margin:8px 0 0;color:#999;">Tracking: ${order.shippo_tracking_number || "N/A"}</p>
      </div>`
    : `<div class="tracking" style="border-color:#f59e0b;">
        <p style="margin:0;color:#fbbf24;">Label not yet generated. Generate from admin dashboard.</p>
      </div>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyle}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order #${order.order_number}</h1>
          <span class="badge badge-created">Label Created</span>
        </div>

        <h3 style="color:#00e66d;">Customer Info</h3>
        <p style="color:#ccc;">
          <strong>${order.customer_name}</strong><br/>
          Email: ${order.customer_email}<br/>
          Phone: ${order.customer_phone}<br/>
          ${order.instagram ? "Instagram: @" + order.instagram + "<br/>" : ""}
          ${order.notes ? "Notes: " + order.notes : ""}
        </p>

        ${labelSection}

        <h3 style="color:#00e66d;">Order Items</h3>
        ${orderItemsHtml(order)}

        <div style="text-align:right;padding:8px 0;border-top:1px solid #333;">
          <p style="margin:4px 0;color:#999;">Subtotal: ${formatCurrency(order.subtotal)}</p>
          <p style="margin:4px 0;color:#999;">Shipping: ${formatCurrency(order.shipping_cost)}</p>
          <p class="total-row" style="margin:8px 0 0;">Total: ${formatCurrency(order.total)}</p>
        </div>

        <h3 style="color:#00e66d;">Ship To</h3>
        <p style="color:#ccc;">
          ${order.shipping_address.name}<br/>
          ${order.shipping_address.street1}<br/>
          ${order.shipping_address.street2 ? order.shipping_address.street2 + "<br/>" : ""}
          ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}
        </p>

        <div class="footer">
          <p>StrainCollector Admin Notification</p>
        </div>
      </div>
    </body>
    </html>`;

  return sendEmail({
    to: adminEmail,
    toName: "StrainCollector Admin",
    subject: `New Order #${order.order_number} - ${order.customer_name} - ${formatCurrency(order.total)}`,
    htmlContent: html,
  });
}
