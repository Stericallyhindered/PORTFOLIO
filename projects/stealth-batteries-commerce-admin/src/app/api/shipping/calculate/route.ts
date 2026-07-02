import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/getPayload'
import { getRatesFromCarrier, type ShippingMethod } from '@/lib/shipping/carrier-rates'
import { getDeliveryEstimate } from '@/lib/shipping/delivery-dates'
import { getActiveShippingConfig } from '@/lib/shipping/config'
import type { Dealer, DiscountTier, DiscountCode } from '@/payload-types'

// Increase the default timeout to 60 seconds
export const maxDuration = 60

// Configure CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

type CustomShipping = {
  price: number
  label: string
  source: 'dealer' | 'discountTier' | 'discountCode'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { items, destination, subtotal, dealerId, discountCode } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400, headers: corsHeaders })
    }

    if (
      !destination ||
      !destination.address ||
      !destination.city ||
      !destination.state ||
      !destination.postalCode
    ) {
      return NextResponse.json(
        { error: 'Invalid destination address' },
        { status: 400, headers: corsHeaders },
      )
    }

    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

    // Dealers now always get UPS shipping options (no shipping config)
    if (dealerId) {
      console.log('Dealer detected, skipping shipping config and showing UPS options')
      // Proceed to UPS rates logic below
    }

    // 2. Non-dealers with large orders get a special shipping method with a message
    if (!dealerId && totalQuantity > 50) {
      return NextResponse.json(
        {
          methods: [
            {
              id: 'bulk-contact',
              name: 'Bulk Order Shipping',
              description:
                'Stealth Batteries will contact you for separate shipping costs on bulk orders.',
              price: 0,
              estimatedDays: '',
              carrier: null,
              service: null,
              guaranteedDelivery: false,
            },
          ],
        },
        { headers: corsHeaders },
      )
    }

    // For all orders (dealers and non-dealers), get the initialized Payload client
    const payload = await getPayloadClient()

    // Fetch full product details for all items
    const productIds = Array.from(new Set(items.map((item) => item.id)))

    const products = await Promise.all(
      productIds.map(async (id) => {
        try {
          // Try numeric ID first
          const numericId = typeof id === 'number' ? id : parseInt(id, 10)
          const product = await payload.findByID({
            collection: 'products',
            id: numericId,
          })

          return product
        } catch (error) {
          console.error('Error finding product:', { id, error })
          return null
        }
      }),
    )

    // Convert items to CartItems with shipping details
    const cartItems = items
      .map((item) => {
        // Try to find product by both string and number ID
        const itemId = typeof item.id === 'number' ? item.id : parseInt(item.id, 10)
        const product = products.find((p) => p && (p.id === itemId || p.id === item.id))

        if (!product) {
          return null
        }

        return {
          id: item.id,
          quantity: item.quantity,
          dimensions: {
            length: product.shippingDetails?.length ?? 12, // Use nullish coalescing for optional fields
            width: product.shippingDetails?.width ?? 12,
            height: product.shippingDetails?.height ?? 12,
          },
          weight: product.shippingDetails?.weight ?? 1, // Default to 1 lb if no weight
          isHazmat: product.shippingDetails?.hazmat ?? false,
          requiresLTL: false, // Each item will be shipped individually, so no LTL needed unless individual item is too large
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    // --- Custom Shipping Logic for Dealers and Discount Codes ---
    let dealer: Dealer | null = null
    let discountTier: DiscountTier | null = null
    let discountCodeDoc: DiscountCode | null = null
    if (dealerId) {
      try {
        dealer = (await payload.findByID({ collection: 'dealers', id: dealerId })) as Dealer
        console.log(
          '[DEBUG] Dealer loaded:',
          JSON.stringify({
            id: dealer.id,
            customShipping: dealer.customShipping,
            discountTier: dealer.discountTier,
          }),
        )
        // dealer.discountTier can be a number or DiscountTier
        if (dealer?.discountTier && typeof dealer.discountTier === 'object') {
          discountTier = dealer.discountTier as DiscountTier
        } else if (dealer?.discountTier && typeof dealer.discountTier === 'number') {
          discountTier = (await payload.findByID({
            collection: 'discount-tiers',
            id: dealer.discountTier,
          })) as DiscountTier
        }
        if (discountTier) {
          console.log(
            '[DEBUG] Discount tier loaded:',
            JSON.stringify({ id: discountTier.id, customShipping: discountTier.customShipping }),
          )
        } else {
          console.log('[DEBUG] No discount tier for dealer')
        }
      } catch (err) {
        console.error('[DEBUG] Error fetching dealer or discount tier:', err)
      }
    }
    if (discountCode) {
      try {
        const found = await payload.find({
          collection: 'discount-codes',
          where: { code: { equals: discountCode } },
        })
        if (found?.docs?.length) {
          discountCodeDoc = found.docs[0]
          console.log(
            '[DEBUG] Discount code loaded:',
            JSON.stringify({
              code: discountCodeDoc.code,
              customShipping: discountCodeDoc.customShipping,
            }),
          )
        } else {
          console.log('[DEBUG] Discount code not found:', discountCode)
        }
      } catch (err) {
        console.error('[DEBUG] Error fetching discount code:', err)
      }
    }

    // Check for free/custom shipping in priority order
    let customShipping: CustomShipping | null = null
    if (dealer?.customShipping?.hasFreeShipping) {
      customShipping = { price: 0, label: 'Free Shipping', source: 'dealer' }
      console.log('[DEBUG] Dealer has free shipping')
    } else if (
      typeof dealer?.customShipping?.customPrice === 'number' &&
      !isNaN(dealer.customShipping.customPrice)
    ) {
      customShipping = {
        price: dealer.customShipping.customPrice,
        label: 'Custom Shipping',
        source: 'dealer',
      }
      console.log('[DEBUG] Dealer has custom shipping price')
    } else if (discountTier?.customShipping?.hasFreeShipping) {
      customShipping = { price: 0, label: 'Free Shipping', source: 'discountTier' }
      console.log('[DEBUG] Discount tier has free shipping')
    } else if (
      typeof discountTier?.customShipping?.customPrice === 'number' &&
      !isNaN(discountTier.customShipping.customPrice)
    ) {
      customShipping = {
        price: discountTier.customShipping.customPrice,
        label: 'Custom Shipping',
        source: 'discountTier',
      }
      console.log('[DEBUG] Discount tier has custom shipping price')
    }

    // Discount code custom shipping applies to all orders (overrides UPS if present)
    if (!customShipping && discountCodeDoc?.customShipping?.hasFreeShipping) {
      customShipping = { price: 0, label: 'Free Shipping', source: 'discountCode' }
      console.log('[DEBUG] Discount code grants free shipping')
    } else if (
      !customShipping &&
      typeof discountCodeDoc?.customShipping?.customPrice === 'number' &&
      !isNaN(discountCodeDoc.customShipping.customPrice)
    ) {
      customShipping = {
        price: discountCodeDoc.customShipping.customPrice,
        label: 'Custom Shipping',
        source: 'discountCode',
      }
      console.log('[DEBUG] Discount code grants custom shipping price')
    }

    if (customShipping) {
      console.log('[DEBUG] Returning custom shipping:', customShipping)
      return NextResponse.json(
        {
          methods: [
            {
              id: customShipping.price === 0 ? 'free_shipping' : 'custom_shipping',
              name: customShipping.label,
              description:
                customShipping.source === 'dealer'
                  ? 'Special shipping for this dealer'
                  : customShipping.source === 'discountTier'
                    ? 'Special shipping for this discount tier'
                    : 'Special shipping for this discount code',
              price: customShipping.price,
              estimatedDays: '5-7',
              carrier: null,
              service: null,
              deliveryDays: 7,
              guaranteedDelivery: false,
              badges: [
                {
                  type: customShipping.price === 0 ? 'best-value' : 'custom',
                  label: customShipping.label,
                  color: customShipping.price === 0 ? 'emerald' : 'blue',
                },
              ],
            },
          ],
        },
        { headers: corsHeaders },
      )
    }

    // Get real-time rates from UPS
    try {
      const methods = await getRatesFromCarrier({
        destination,
        items: cartItems,
      })

      if (methods.length === 0) {
        return NextResponse.json(
          { error: 'No shipping methods available' },
          { status: 400, headers: corsHeaders },
        )
      }

      // Add delivery estimates to each method and sort by price
      const orderDate = new Date()
      const methodsWithDates = methods
        .map((method) => ({
          ...method,
          description: getDeliveryEstimate(
            method.deliveryDays ?? null,
            method.guaranteedDelivery ?? false,
            orderDate,
          ),
        }))
        .sort((a, b) => a.price - b.price) // Sort by price, lowest first

      return NextResponse.json({ methods: methodsWithDates }, { headers: corsHeaders })
    } catch (error) {
      console.error('Error getting UPS rates:', error)
      return NextResponse.json(
        { error: 'Failed to get shipping rates' },
        { status: 500, headers: corsHeaders },
      )
    }
  } catch (error) {
    console.error('Error processing shipping calculation request:', error)
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400, headers: corsHeaders },
    )
  }
}
