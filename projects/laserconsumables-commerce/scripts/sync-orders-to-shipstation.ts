import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SHIPSTATION_API_URL = 'https://ssapi.shipstation.com'

async function syncOrders() {
  const apiKey = process.env.SHIPSTATION_API_KEY
  const apiSecret = process.env.SHIPSTATION_API_SECRET

  if (!apiKey || !apiSecret) {
    console.error('SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET must be set')
    process.exit(1)
  }

  console.log('Fetching pending orders...')

  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      shippingAddress: true,
      billingAddress: true,
    },
  })

  console.log(`Found ${orders.length} pending orders`)

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  for (const order of orders) {
    if (!order.shippingAddress) {
      console.log(`Skipping order ${order.orderNumber} - no shipping address`)
      continue
    }

    console.log(`Syncing order ${order.orderNumber}...`)

    const shipStationOrder = {
      orderNumber: order.orderNumber,
      orderKey: order.id,
      orderDate: order.createdAt.toISOString(),
      paymentDate: order.paymentStatus === 'PAID' ? order.createdAt.toISOString() : undefined,
      orderStatus: 'awaiting_shipment',
      customerEmail: order.email,
      billTo: order.billingAddress ? {
        name: `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
        company: order.billingAddress.company || undefined,
        street1: order.billingAddress.address1,
        street2: order.billingAddress.address2 || undefined,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        postalCode: order.billingAddress.zip,
        country: order.billingAddress.country || 'US',
        phone: order.billingAddress.phone || order.phone || undefined,
      } : undefined,
      shipTo: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        company: order.shippingAddress.company || undefined,
        street1: order.shippingAddress.address1,
        street2: order.shippingAddress.address2 || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.zip,
        country: order.shippingAddress.country || 'US',
        phone: order.shippingAddress.phone || order.phone || undefined,
      },
      items: order.items.map((item) => ({
        lineItemKey: item.id,
        sku: item.variant.sku || undefined,
        name: `${item.variant.product.name}${item.variant.name ? ` - ${item.variant.name}` : ''}`,
        quantity: item.quantity,
        unitPrice: item.price / 100,
      })),
      amountPaid: order.total / 100,
      taxAmount: order.tax / 100,
      shippingAmount: order.shipping / 100,
      internalNotes: 'Synced from Laser Consumables website',
    }

    try {
      const response = await fetch(`${SHIPSTATION_API_URL}/orders/createorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipStationOrder),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`Failed to sync order ${order.orderNumber}:`, error)
        continue
      }

      const result = await response.json()
      console.log(`✅ Order ${order.orderNumber} synced! ShipStation ID: ${result.orderId}`)

      // Update order notes with ShipStation ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          notes: order.notes
            ? `${order.notes}\n[ShipStation ID: ${result.orderId}]`
            : `[ShipStation ID: ${result.orderId}]`,
        },
      })
    } catch (error) {
      console.error(`Error syncing order ${order.orderNumber}:`, error)
    }
  }

  console.log('\nSync complete!')
}

syncOrders()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
