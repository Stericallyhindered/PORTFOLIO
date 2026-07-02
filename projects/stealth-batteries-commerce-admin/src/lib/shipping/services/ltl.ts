import type { ShippingMethod } from '../carrier-rates'

interface LTLRateParams {
  destination: {
    address: string
    city: string
    state: string
    postalCode: string
    country?: string
  }
  items: {
    id: string
    quantity: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    weight: number
    isHazmat?: boolean
    requiresLTL?: boolean
  }[]
}

// Calculate LTL shipping rates based on weight, dimensions, and distance
export async function getLTLRates(params: LTLRateParams): Promise<ShippingMethod[]> {
  const totalWeight = params.items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
  const hasHazmat = params.items.some((item) => item.isHazmat)

  // Base rate calculation
  let baseRate = 0

  // Weight-based pricing
  if (totalWeight <= 500) {
    baseRate = 299.99 // Base rate for shipments up to 500 lbs
  } else if (totalWeight <= 1000) {
    baseRate = 399.99 // Base rate for shipments up to 1000 lbs
  } else {
    baseRate = 499.99 // Base rate for shipments over 1000 lbs
  }

  // Hazmat fee if applicable
  const hazmatFee = hasHazmat ? 75 : 0

  // Calculate total price
  const totalPrice = baseRate + hazmatFee

  return [
    {
      id: 'ltl-standard',
      name: 'LTL Standard',
      description: 'Less Than Truckload shipping for large or heavy items',
      price: totalPrice,
      estimatedDays: '3-7',
      carrier: 'LTL',
      service: 'Standard',
      deliveryDays: 5,
      guaranteedDelivery: false,
      currency: 'USD',
      totalWeight,
      billableWeight: totalWeight,
      rateType: 'LTL',
      negotiatedRate: false,
      taxCharges: 0,
      totalWithTax: totalPrice,
      hazmatRestricted: false,
      badges: [
        {
          type: 'recommended',
          label: 'Recommended',
          color: 'emerald',
        },
      ],
    },
    {
      id: 'ltl-expedited',
      name: 'LTL Expedited',
      description: 'Faster LTL shipping with priority handling',
      price: totalPrice * 1.5, // 50% markup for expedited service
      estimatedDays: '2-4',
      carrier: 'LTL',
      service: 'Expedited',
      deliveryDays: 3,
      guaranteedDelivery: true,
      currency: 'USD',
      totalWeight,
      billableWeight: totalWeight,
      rateType: 'LTL',
      negotiatedRate: false,
      taxCharges: 0,
      totalWithTax: totalPrice * 1.5,
      hazmatRestricted: false,
      badges: [
        {
          type: 'fastest',
          label: 'Fastest',
          color: 'blue',
        },
      ],
    },
  ]
}
