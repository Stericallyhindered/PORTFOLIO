import { Order } from '@/payload-types'
import { UPSServiceNames } from '@/lib/shipping/constants/ups'

type OrderConfirmationEmailProps = {
  order: Order
  items: Array<{
    title: string
    quantity: number
    price: number
  }>
}

// Helper function to convert shipping service codes to human-readable names
function getShippingServiceName(code: string | null | undefined): string {
  if (!code) return 'Standard Shipping'
  return UPSServiceNames[code] || 'Standard Shipping'
}

function capitalizeWords(name: string = ''): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const OrderConfirmationEmail = ({ order, items }: OrderConfirmationEmailProps): string => {
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
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://stealthbatteries.com//assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>

        <h1 style="color: #333; text-align: center;">Order Confirmation</h1>
        <p style="margin-bottom: 20px;">Thank you for your order! We're excited to fulfill your battery needs.</p>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Shipping Method:</strong> ${getShippingServiceName(order.shippingService) || 'Standard Shipping'}</p>
          ${order.status === 'pre-order'
            ? `<p><strong>Order Type:</strong> Pre-order (will ship on release date)</p>
               ${order.items[0]?.product && typeof order.items[0].product === 'object' && 'releaseDate' in order.items[0].product
                 ? `<p><strong>Release Date:</strong> ${new Date(order.items[0].product.releaseDate).toLocaleDateString()}</p>`
                 : ''}`
            : order.status === 'back-order'
              ? '<p><strong>Order Type:</strong> Awaiting Inventory (typically ships in 3-4 weeks)</p>'
              : ''}
        </div>

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
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.subtotal ?? 0)}</td>
            </tr>
            ${order.discounts?.dealer && order.discounts.dealer.amount && order.discounts.dealer.amount > 0 && order.discounts.dealer.tierName ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; color: #16a34a;">
                <strong>Dealer Discount (${order.discounts.dealer.tierName}):</strong>
              </td>
              <td style="padding: 10px; text-align: right; color: #16a34a;">
                -${formatCurrency(order.discounts.dealer.amount)}
              </td>
            </tr>
            ${order.discounts.dealer.volumeDiscountApplied && order.discounts.dealer.volumeDiscountAmount && order.discounts.dealer.volumeDiscountAmount > 0 ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; color: #16a34a;">
                <strong>Volume Discount (${order.discounts.dealer.volumeDiscountPercentage}%):</strong>
              </td>
              <td style="padding: 10px; text-align: right; color: #16a34a;">
                -${formatCurrency(order.discounts.dealer.volumeDiscountAmount)}
              </td>
            </tr>
            ` : ''}
            ` : ''}
            ${order.discounts?.affiliate && order.discounts.affiliate.amount && order.discounts.affiliate.amount > 0 && order.discounts.affiliate.code ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; color: #16a34a;">
                <strong>Affiliate Discount (${order.discounts.affiliate.code}):</strong>
              </td>
              <td style="padding: 10px; text-align: right; color: #16a34a;">
                -${formatCurrency(order.discounts.affiliate.amount)}
              </td>
            </tr>
            ` : ''}
            ${order.discounts?.discountCode && order.discounts.discountCode.amount && order.discounts.discountCode.amount > 0 && order.discounts.discountCode.code ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; color: #16a34a;">
                <strong>Discount Code (${order.discounts.discountCode.code}):</strong>
              </td>
              <td style="padding: 10px; text-align: right; color: #16a34a;">
                -${formatCurrency(order.discounts.discountCode.amount)}
              </td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.shipping ?? 0)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(order.tax ?? 0)}</td>
            </tr>
            <tr style="background-color: #f8f8f8;">
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>${formatCurrency(order.total ?? 0)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>If you have any questions about your order, please contact us at support@stealthbatteries.com</p>
        </div>
      </body>
    </html>
  `
}
