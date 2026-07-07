import { prisma } from '@/lib/db/prisma'
import { getShipStationClient } from '@/lib/shipstation/client'

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  states?: string[]
  zipCodes?: string[]
  rateRules: Array<{
    type: 'weight' | 'price' | 'item_count'
    min: number
    max?: number
    rate: number
    freeShipping?: boolean
  }>
}

export interface ShippingProfile {
  id: string
  name: string
  productIds?: string[]
  collectionIds?: string[]
  zoneId: string
  defaultCarrier?: string
  defaultService?: string
}

// Store shipping zones and profiles in SiteSetting as JSON
export async function createShippingZone(data: Omit<ShippingZone, 'id'>) {
  const zones = await getShippingZones()
  const newZone: ShippingZone = {
    id: `zone-${Date.now()}`,
    ...data,
  }

  zones.push(newZone)

  await prisma.siteSetting.upsert({
    where: { key: 'shipping_zones' },
    create: {
      key: 'shipping_zones',
      value: JSON.stringify(zones),
      type: 'json',
      group: 'shipping',
    },
    update: {
      value: JSON.stringify(zones),
    },
  })

  return newZone
}

export async function getShippingZones(): Promise<ShippingZone[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'shipping_zones' },
  })

  if (!setting) {
    return []
  }

  try {
    return JSON.parse(setting.value)
  } catch {
    return []
  }
}

export async function updateShippingZone(zoneId: string, data: Partial<ShippingZone>) {
  const zones = await getShippingZones()
  const index = zones.findIndex((z) => z.id === zoneId)

  if (index === -1) {
    throw new Error('Shipping zone not found')
  }

  zones[index] = { ...zones[index], ...data }

  await prisma.siteSetting.upsert({
    where: { key: 'shipping_zones' },
    create: {
      key: 'shipping_zones',
      value: JSON.stringify(zones),
      type: 'json',
      group: 'shipping',
    },
    update: {
      value: JSON.stringify(zones),
    },
  })

  return zones[index]
}

export async function deleteShippingZone(zoneId: string) {
  const zones = await getShippingZones()
  const filtered = zones.filter((z) => z.id !== zoneId)

  await prisma.siteSetting.upsert({
    where: { key: 'shipping_zones' },
    create: {
      key: 'shipping_zones',
      value: JSON.stringify(filtered),
      type: 'json',
      group: 'shipping',
    },
    update: {
      value: JSON.stringify(filtered),
    },
  })
}

export async function createShippingProfile(data: Omit<ShippingProfile, 'id'>) {
  const profiles = await getShippingProfiles()
  const newProfile: ShippingProfile = {
    id: `profile-${Date.now()}`,
    ...data,
  }

  profiles.push(newProfile)

  await prisma.siteSetting.upsert({
    where: { key: 'shipping_profiles' },
    create: {
      key: 'shipping_profiles',
      value: JSON.stringify(profiles),
      type: 'json',
      group: 'shipping',
    },
    update: {
      value: JSON.stringify(profiles),
    },
  })

  return newProfile
}

export async function getShippingProfiles(): Promise<ShippingProfile[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'shipping_profiles' },
  })

  if (!setting) {
    return []
  }

  try {
    return JSON.parse(setting.value)
  } catch {
    return []
  }
}

export async function getShippingProfileForProduct(productId: string): Promise<ShippingProfile | null> {
  const profiles = await getShippingProfiles()

  // Find profile that matches this product
  for (const profile of profiles) {
    if (profile.productIds?.includes(productId)) {
      return profile
    }

    // Check if product is in any of the profile's collections
    if (profile.collectionIds && profile.collectionIds.length > 0) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          collections: true,
        },
      })

      if (product?.collections.some((c) => profile.collectionIds?.includes(c.collectionId))) {
        return profile
      }
    }
  }

  return null
}

export async function calculateShippingRate(data: {
  fromPostalCode: string
  toPostalCode: string
  toCountry: string
  toState?: string
  weight: {
    value: number
    units: string
  }
  dimensions?: {
    length: number
    width: number
    height: number
    units: string
  }
  value?: number
  items?: Array<{
    productId: string
    quantity: number
  }>
  zoneId?: string
  profileId?: string
}) {
  // Get shipping zones and profiles
  const zones = await getShippingZones()
  const profiles = await getShippingProfiles()

  // Determine which zone applies
  let applicableZone: ShippingZone | null = null

  if (data.zoneId) {
    applicableZone = zones.find((z) => z.id === data.zoneId) || null
  } else {
    // Find zone by location
    applicableZone =
      zones.find((zone) => {
        if (zone.countries.includes(data.toCountry)) {
          if (zone.states && data.toState && !zone.states.includes(data.toState)) {
            return false
          }
          if (zone.zipCodes && !zone.zipCodes.includes(data.toPostalCode)) {
            return false
          }
          return true
        }
        return false
      }) || null
  }

  // Get shipping profile if specified
  let profile: ShippingProfile | null = null
  if (data.profileId) {
    profile = profiles.find((p) => p.id === data.profileId) || null
  } else if (data.items && data.items.length > 0) {
    // Try to find profile for first product
    profile = await getShippingProfileForProduct(data.items[0].productId)
  }

  // Calculate rate based on zone rules
  let calculatedRate: number | null = null

  if (applicableZone && applicableZone.rateRules.length > 0) {
    // Determine which rule applies based on weight, price, or item count
    const totalWeight = data.weight.value
    const totalValue = data.value || 0
    const itemCount = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

    for (const rule of applicableZone.rateRules) {
      let matches = false

      switch (rule.type) {
        case 'weight':
          matches = totalWeight >= rule.min && (!rule.max || totalWeight <= rule.max)
          break
        case 'price':
          matches = totalValue >= rule.min && (!rule.max || totalValue <= rule.max)
          break
        case 'item_count':
          matches = itemCount >= rule.min && (!rule.max || itemCount <= rule.max)
          break
      }

      if (matches) {
        if (rule.freeShipping) {
          calculatedRate = 0
        } else {
          calculatedRate = rule.rate
        }
        break
      }
    }
  }

  // If we have a profile with default carrier/service, get real-time rates from ShipStation
  if (profile?.defaultCarrier && profile.defaultService) {
    try {
      const client = getShipStationClient()
      const rates = await client.getRates({
        carrierCode: profile.defaultCarrier,
        serviceCode: profile.defaultService,
        packageCode: 'package',
        fromPostalCode: data.fromPostalCode,
        toState: data.toState || '',
        toCountry: data.toCountry,
        toPostalCode: data.toPostalCode,
        weight: data.weight,
        dimensions: data.dimensions,
      })

      // Return ShipStation rates
      return {
        rates: rates.rates || [],
        zone: applicableZone,
        profile,
        calculatedRate,
      }
    } catch (error) {
      // Fall back to calculated rate
    }
  }

  // Return calculated rate or flat rate
  return {
    rates: calculatedRate !== null ? [{ rate: calculatedRate, service: 'Standard' }] : [],
    zone: applicableZone,
    profile,
    calculatedRate,
  }
}

export async function getFreeShippingThreshold() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'free_shipping_threshold' },
  })

  return setting ? parseFloat(setting.value) : null
}

export async function setFreeShippingThreshold(amount: number) {
  await prisma.siteSetting.upsert({
    where: { key: 'free_shipping_threshold' },
    create: {
      key: 'free_shipping_threshold',
      value: amount.toString(),
      type: 'number',
      group: 'shipping',
    },
    update: {
      value: amount.toString(),
    },
  })
}



