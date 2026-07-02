import { NextResponse } from 'next/server'
import { geocodeAddress, findNearestDealers } from '@/lib/dealer-location'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    // Get user's coordinates
    const userLocation = await geocodeAddress(address)
    // Initialize Payload
    const payload = await getPayload({ config })

    // Get all verified dealers
    const dealersResponse = await payload.find({
      collection: 'dealers',
      where: {
        verified: {
          equals: true,
        },
        'coordinates.latitude': {
          exists: true,
        },
        'coordinates.longitude': {
          exists: true,
        },
      },
    })

    // Find nearest dealers
    const nearestDealers = findNearestDealers(dealersResponse.docs, userLocation, limit)

    return NextResponse.json({
      userLocation,
      dealers: nearestDealers.map((dealer) => ({
        id: dealer.id,
        companyName: dealer.companyName,
        address: dealer.address,
        coordinates: dealer.coordinates,
        distance: Math.round(dealer.distance * 10) / 10, // Round to 1 decimal place
        phoneNumber: dealer.phoneNumber,
      })),
    })
  } catch (error) {
    console.error('Error finding nearest dealers:', error)
    return NextResponse.json({ error: 'Failed to find nearest dealers' }, { status: 500 })
  }
}
