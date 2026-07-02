import { NextResponse } from 'next/server'
import { createShipment } from '@/lib/shipping/services/ups'
import type { ShipmentRequest } from '@/lib/shipping/services/ups'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log('Shipping label request:', {
      destination: body.destination,
      service_code: body.service_code,
      reference_number: body.reference_number,
      notification_email: body.notification_email,
      packages: body.packages.map((pkg: any) => ({
        dimensions: pkg.dimensions,
        weight: pkg.weight,
        weight_unit: pkg.weight_unit,
        packaging_type: pkg.packaging_type,
        is_hazmat: pkg.is_hazmat,
      })),
    })

    // Validate environment variables
    const requiredEnvVars = {
      UPS_CLIENT_ID: process.env.UPS_CLIENT_ID,
      UPS_CLIENT_SECRET: process.env.UPS_CLIENT_SECRET,
      UPS_ACCOUNT_NUMBER: process.env.UPS_ACCOUNT_NUMBER,
      UPS_ENVIRONMENT: process.env.UPS_ENVIRONMENT,
      SHIPPING_ORIGIN_ADDRESS: process.env.SHIPPING_ORIGIN_ADDRESS,
      SHIPPING_ORIGIN_CITY: process.env.SHIPPING_ORIGIN_CITY,
      SHIPPING_ORIGIN_STATE: process.env.SHIPPING_ORIGIN_STATE,
      SHIPPING_ORIGIN_POSTAL_CODE: process.env.SHIPPING_ORIGIN_POSTAL_CODE,
    }

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars)
      return NextResponse.json(
        { error: `Missing required environment variables: ${missingVars.join(', ')}` },
        { status: 500 },
      )
    }

    // Validate required fields
    if (!body.destination || !body.packages || !body.service_code) {
      console.error('Missing required fields:', {
        hasDestination: !!body.destination,
        hasPackages: !!body.packages,
        hasServiceCode: !!body.service_code,
        body,
      })
      return NextResponse.json(
        { error: 'Missing required fields: destination, packages, or service_code' },
        { status: 400 },
      )
    }

    // Validate package data
    for (const pkg of body.packages) {
      if (!pkg.dimensions || !pkg.weight) {
        console.error('Invalid package data:', pkg)
        return NextResponse.json(
          { error: 'Invalid package data: missing dimensions or weight' },
          { status: 400 },
        )
      }
    }

    const shipmentRequest: ShipmentRequest = {
      credentials: {
        client_id: process.env.UPS_CLIENT_ID!,
        client_secret: process.env.UPS_CLIENT_SECRET!,
        account_number: process.env.UPS_ACCOUNT_NUMBER!,
        environment: (process.env.UPS_ENVIRONMENT || 'test') as 'test' | 'production',
      },
      origin: {
        name: 'Stealth Batteries',
        attention_name: 'Shipping Department',
        address: process.env.SHIPPING_ORIGIN_ADDRESS!,
        city: process.env.SHIPPING_ORIGIN_CITY!,
        state: process.env.SHIPPING_ORIGIN_STATE!,
        postalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE!,
        country: 'US',
      },
      destination: body.destination,
      packages: body.packages,
      service_code: body.service_code,
      reference_number: body.reference_number,
      notification_email: body.notification_email,
    }

    const shipment = await createShipment(shipmentRequest)
    return NextResponse.json(shipment)
  } catch (error) {
    console.error('Error creating shipping label:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create shipping label' },
      { status: 500 },
    )
  }
}
