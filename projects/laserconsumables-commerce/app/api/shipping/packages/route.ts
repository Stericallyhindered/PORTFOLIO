import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getShipStationClient } from '@/lib/shipstation/client'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const carrier = searchParams.get('carrier')
    
    const client = getShipStationClient()
    const result = await client.getPackages(carrier || undefined)
    
    // ShipStation returns packages in different formats - normalize it
    const packages = Array.isArray(result)
      ? result
      : result?.packages || result?.data || []
    
    // Ensure each package has code and name
    const normalizedPackages = packages.map((pkg: any) => ({
      code: pkg.code || pkg.Code || pkg.packageCode || pkg.PackageCode,
      name: pkg.name || pkg.Name || pkg.packageName || pkg.PackageName,
      carrier: pkg.carrier || pkg.Carrier || carrier,
      domestic: pkg.domestic !== undefined ? pkg.domestic : pkg.Domestic,
      international: pkg.international !== undefined ? pkg.international : pkg.International,
    })).filter((p: any) => p.code && p.name)
    
    return NextResponse.json({ packages: normalizedPackages })
  } catch (error: any) {
    console.error('Error loading packages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load packages', packages: [] },
      { status: 500 }
    )
  }
}




