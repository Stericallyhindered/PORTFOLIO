import { prisma } from '@/lib/db/prisma'
import { getShipStationClient } from '@/lib/shipstation/client'
import { getOrder } from './orders'

export async function createLabelAutomatically(orderId: string) {
  try {
    // Check if auto-create is enabled
    const autoCreateSetting = await prisma.siteSetting.findUnique({
      where: { key: 'auto_create_labels' },
    })

    if (!autoCreateSetting || autoCreateSetting.value !== 'true') {
      return { success: false, message: 'Auto-create labels is disabled' }
    }

    const order = await getOrder(orderId)

    if (!order || !order.shippingAddress) {
      return { success: false, message: 'Order or shipping address not found' }
    }

    // Get default shipping settings
    const shippingSettings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'shipping_from_name',
            'shipping_from_address1',
            'shipping_from_address2',
            'shipping_from_city',
            'shipping_from_state',
            'shipping_from_zip',
            'shipping_from_country',
            'default_carrier',
            'default_service',
            'default_package',
          ],
        },
      },
    })

    const settingsMap = shippingSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const carrierCode = settingsMap['default_carrier'] || 'usps'
    const serviceCode = settingsMap['default_service'] || 'priority'
    const packageCode = settingsMap['default_package'] || 'package'

    // Calculate weight from order items
    const totalWeight = order.items.reduce((sum, item) => {
      const variantWeight = item.variant.weight || 0.5 // Default 0.5 lbs
      return sum + variantWeight * item.quantity
    }, 0)

    const client = getShipStationClient()

    const shipment = await client.createLabel({
      carrierCode,
      serviceCode,
      packageCode,
      confirmation: 'none',
      shipDate: new Date().toISOString().split('T')[0],
      weight: {
        value: totalWeight * 16, // Convert lbs to ounces
        units: 'ounces',
      },
      shipTo: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        street1: order.shippingAddress.address1,
        street2: order.shippingAddress.address2 || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.zip,
        country: order.shippingAddress.country || 'US',
      },
      shipFrom: {
        name: settingsMap['shipping_from_name'] || 'Laser Consumables',
        street1: settingsMap['shipping_from_address1'] || '',
        street2: settingsMap['shipping_from_address2'] || undefined,
        city: settingsMap['shipping_from_city'] || '',
        state: settingsMap['shipping_from_state'] || '',
        postalCode: settingsMap['shipping_from_zip'] || '',
        country: settingsMap['shipping_from_country'] || 'US',
      },
    })

    // Save shipment to database
    const dbShipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        shipstationId: shipment.shipmentId?.toString(),
        carrier: shipment.carrierCode,
        service: shipment.serviceCode,
        trackingNumber: shipment.trackingNumber,
        status: 'LABEL_CREATED',
        labelUrl: shipment.labelData
          ? `data:image/png;base64,${shipment.labelData}`
          : null,
        labelData: shipment.labelData,
        cost: shipment.shipmentCost,
        shipDate: shipment.shipDate ? new Date(shipment.shipDate) : null,
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'SHIPPED' },
    })

    // Send shipping notification email
    try {
      const { sendTemplateEmail } = await import('@/lib/email/client')
      await sendTemplateEmail('order_shipped', order.email, {
        orderNumber: order.orderNumber,
        trackingNumber: shipment.trackingNumber || 'N/A',
        carrier: shipment.carrierCode || 'N/A',
        estimatedDelivery: dbShipment.estimatedDelivery
          ? new Date(dbShipment.estimatedDelivery).toLocaleDateString()
          : 'N/A',
      })
    } catch (emailError) {
      console.error('Failed to send shipping notification email:', emailError)
      // Don't fail the request if email fails
    }

    return { success: true, shipment: dbShipment }
  } catch (error: any) {
    console.error('Auto-create label error:', error)
    return { success: false, message: error.message || 'Failed to create label' }
  }
}

