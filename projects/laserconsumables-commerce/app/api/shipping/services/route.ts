import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const searchParams = request.nextUrl.searchParams
    const carrier = searchParams.get('carrier')

    if (!carrier) {
      return NextResponse.json(
        { error: 'Carrier code required' },
        { status: 400 }
      )
    }

    const client = getShipStationClient()
    const result = await client.getCarrierServices(carrier)
    
    // ShipStation returns services in different formats - normalize it
    const services = Array.isArray(result)
      ? result
      : result?.services || result?.data || []
    
    // Ensure each service has code and name
    const normalizedServices = services.map((service: any) => ({
      code: service.code || service.Code || service.serviceCode || service.ServiceCode,
      name: service.name || service.Name || service.serviceName || service.ServiceName,
      domestic: service.domestic !== undefined ? service.domestic : service.Domestic,
      international: service.international !== undefined ? service.international : service.International,
      carrier: service.carrier || service.Carrier || carrier,
    })).filter((s: any) => s.code && s.name)
    
    return NextResponse.json({ services: normalizedServices })
  } catch (error: any) {
    console.error('Error loading services:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load services', services: [] },
      { status: 500 }
    )
  }
}




