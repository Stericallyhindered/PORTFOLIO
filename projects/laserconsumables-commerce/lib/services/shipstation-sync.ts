import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'

// Get or create store ID for Laser Consumables website
async function getWebsiteStoreId(): Promise<number | undefined> {
  try {
    // Check if we have a stored storeId in settings
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'shipstation_store_id' }
    })
    
    if (setting?.value) {
      return parseInt(setting.value)
    }

    // Try to find existing store by name
    const client = getShipStationClient()
    const storesResponse = await client.listStores()
    const stores = storesResponse || []
    
    // Look for our website store
    const websiteStore = stores.find((s: any) => 
      s.storeName?.toLowerCase().includes('laser') || 
      s.storeName?.toLowerCase().includes('website')
    )
    
    if (websiteStore) {
      // Save for future use
      await prisma.siteSetting.upsert({
        where: { key: 'shipstation_store_id' },
        update: { value: websiteStore.storeId.toString() },
        create: { key: 'shipstation_store_id', value: websiteStore.storeId.toString(), type: 'string', group: 'shipping' }
      })
      return websiteStore.storeId
    }

    // If no store found, orders will go to manual orders
    // User should create a "Custom Store" in ShipStation named "Laser Consumables Website"
    return undefined
  } catch (error) {
    console.error('Failed to get website store ID:', error)
    return undefined
  }
}

export async function syncOrderToShipStation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

  if (!order) {
    throw new Error('Order not found')
  }

  if (!order.shippingAddress) {
    throw new Error('Order has no shipping address')
  }

  const client = getShipStationClient()
  
  // Get the store ID for the website
  const storeId = await getWebsiteStoreId()

  // Format order for ShipStation
  const shipStationOrder: any = {
    orderNumber: order.orderNumber,
    orderKey: order.id,
    orderDate: order.createdAt.toISOString(),
    paymentDate: order.paymentStatus === 'PAID' ? order.createdAt.toISOString() : undefined,
    orderStatus: order.status === 'PENDING' ? 'awaiting_shipment' : 'shipped',
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
      weight: item.variant.weight ? {
        value: item.variant.weight,
        units: 'ounces',
      } : undefined,
    })),
    amountPaid: order.total / 100,
    taxAmount: order.tax / 100,
    shippingAmount: order.shipping / 100,
    customerNotes: order.notes || undefined,
    internalNotes: `Synced from Laser Consumables website`,
    paymentMethod: 'Credit Card',
    requestedShippingService: undefined,
    advancedOptions: storeId ? { storeId } : undefined,
  }
  
  // If we have a storeId, add it directly to the order as well
  if (storeId) {
    shipStationOrder.storeId = storeId
  }

  // Create or update order in ShipStation
  const result = await client.createOrder(shipStationOrder)

  // Store ShipStation order ID in our database
  await prisma.order.update({
    where: { id: orderId },
    data: {
      notes: order.notes 
        ? `${order.notes}\n[ShipStation ID: ${result.orderId}]`
        : `[ShipStation ID: ${result.orderId}]`,
    },
  })

  return result
}

export async function syncAllPendingOrders() {
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      NOT: {
        notes: {
          contains: 'ShipStation ID',
        },
      },
    },
    select: { id: true, orderNumber: true },
  })

  const results = []
  for (const order of pendingOrders) {
    try {
      const result = await syncOrderToShipStation(order.id)
      results.push({ orderNumber: order.orderNumber, success: true, shipStationId: result.orderId })
    } catch (error: any) {
      results.push({ orderNumber: order.orderNumber, success: false, error: error.message })
    }
  }

  return results
}
