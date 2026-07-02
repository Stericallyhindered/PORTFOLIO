import { Product } from '@/payload-types'

type LowStockNotificationProps = {
  product: Product
  currentStock: number
  lowStockThreshold: number
}

export const LowStockNotificationEmail = ({ product, currentStock, lowStockThreshold }: LowStockNotificationProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Low Stock Alert - Stealth Batteries</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_SERVER_URL}/assets/PNG/stealth-final-logo-01.png" alt="Stealth Batteries Logo" style="max-width: 360px;">
        </div>
        
        <div style="background-color: #fff3f3; border-left: 4px solid #ef4444; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h1 style="color: #ef4444; margin-top: 0;">⚠️ Low Stock Alert</h1>
          <p style="margin-bottom: 0;">Immediate attention required for inventory management.</p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #333;">Product Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Product Name:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${product.title}</td>
            </tr>
            ${product.modelNumber ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Model Number:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${product.modelNumber}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Current Stock:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: ${currentStock === 0 ? '#ef4444' : '#f59e0b'};">
                ${currentStock} units
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Low Stock Threshold:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${lowStockThreshold} units</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px;">
          <p><strong>Action Required:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 10px; padding-left: 24px; position: relative;">
              <span style="position: absolute; left: 0;">📦</span> Review current inventory levels
            </li>
            <li style="margin-bottom: 10px; padding-left: 24px; position: relative;">
              <span style="position: absolute; left: 0;">🔄</span> Place restock orders if necessary
            </li>
            <li style="margin-bottom: 10px; padding-left: 24px; position: relative;">
              <span style="position: absolute; left: 0;">📊</span> Update inventory forecasts
            </li>
          </ul>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/products/${product.id}" 
             style="background-color: #F53604; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Product in Admin Panel
          </a>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated notification from your inventory management system.</p>
          <p>Powered by <a href="https://solheim.tech/" style="color: #F53604; text-decoration: none;">Solheim Technologies</a></p>
        </div>
      </body>
    </html>
  `
} 