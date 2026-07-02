import { Order } from '@/payload-types'
import { UPSServiceNames } from '@/lib/shipping/constants/ups'

type OrderNotificationEmailProps = {
  order: Order
  items: Array<{
    title: string
    quantity: number
    price: number
    modelNumber?: string
  }>
}

// Helper function to convert shipping service codes to human-readable names
function getShippingServiceName(code: string | null | undefined): string {
  if (!code) return 'Standard Shipping'
  return UPSServiceNames[code] || 'Standard Shipping'
}

export const OrderNotificationEmail = ({ order, items }: OrderNotificationEmailProps): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const itemsList = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.title}
          ${item.modelNumber ? `<br><span style="color: #666; font-size: 0.9em;">Model: ${item.modelNumber}</span>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
          item.price
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
          item.price * item.quantity
        )}</td>
      </tr>
    `
    )
    .join('')

  const shippingAddress = order.shippingAddress
  const billingAddress = order.billingAddress

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Notification - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>

        ${order.dealer || order.affiliate || order.isDropship ? `
        <div style="text-align: center; margin-bottom: 20px;">
          ${order.dealer ? `<span style="display: inline-block; background-color: #4f46e5; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">Dealer Order</span>` : ''}
          ${order.affiliate ? `<span style="display: inline-block; background-color: #059669; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">Affiliate Order</span>` : ''}
          ${order.isDropship ? `<span style="display: inline-block; background-color: #ea580c; color: white; padding: 8px 16px; border-radius: 9999px; margin: 4px;">Dropship Order</span>` : ''}
        </div>
        ` : ''}

        <h1 style="color: #333; text-align: center;">New Order Received</h1>
        <p style="margin-bottom: 20px; font-weight: bold; text-align: center;">Order #${order.orderNumber} requires processing</p>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order UUID:</strong> ${order.uuid}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Payment Intent ID:</strong> ${order.stripePaymentIntentId}</p>
          <p><strong>Shipping Method:</strong> ${getShippingServiceName(order.shippingService) || 'Standard Shipping'}</p>
          ${order.dealer ? `<p><strong>Dealer Order:</strong> Yes</p>` : ''}
          ${order.affiliate ? `<p><strong>Affiliate Order:</strong> Yes</p>` : ''}
          ${order.isDropship ? `<p><strong>Dropship Order:</strong> Yes</p>` : ''}
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Shipping Address</h2>
          <p>${shippingAddress.firstName} ${shippingAddress.lastName}</p>
          <p>${shippingAddress.line1}</p>
          ${shippingAddress.line2 ? `<p>${shippingAddress.line2}</p>` : ''}
          <p>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
          <p>${shippingAddress.country}</p>
          ${shippingAddress.phone ? `<p>Phone: ${shippingAddress.phone}</p>` : ''}
        </div>

        ${
          billingAddress
            ? `
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Billing Address</h2>
          <p>${billingAddress.firstName} ${billingAddress.lastName}</p>
          <p>${billingAddress.line1}</p>
          ${billingAddress.line2 ? `<p>${billingAddress.line2}</p>` : ''}
          <p>${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}</p>
          <p>${billingAddress.country}</p>
          ${billingAddress.phone ? `<p>Phone: ${billingAddress.phone}</p>` : ''}
        </div>
        `
            : ''
        }

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Quantity</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.subtotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.shipping)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.tax)}</td>
            </tr>
            <tr style="background-color: #f8f8f8;">
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>${formatCurrency(order.total)}</strong></td>
            </tr>
            ${
              order.dealer
                ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Dealer Total:</strong></td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.dealerTotal ?? 0)}</td>
            </tr>
            `
                : ''
            }
          </tfoot>
        </table>

        ${
          order.notes
            ? `
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Order Notes</h2>
          <p>${order.notes}</p>
        </div>
        `
            : ''
        }

        <div style="margin-top: 30px; text-align: center;">
          <p><a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/orders/${
    order.id
  }" style="background-color: #F53604; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order in Admin Panel</a></p>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Powered by <a href="https://solheim.tech/" style="color: #007bff; text-decoration: none;">Solheim Technologies</a></p>
        </div>
      </body>
    </html>
  `
}