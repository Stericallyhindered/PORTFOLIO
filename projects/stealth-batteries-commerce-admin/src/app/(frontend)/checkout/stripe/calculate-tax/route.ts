import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // @ts-expect-error - We know this works with the newer API version
  apiVersion: '2022-11-15', // Match the version used in your Stripe plugin
})

// Fallback Arizona tax rate (7.8%)
const ARIZONA_TAX_RATE = 0.078

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, billingDetails, shipping, discounts } = body

    if (!items?.length || !billingDetails) {
      return NextResponse.json({ error: 'Missing required tax calculation data' }, { status: 400 })
    }

    // Calculate base amount before tax using original prices
    const subtotal = items.reduce((sum: number, item: any) => {
      const lineTotal = Math.floor(item.price * item.quantity * 100) / 100
      return Math.floor((sum + lineTotal) * 100) / 100
    }, 0)

    // Apply discounts to get discounted subtotal
    let discountedSubtotal = subtotal
    let totalPercentageDiscount = 0

    // Sum up all percentage-based discounts
    if (discounts?.dealer) {
      totalPercentageDiscount += discounts.dealer.percentage

      // Add volume discount if applicable
      if (discounts.dealer.volumeDiscountApplied) {
        totalPercentageDiscount += discounts.dealer.volumeDiscountPercentage
      }
    }

    if (discounts?.affiliate) {
      totalPercentageDiscount += discounts.affiliate.percentage
    }

    if (discounts?.discountCode && discounts.discountCode.type === 'percentage') {
      totalPercentageDiscount += discounts.discountCode.amount
    }

    // Apply total percentage discount
    if (totalPercentageDiscount > 0) {
      // Cap total percentage discount at 100%
      totalPercentageDiscount = Math.min(totalPercentageDiscount, 100)
      discountedSubtotal *= 1 - totalPercentageDiscount / 100
    }

    // Apply any fixed amount discounts last
    if (discounts?.discountCode && discounts.discountCode.type === 'fixed') {
      discountedSubtotal = Math.max(0, discountedSubtotal - discounts.discountCode.amount)
    }

    // Calculate discounted price per item while maintaining proportions
    const discountRatio = discountedSubtotal / subtotal
    const discountedItems = items.map((item: any) => {
      const discountedPrice = Math.floor(item.price * discountRatio * 100) / 100
      return {
        ...item,
        price: discountedPrice,
      }
    })

    try {
      // Try to use Stripe Tax first with discounted prices
      const calculation = await (stripe as any).tax.calculations.create({
        currency: 'usd',
        line_items: discountedItems.map((item: any) => ({
          amount: Math.round(item.price * 100), // Convert discounted price to cents
          quantity: item.quantity,
          reference: item.id.toString(),
          tax_code: 'txcd_99999999', // General default tax code for tangible personal property
        })),
        customer_details: {
          address: {
            line1: billingDetails.address,
            line2: billingDetails.address2 || null,
            city: billingDetails.city,
            state: billingDetails.state,
            postal_code: billingDetails.postalCode,
            country: 'US',
          },
          address_source: 'billing',
        },
        shipping_cost: shipping
          ? {
              amount: Math.round(shipping * 100),
              tax_code: 'txcd_92010001', // Shipping tax code
            }
          : undefined,
      })

      // Convert tax amount from cents to dollars
      const tax = Number((calculation.tax_amount_exclusive / 100).toFixed(2))

      return NextResponse.json({
        tax,
        source: 'stripe',
        debug: {
          originalSubtotal: subtotal,
          discountedSubtotal,
          discountRatio,
          shipping,
        },
      })
    } catch (stripeError) {
      console.error('Stripe Tax error:', stripeError)

      // Calculate tax on discounted total and shipping
      const taxableAmount = discountedSubtotal + (shipping || 0)
      const tax = Number((Math.round(taxableAmount * ARIZONA_TAX_RATE * 100) / 100).toFixed(2))

      return NextResponse.json({
        tax,
        source: 'arizona',
        debug: {
          originalSubtotal: subtotal,
          discountedSubtotal,
          discountRatio,
          shipping,
          taxableAmount,
        },
      })
    }
  } catch (error) {
    console.error('Tax calculation error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while calculating tax' },
      { status: 500 },
    )
  }
}
