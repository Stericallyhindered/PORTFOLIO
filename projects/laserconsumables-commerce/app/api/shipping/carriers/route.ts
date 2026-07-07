import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function GET() {
  try {
    await requireAdmin()
    const client = getShipStationClient()
    const result = await client.getCarriers()
    
    // ShipStation returns carriers in different formats - normalize it
    const carriers = Array.isArray(result) 
      ? result 
      : result?.carriers || result?.data || []
    
    // Ensure each carrier has code and name
    const normalizedCarriers = carriers.map((carrier: any) => ({
      code: carrier.code || carrier.carrierCode || carrier.CarrierCode,
      name: carrier.name || carrier.Name || carrier.carrierName || carrier.CarrierName,
      balance: carrier.balance || carrier.Balance,
      requiresFundedAmount: carrier.requiresFundedAmount || carrier.RequiresFundedAmount,
      accountNumber: carrier.accountNumber || carrier.AccountNumber,
      shippingProviderId: carrier.shippingProviderId || carrier.ShippingProviderId,
      primary: carrier.primary || carrier.Primary,
    })).filter((c: any) => c.code && c.name)
    
    return NextResponse.json({ carriers: normalizedCarriers })
  } catch (error: any) {
    console.error('Error loading carriers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load carriers', carriers: [] },
      { status: 500 }
    )
  }
}




