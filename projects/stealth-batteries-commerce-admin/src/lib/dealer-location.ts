import type { Dealer } from '@/payload-types'

interface Coordinates {
  latitude: number
  longitude: number
}

interface DealerWithDistance extends Dealer {
  distance: number
  isWithinServiceArea: boolean
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in miles
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 3959 // Earth's radius in miles

  const lat1 = (point1.latitude * Math.PI) / 180
  const lat2 = (point2.latitude * Math.PI) / 180
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate the bounding box for a point and radius
 * @param center Center coordinates
 * @param radiusMiles Radius in miles
 * @returns Bounding box coordinates
 */
export function calculateBoundingBox(
  center: Coordinates,
  radiusMiles: number,
): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  const R = 3959 // Earth's radius in miles
  const lat = center.latitude * (Math.PI / 180)
  const lon = center.longitude * (Math.PI / 180)

  const dLat = radiusMiles / R
  const dLon = Math.asin(Math.sin(radiusMiles / R) / Math.cos(lat))

  return {
    minLat: (lat - dLat) * (180 / Math.PI),
    maxLat: (lat + dLat) * (180 / Math.PI),
    minLng: (lon - dLon) * (180 / Math.PI),
    maxLng: (lon + dLon) * (180 / Math.PI),
  }
}

/**
 * Geocode an address using custom geocoding service
 * @param address Full address string
 * @returns Promise with coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const apiKey = process.env.ST_GEOCODING_KEY
  if (!apiKey) {
    throw new Error('Geocoding API key is not configured')
  }

  const response = await fetch('https://geocode.solheim.tech/api/v1/geocode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      address,
      options: {
        country: 'US',
      },
    }),
  })

  const result = await response.json()

  if (result.success && result.results?.[0]) {
    return {
      latitude: result.results[0].latitude,
      longitude: result.results[0].longitude,
    }
  }

  console.error('Geocoding failed:', result)
  throw new Error(result.error || 'Failed to geocode address')
}

/**
 * Find nearest dealers to a given location
 * @param dealers List of dealers with coordinates
 * @param location Reference location coordinates
 * @param limit Maximum number of dealers to return
 * @param maxDistance Maximum distance to search (optional)
 * @returns Array of dealers sorted by distance
 */
export function findNearestDealers(
  dealers: Dealer[],
  location: Coordinates,
  limit: number = 5,
  maxDistance?: number,
): DealerWithDistance[] {
  return dealers
    .filter((dealer) => dealer.coordinates?.latitude && dealer.coordinates?.longitude)
    .map((dealer) => {
      const distance = calculateDistance(location, {
        latitude: dealer.coordinates.latitude,
        longitude: dealer.coordinates.longitude,
      })

      // Check if the customer is within the dealer's service area
      const isWithinServiceArea = dealer.serviceArea?.radius
        ? distance <= dealer.serviceArea.radius
        : distance <= 50 // Default 50-mile radius if not specified

      return {
        ...dealer,
        distance,
        isWithinServiceArea,
      }
    })
    .filter((dealer) => !maxDistance || dealer.distance <= maxDistance)
    .sort((a, b) => {
      // Prioritize dealers where the customer is within their service area
      if (a.isWithinServiceArea && !b.isWithinServiceArea) return -1
      if (!a.isWithinServiceArea && b.isWithinServiceArea) return 1
      // Then sort by distance
      return a.distance - b.distance
    })
    .slice(0, limit)
}

/**
 * Get the service area polygon points for a dealer
 * @param center Dealer location coordinates
 * @param radiusMiles Service radius in miles
 * @param points Number of points to generate (more = smoother circle)
 * @returns Array of coordinates forming a circle
 */
export function getServiceAreaPolygon(
  center: Coordinates,
  radiusMiles: number,
  points: number = 32,
): Coordinates[] {
  const polygon: Coordinates[] = []
  const R = 3959 // Earth's radius in miles

  for (let i = 0; i < points; i++) {
    const angle = (i * 360) / points
    const radians = (angle * Math.PI) / 180

    // Calculate offset
    const lat1 = center.latitude * (Math.PI / 180)
    const lon1 = center.longitude * (Math.PI / 180)
    const d = radiusMiles / R

    // Calculate new point
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(radians),
    )
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(radians) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      )

    // Convert back to degrees
    polygon.push({
      latitude: (lat2 * 180) / Math.PI,
      longitude: (((lon2 * 180) / Math.PI + 540) % 360) - 180, // Normalize longitude
    })
  }

  return polygon
}
