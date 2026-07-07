import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'
import { prisma } from '@/lib/db/prisma'
import { getOrder } from '@/lib/services/orders'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const {
      orderId,
      carrierCode,
      serviceCode,
      packageCode,
      weight,
      shipDate,
      dimensions,
    } = body

    const client = getShipStationClient()

    // Check if orderId is a local database ID (string/cuid) or ShipStation ID (number)
    const orderIdStr = String(orderId)
    const isShipStationId = /^\d+$/.test(orderIdStr)
    
    console.log('Create label request:', { orderId, orderIdStr, isShipStationId, orderIdType: typeof orderId })
    
    // Try to get order from our database first (only if it's not a numeric ShipStation ID)
    let order = null
    if (!isShipStationId) {
      try {
        order = await getOrder(orderId)
        console.log('Found local order:', order?.id)
      } catch (err: any) {
        console.log('Local order lookup failed:', err.message)
        // Order might be in ShipStation only
      }
    } else {
      console.log('Skipping local DB lookup - this is a ShipStation ID')
    }

    // Get site settings for ship-from address
    const shipFromSettings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'shipping_from_name',
            'shipping_from_address1',
            'shipping_from_city',
            'shipping_from_state',
            'shipping_from_zip',
            'shipping_from_country',
          ],
        },
      },
    })

    const settingsMap = shipFromSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    let shipment

    if (order && order.shippingAddress) {
      // Build shipFrom and shipTo for logging
      const shipFromData = {
        name: settingsMap['shipping_from_name'] || 'Laser Consumables',
        street1: settingsMap['shipping_from_address1'] || '',
        street2: settingsMap['shipping_from_address2'] || undefined,
        city: settingsMap['shipping_from_city'] || '',
        state: settingsMap['shipping_from_state'] || '',
        postalCode: settingsMap['shipping_from_zip'] || '',
        country: settingsMap['shipping_from_country'] || 'US',
      }
      
      const shipToData = {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        street1: order.shippingAddress.address1,
        street2: order.shippingAddress.address2 || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.zip,
        country: order.shippingAddress.country || 'US',
      }
      
      console.log('ShipStation createLabel request:', {
        carrierCode,
        serviceCode, 
        packageCode,
        weight: weight?.value || weight || 1,
        shipFrom: shipFromData,
        shipTo: shipToData,
        settingsFound: Object.keys(settingsMap),
      })
      
      // Validate ship-from address
      if (!shipFromData.street1 || !shipFromData.city || !shipFromData.state || !shipFromData.postalCode) {
        return NextResponse.json(
          { error: 'Ship-from address is incomplete. Please configure your shipping settings in Admin > Settings.' },
          { status: 400 }
        )
      }
      
      // Use our database order
      shipment = await client.createLabel({
        carrierCode,
        serviceCode,
        packageCode,
        confirmation: body.confirmation || 'none',
        shipDate: shipDate || new Date().toISOString().split('T')[0],
        weight: {
          value: weight?.value || weight || 1,
          units: weight?.units || 'ounces',
        },
        dimensions: dimensions,
        shipTo: shipToData,
        shipFrom: shipFromData,
      })
    } else {
      // Try to create label for ShipStation order directly
      const shipStationOrderId = parseInt(orderId)
      if (isNaN(shipStationOrderId)) {
        return NextResponse.json(
          { error: 'Order not found. Please provide a valid order ID.' },
          { status: 404 }
        )
      }

      // Get order from ShipStation
      const shipStationOrder = await client.getOrder(shipStationOrderId)
      
      shipment = await client.createLabelForOrder(shipStationOrderId, {
        carrierCode,
        serviceCode,
        packageCode,
        confirmation: body.confirmation || 'none',
        shipDate: shipDate || new Date().toISOString().split('T')[0],
        weight: {
          value: weight?.value || weight || 1,
          units: weight?.units || 'ounces',
        },
        dimensions: dimensions,
        insuranceOptions: body.insuranceOptions,
        internationalOptions: body.internationalOptions,
        advancedOptions: body.advancedOptions,
        testLabel: body.testLabel || false,
      })
    }

    // Save shipment to database if we have a local order
    let dbShipment = null
    if (order) {
      dbShipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          shipstationId: shipment.shipmentId?.toString(),
          carrier: shipment.carrierCode || carrierCode,
          service: shipment.serviceCode || serviceCode,
          trackingNumber: shipment.trackingNumber,
          status: 'LABEL_CREATED',
          labelUrl: shipment.labelData ? `data:application/pdf;base64,${shipment.labelData}` : null,
          labelData: shipment.labelData,
          cost: shipment.shipmentCost ? Math.round(shipment.shipmentCost * 100) : null,
          shipDate: shipment.shipDate ? new Date(shipment.shipDate) : new Date(),
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
          carrier: shipment.carrierCode || carrierCode || 'N/A',
          estimatedDelivery: dbShipment.estimatedDelivery
            ? new Date(dbShipment.estimatedDelivery).toLocaleDateString()
            : 'N/A',
        })
      } catch (emailError) {
        console.error('Failed to send shipping notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Return shipment data with label URL
    const labelUrl = shipment.labelData 
      ? `data:application/pdf;base64,${shipment.labelData}`
      : null

    return NextResponse.json({
      ...shipment,
      labelUrl,
      dbShipment,
    })
  } catch (error: any) {
    console.error('Create label error:', error)
    
    // Parse ShipStation specific errors
    let errorMessage = error.message || 'Failed to create shipping label'
    
    // Check for common issues
    if (errorMessage.includes('shipTo')) {
      errorMessage = 'Missing or invalid ship-to address. Make sure the order has a valid shipping address.'
    } else if (errorMessage.includes('shipFrom')) {
      errorMessage = 'Missing or invalid ship-from address. Please configure your shipping settings.'
    } else if (errorMessage.includes('carrierCode') || errorMessage.includes('serviceCode')) {
      errorMessage = 'Invalid carrier or service code. Please select valid shipping options.'
    } else if (errorMessage.includes('weight')) {
      errorMessage = 'Invalid weight. Please enter a valid package weight.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

