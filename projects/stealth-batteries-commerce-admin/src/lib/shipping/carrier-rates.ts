import type { ShippingCarrier } from '@/payload-types'
import { getRates } from './services/ups'
import { getLTLRates } from './services/ltl'
import { UPSServiceCodes, AIR_SERVICES } from './constants/ups'

interface Destination {
  address: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface Dimensions {
  length: number
  width: number
  height: number
}

interface CartItem {
  id: string
  quantity: number
  dimensions: Dimensions
  weight: number
  isHazmat?: boolean
  requiresLTL?: boolean
}

interface RateRequest {
  carrier: ShippingCarrier
  destination: Destination
  items: CartItem[]
}

export interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  carrier: string | null
  service: string | null
  deliveryDays?: number | null
  guaranteedDelivery?: boolean
  currency?: string
  totalWeight?: number | null
  billableWeight?: number | null
  rateType?: string | null
  negotiatedRate?: boolean | null
  taxCharges?: number | null
  totalWithTax?: number | null
  hazmatRestricted?: boolean
  badges?: {
    type: 'best-value' | 'fastest' | 'recommended' | 'economy'
    label: string
    color: string
  }[]
}

interface GetRatesParams {
  destination: {
    address: string
    city: string
    state: string
    postalCode: string
    country?: string
  }
  items: CartItem[]
}

// Constants
const HAZMAT_FEE = 0 // $35 hazmat handling fee
const MAX_ITEMS_PER_PACKAGE = 25 // Maximum number of similar items to group in one package
const MAX_PACKAGE_WEIGHT = 150 // Maximum weight per package in pounds
const UPS_MAX_PACKAGES = 50 // UPS API limit for packages per request

// Flat rate fallback options for large orders
const LARGE_ORDER_FLAT_RATES = [
  {
    id: 'flat_ground',
    name: 'UPS Ground (Large Order)',
    description: '5-7 business days - Flat rate for large orders',
    price: 199.0, // Flat rate for large ground shipments
    estimatedDays: '5-7',
    deliveryDays: 6,
    service: '03',
    guaranteedDelivery: false,
  },
  {
    id: 'flat_3day',
    name: 'UPS 3 Day Select (Large Order)',
    description: '3 business days - Flat rate for large orders',
    price: 299.0, // Flat rate for expedited large shipments
    estimatedDays: '3',
    deliveryDays: 3,
    service: '12',
    guaranteedDelivery: true,
  },
  {
    id: 'flat_2day',
    name: 'UPS 2nd Day Air (Large Order)',
    description: '2 business days - Flat rate for large orders',
    price: 399.0, // Flat rate for fast large shipments
    estimatedDays: '2',
    deliveryDays: 2,
    service: '02',
    guaranteedDelivery: true,
  },
]

// Helper function to calculate dimensional weight
function calculateDimensionalWeight(dimensions: Dimensions): number {
  // UPS dimensional weight divisor is 139 for daily rates
  const dimensionalDivisor = 139
  return Math.ceil((dimensions.length * dimensions.width * dimensions.height) / dimensionalDivisor)
}

// Improved package consolidation function
function createPackagesFromItems(items: CartItem[]): Array<{
  dimensions: Dimensions
  weight: number
  isHazmat: boolean
  itemCount: number
}> {
  const packages: Array<{
    dimensions: Dimensions
    weight: number
    isHazmat: boolean
    itemCount: number
  }> = []

  console.log('🚛 Creating packages from items:', {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    uniqueProducts: items.length,
  })

  // Separate items that require individual packaging from those that can be consolidated
  const individualPackagingItems: CartItem[] = []
  const consolidatableItems: CartItem[] = []

  items.forEach((item) => {
    // Items that must be packaged individually:
    // 1. Hazmat items (lithium batteries)
    // 2. Items with requiresLTL flag
    // 3. Items over certain weight threshold that are unsafe to combine
    const requiresIndividualPackaging = item.isHazmat || item.requiresLTL || item.weight > 50 // Heavy items (50+ lbs) get individual packaging

    if (requiresIndividualPackaging) {
      individualPackagingItems.push(item)
      console.log(`⚠️ Item requires individual packaging:`, {
        id: item.id,
        reason: item.isHazmat ? 'Hazmat' : item.requiresLTL ? 'LTL' : 'Heavy item',
        weight: item.weight,
        quantity: item.quantity,
      })
    } else {
      consolidatableItems.push(item)
    }
  })

  console.log('📋 Package categorization:', {
    individualPackagingItems: individualPackagingItems.length,
    consolidatableItems: consolidatableItems.length,
    totalIndividualPackages: individualPackagingItems.reduce((sum, item) => sum + item.quantity, 0),
  })

  // Process items that require individual packaging
  individualPackagingItems.forEach((item) => {
    // Each unit gets its own package
    for (let i = 0; i < item.quantity; i++) {
      packages.push({
        dimensions: item.dimensions,
        weight: item.weight,
        isHazmat: item.isHazmat || false,
        itemCount: 1,
      })
    }
  })

  // Process items that can be consolidated
  if (consolidatableItems.length > 0) {
    console.log('📦 Processing consolidatable items:', consolidatableItems.length)

    // Group consolidatable items by dimensions for better consolidation
    const itemGroups = new Map<string, CartItem[]>()

    consolidatableItems.forEach((item) => {
      const key = `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}`
      if (!itemGroups.has(key)) {
        itemGroups.set(key, [])
      }
      itemGroups.get(key)!.push(item)
    })

    console.log('📦 Consolidatable item groups:', itemGroups.size)

    // Process each group
    itemGroups.forEach((groupItems, groupKey) => {
      console.log(`📋 Processing consolidatable group ${groupKey}:`, {
        items: groupItems.length,
        totalQuantity: groupItems.reduce((sum, item) => sum + item.quantity, 0),
      })

      groupItems.forEach((item) => {
        let remainingQuantity = item.quantity

        while (remainingQuantity > 0) {
          // Calculate how many items can fit in one package
          const itemsPerPackage = Math.min(
            MAX_ITEMS_PER_PACKAGE,
            Math.floor(MAX_PACKAGE_WEIGHT / item.weight),
            remainingQuantity,
          )

          if (itemsPerPackage <= 0) {
            // Item is too heavy for consolidation, create individual packages
            console.log(`⚠️ Item too heavy for consolidation:`, {
              id: item.id,
              weight: item.weight,
              maxWeight: MAX_PACKAGE_WEIGHT,
            })
            packages.push({
              dimensions: item.dimensions,
              weight: item.weight,
              isHazmat: item.isHazmat || false,
              itemCount: 1,
            })
            remainingQuantity -= 1
          } else {
            // Create consolidated package
            packages.push({
              dimensions: item.dimensions,
              weight: item.weight * itemsPerPackage,
              isHazmat: item.isHazmat || false,
              itemCount: itemsPerPackage,
            })
            remainingQuantity -= itemsPerPackage
          }
        }
      })
    })
  }

  console.log('📫 Package consolidation result:', {
    totalPackages: packages.length,
    individualPackages: individualPackagingItems.reduce((sum, item) => sum + item.quantity, 0),
    consolidatedPackages:
      packages.length - individualPackagingItems.reduce((sum, item) => sum + item.quantity, 0),
    exceedsLimit: packages.length > UPS_MAX_PACKAGES,
    averageItemsPerPackage: packages.reduce((sum, pkg) => sum + pkg.itemCount, 0) / packages.length,
    breakdown: {
      hazmatPackages: packages.filter((pkg) => pkg.isHazmat).length,
      nonHazmatPackages: packages.filter((pkg) => !pkg.isHazmat).length,
    },
  })

  return packages
}

// Helper function to create flat rate shipping methods for large orders
function createFlatRateShippingMethods(totalWeight: number, hasHazmat: boolean): ShippingMethod[] {
  console.log('🚚 Creating flat rate shipping methods for large order:', {
    totalWeight,
    hasHazmat,
    note: hasHazmat
      ? 'Contains lithium batteries - air services excluded'
      : 'No hazmat restrictions',
  })

  return LARGE_ORDER_FLAT_RATES.filter((rate) => {
    // Don't offer air services for hazmat items (lithium batteries)
    const isAirService = ['02', '12'].includes(rate.service)
    if (hasHazmat && isAirService) {
      console.log(`🚫 Excluding air service ${rate.name} due to lithium batteries`)
      return false
    }
    return true
  }).map((rate) => {
    const hazmatFee = hasHazmat ? HAZMAT_FEE : 0
    const totalPrice = rate.price + hazmatFee

    // Enhanced description for hazmat items
    let description = rate.description
    if (hasHazmat) {
      description += ' - Contains lithium batteries'
      if (hazmatFee > 0) {
        description += ` + $${hazmatFee} Hazmat Fee`
      }
    }

    return {
      id: rate.id,
      name: rate.name,
      description,
      price: totalPrice,
      estimatedDays: rate.estimatedDays,
      carrier: 'UPS',
      service: rate.service,
      deliveryDays: rate.deliveryDays,
      guaranteedDelivery: rate.guaranteedDelivery,
      currency: 'USD',
      totalWeight,
      billableWeight: totalWeight,
      rateType: 'FLAT_RATE_LARGE_ORDER',
      negotiatedRate: true,
      hazmatRestricted: hasHazmat,
      badges: [
        {
          type: 'recommended',
          label: hasHazmat ? 'Large Order (Lithium)' : 'Large Order',
          color: hasHazmat ? 'amber' : 'purple',
        },
      ],
    }
  })
}

// Helper function to calculate badges for shipping methods
function calculateBadges(methods: ShippingMethod[]): ShippingMethod[] {
  if (!methods.length) return methods

  // Find the lowest and highest prices
  const lowestPrice = Math.min(...methods.map((m) => m.price))
  const highestPrice = Math.max(...methods.map((m) => m.price))

  // Find the fastest delivery time (excluding null/undefined)
  const validDeliveryDays = methods
    .map((m) => m.deliveryDays)
    .filter((days): days is number => days !== null && days !== undefined)
  const fastestDelivery = validDeliveryDays.length ? Math.min(...validDeliveryDays) : null

  // Find the best value option (balance of speed and cost)
  const methodScores = methods.map((method) => {
    if (!method.deliveryDays) return { method, score: -1 }
    // Lower score is better
    const priceScore = (method.price - lowestPrice) / (highestPrice - lowestPrice)
    const speedScore = method.deliveryDays / (Math.max(...validDeliveryDays) || 1)
    return {
      method,
      score: priceScore * 0.6 + speedScore * 0.4, // Weight price more than speed
    }
  })

  // Sort by score and get the best option
  const bestValueMethod = methodScores
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score)[0]?.method

  return methods.map((method) => {
    const badges: ShippingMethod['badges'] = method.badges || []

    // Don't override existing badges (like "Large Order")
    if (badges.length === 0) {
      // Best Value Badge (only one method gets this)
      if (method === bestValueMethod) {
        badges.push({
          type: 'best-value',
          label: 'Best Value',
          color: 'emerald',
        })
      }

      // Fastest Delivery Badge
      if (fastestDelivery && method.deliveryDays === fastestDelivery) {
        badges.push({
          type: 'fastest',
          label: 'Fastest',
          color: 'blue',
        })
      }

      // Economy Badge (lowest price)
      if (method.price === lowestPrice) {
        badges.push({
          type: 'economy',
          label: 'Economy',
          color: 'gray',
        })
      }
    }

    return {
      ...method,
      badges,
    }
  })
}

export async function getRatesFromCarrier(params: GetRatesParams): Promise<ShippingMethod[]> {
  try {
    // Check if any item requires LTL
    const requiresLTL = params.items.some((item) => item.requiresLTL)

    // If LTL is required, only return LTL rates
    if (requiresLTL) {
      return getLTLRates(params)
    }

    // Validate items
    if (!params.items.length) {
      throw new Error('No items provided')
    }

    // Calculate total weight and check for hazmat
    const totalWeight = params.items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
    const hasHazmat = params.items.some((item) => item.isHazmat)
    const totalItemCount = params.items.reduce((sum, item) => sum + item.quantity, 0)

    console.log('🚛 Processing shipping calculation:', {
      totalItemCount,
      totalWeight,
      hasHazmat,
      uniqueProducts: params.items.length,
    })

    // Validate UPS credentials
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
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }

    // Create packages from items with improved consolidation
    const packages = createPackagesFromItems(params.items)

    // Check if we exceed UPS package limit
    if (packages.length > UPS_MAX_PACKAGES) {
      console.log('⚠️ Package count exceeds UPS limit, using flat rate fallback:', {
        packageCount: packages.length,
        limit: UPS_MAX_PACKAGES,
        totalWeight,
        hasHazmat,
      })

      // Return flat rate options for large orders
      const flatRateMethods = createFlatRateShippingMethods(totalWeight, hasHazmat)
      return calculateBadges(flatRateMethods)
    }

    // Proceed with normal UPS rate calculation
    console.log('✅ Package count within UPS limits, proceeding with API call:', {
      packageCount: packages.length,
      totalWeight,
    })

    // Get UPS rates
    const upsRates = await getRates({
      credentials: {
        client_id: process.env.UPS_CLIENT_ID!,
        client_secret: process.env.UPS_CLIENT_SECRET!,
        account_number: process.env.UPS_ACCOUNT_NUMBER!,
        environment: (process.env.UPS_ENVIRONMENT || 'test') as 'test' | 'production',
      },
      origin: {
        address: process.env.SHIPPING_ORIGIN_ADDRESS!,
        city: process.env.SHIPPING_ORIGIN_CITY!,
        state: process.env.SHIPPING_ORIGIN_STATE!,
        postalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE!,
        country: 'US',
      },
      destination: {
        ...params.destination,
        country: params.destination.country || 'US',
      },
      packages: packages.map((pkg) => ({
        weight: pkg.weight,
        weight_unit: 'LBS',
        dimensions: {
          length: pkg.dimensions.length,
          width: pkg.dimensions.width,
          height: pkg.dimensions.height,
          unit: 'IN',
        },
        packaging_type: '02', // Customer supplied packaging
        is_hazmat: pkg.isHazmat,
      })),
    })

    console.log('📊 UPS rates received:', {
      rateCount: upsRates.length,
      services: upsRates.map((rate) => `${rate.service_code}: $${rate.total_charge}`),
    })

    // Process UPS rates normally
    const methods = upsRates
      .map((rate) => {
        // Don't allow air services for hazmat items
        if (hasHazmat && AIR_SERVICES.has(rate.service_code)) {
          return null
        }

        const basePrice = Number(rate.total_charge)
        const hazmatFee = hasHazmat ? HAZMAT_FEE : 0
        const totalPrice = basePrice + hazmatFee

        return {
          id: `ups_${rate.service_code}`,
          name: rate.service_name,
          description: `${rate.delivery_days ? `${rate.delivery_days} days - ` : ''}${rate.service_name}${
            hasHazmat ? ' + Hazmat Fee' : ''
          }`,
          price: totalPrice,
          estimatedDays: rate.delivery_days?.toString() || 'Unknown',
          carrier: 'UPS' as const,
          service: rate.service_code,
          deliveryDays: rate.delivery_days,
          guaranteedDelivery: rate.guaranteed_delivery ?? false,
          currency: rate.currency,
          totalWeight: rate.total_weight,
          billableWeight: rate.billable_weight,
          rateType: rate.rate_type,
          negotiatedRate: rate.negotiated_rate,
          taxCharges: rate.tax_charges,
          totalWithTax: rate.total_with_tax ? Number(rate.total_with_tax) + hazmatFee : totalPrice,
          hazmatRestricted: hasHazmat && AIR_SERVICES.has(rate.service_code),
        }
      })
      .filter(Boolean) as ShippingMethod[]

    const finalMethods = calculateBadges(methods)

    console.log('🎯 Final shipping methods:', {
      methodCount: finalMethods.length,
      priceRange:
        finalMethods.length > 0
          ? `$${Math.min(...finalMethods.map((m) => m.price))}-$${Math.max(...finalMethods.map((m) => m.price))}`
          : 'N/A',
    })

    return finalMethods
  } catch (error) {
    console.error('❌ Error getting carrier rates:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // If UPS fails entirely, provide emergency flat rate fallback
    const totalWeight = params.items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
    const hasHazmat = params.items.some((item) => item.isHazmat)

    console.log('🚨 UPS API failed, providing emergency flat rate options')

    const emergencyRates = createFlatRateShippingMethods(totalWeight, hasHazmat).map((method) => ({
      ...method,
      name: `${method.name} (Emergency Rate)`,
      description: `${method.description} - UPS API unavailable`,
      badges: [
        {
          type: 'recommended' as const,
          label: 'Emergency Rate',
          color: 'orange',
        },
      ],
    }))

    return emergencyRates
  }
}
