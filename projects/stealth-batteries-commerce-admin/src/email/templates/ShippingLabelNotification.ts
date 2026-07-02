import { Order } from '@/payload-types'
import { UPSServiceNames } from '@/lib/shipping/constants/ups'

type ShippingLabelNotificationProps = {
  order: Order
  trackingNumber: string
  customerName: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function capitalizeWords(name: string = ''): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const ShippingLabelNotification = ({ order, trackingNumber, customerName }: ShippingLabelNotificationProps): string => {
  // Get shipping service name
  const serviceName = order.shippingService ? UPSServiceNames[order.shippingService] || 'Standard Shipping' : 'Standard Shipping'

  // Format items list
  const itemsList = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      </tr>
    `
    )
    .join('')

  // Get ship-to information with appropriate heading based on order type
  const shipToInfo = `
    <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #F53604;">${order.isDropship && order.dealer ? 'Customer Shipping Address' : 'Shipping Address'}</h3>
      <p><strong>Name:</strong> ${capitalizeWords(order.shippingAddress.firstName ?? '')} ${capitalizeWords(order.shippingAddress.lastName ?? '')}</p>
      <p><strong>Address:</strong><br />
      ${order.shippingAddress.line1}<br />
      ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br />` : ''}
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
    </div>
  `

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Shipping Label Created - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>

        <h1 style="color: #333; text-align: center;">Your Order is Ready to Ship!</h1>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <p>Dear ${capitalizeWords(customerName)},</p>
          <p>Great news! We've created a shipping label for your order #${order.orderNumber}. Your order will be shipped soon via ${serviceName}.</p>

          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #F53604;">Tracking Information</h2>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Shipping Method:</strong> ${serviceName}</p>
            <p>You can track your package using this tracking number once it's picked up by our carrier.</p>
            <a href="https://www.ups.com/track?track=yes&trackNums=${trackingNumber}&loc=en_US&requester=ST/trackdetails" style="color: #F53604; text-decoration: none;">Track your package</a>
          </div>

          ${shipToInfo}

          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #F53604;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <h3>Order Summary</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>If you have any questions about your order, please contact us at support@stealthbatteries.com</p>
          <p>Thank you for choosing Stealth Batteries!</p>
        </div>
      </body>
    </html>
  `
}
