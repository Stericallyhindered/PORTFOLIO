import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
} as unknown as Stripe.StripeConfig)

// Fallback Arizona tax rate (7.8%)
const ARIZONA_TAX_RATE = 0.078

// Helper function to calculate tax
async function calculateTax(
  items: Array<{ id: string; price: number; quantity: number }>,
  billingDetails: {
    address: string
    address2?: string
    city: string
    state: string
    postalCode: string
  },
  shipping: number,
  discounts?: any, // Add discounts parameter
) {
  try {
    // Calculate base amount before tax
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = Math.floor(item.price * item.quantity * 100) / 100
      return Math.floor((sum + lineTotal) * 100) / 100
    }, 0)

    // Apply discounts if any
    let discountedSubtotal = subtotal
    if (discounts) {
      if (discounts.dealer) {
        discountedSubtotal *= 1 - discounts.dealer.percentage / 100
      }
      if (discounts.affiliate) {
        discountedSubtotal *= 1 - discounts.affiliate.percentage / 100
      }
      if (discounts.discountCode) {
        if (discounts.discountCode.type === 'percentage') {
          discountedSubtotal *= 1 - discounts.discountCode.amount / 100
        } else {
          discountedSubtotal = Math.max(0, discountedSubtotal - discounts.discountCode.amount)
        }
      }
    }

    try {
      // Try to use Stripe Tax first
      const calculation = await (stripe as any).tax.calculations.create({
        currency: 'usd',
        line_items: items.map((item) => ({
          amount: Math.round(item.price * 100), // Convert to cents
          quantity: item.quantity,
          reference: item.id.toString(),
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
        shipping_cost: {
          amount: Math.round(shipping * 100), // Convert to cents
        },
      })

      return Number((calculation.tax_amount_exclusive / 100).toFixed(2))
    } catch (stripeError) {
      // Log the specific Stripe error for debugging

      // Calculate tax on discounted subtotal and shipping
      const taxableAmount = discountedSubtotal + shipping
      return Number((taxableAmount * ARIZONA_TAX_RATE).toFixed(2))
    }
  } catch (error) {
    console.error('Error calculating tax:', error)
    throw new Error('Failed to calculate tax')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { amount, paymentMethodId, billingDetails, shippingDetails, items } = body

    // Initialize Payload
    const payload = await getPayload({ config })

    // Check if the current user is a dealer (regardless of discount usage)
    let currentDealerId: number | null = null
    try {
      // Extract token from cookies
      const cookieHeader = request.headers.get('cookie')
      const token = cookieHeader
        ?.split('; ')
        .find((row) => row.startsWith('payload-token='))
        ?.split('=')[1]

      if (token) {
        // Try to get dealer info using the token
        const dealerResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (dealerResponse.ok) {
          const dealerData = await dealerResponse.json()
          if (dealerData.user?.id && dealerData.user?.verified) {
            currentDealerId = Number(dealerData.user.id)
          }
        }
      }
    } catch (error) {
      // Continue without dealer association - this is not a critical error
    }

    // Check if customer already exists
    const existingCustomers = await payload.find({
      collection: 'customers',
      where: {
        email: {
          equals: billingDetails.email,
        },
      },
    })

    let payloadCustomer
    let stripeCustomer

    if (existingCustomers.docs.length > 0) {
      const existingCustomer = existingCustomers.docs[0]

      // Update existing customer in Payload
      payloadCustomer = await payload.update({
        collection: 'customers',
        id: existingCustomer.id,
        data: {
          name: `${billingDetails.firstName} ${billingDetails.lastName}`,
          firstName: billingDetails.firstName,
          lastName: billingDetails.lastName,
          phone: billingDetails.phone,
          shippingAddresses: [
            {
              name: shippingDetails
                ? `${shippingDetails.firstName} ${shippingDetails.lastName}`
                : `${billingDetails.firstName} ${billingDetails.lastName}`,
              firstName: shippingDetails ? shippingDetails.firstName : billingDetails.firstName,
              lastName: shippingDetails ? shippingDetails.lastName : billingDetails.lastName,
              line1: shippingDetails ? shippingDetails.address : billingDetails.address,
              line2: shippingDetails
                ? shippingDetails.address2
                : billingDetails.address2 || undefined,
              city: shippingDetails ? shippingDetails.city : billingDetails.city,
              state: shippingDetails ? shippingDetails.state : billingDetails.state,
              postalCode: shippingDetails ? shippingDetails.postalCode : billingDetails.postalCode,
              country: 'US',
              isDefault: true,
            },
          ],
          billingAddresses: [
            {
              name: `${billingDetails.firstName} ${billingDetails.lastName}`,
              firstName: billingDetails.firstName,
              lastName: billingDetails.lastName,
              line1: billingDetails.address,
              line2: billingDetails.address2 || undefined,
              city: billingDetails.city,
              state: billingDetails.state,
              postalCode: billingDetails.postalCode,
              country: 'US',
              isDefault: true,
            },
          ],
        },
      })

      if (existingCustomer.stripeCustomerId) {
        // Use existing Stripe customer
        stripeCustomer = await stripe.customers.retrieve(existingCustomer.stripeCustomerId)
      } else {
        // Create new Stripe customer and link to existing Payload customer
        stripeCustomer = await stripe.customers.create({
          payment_method: paymentMethodId,
          email: billingDetails.email,
          name: `${billingDetails.firstName} ${billingDetails.lastName}`,
          address: {
            line1: billingDetails.address,
            line2: billingDetails.address2,
            city: billingDetails.city,
            state: billingDetails.state,
            postal_code: billingDetails.postalCode,
            country: 'US',
          },
          shipping: shippingDetails
            ? {
                name: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
                address: {
                  line1: shippingDetails.address,
                  line2: shippingDetails.address2,
                  city: shippingDetails.city,
                  state: shippingDetails.state,
                  postal_code: shippingDetails.postalCode,
                  country: 'US',
                },
              }
            : undefined,
        })

        // Update Payload customer with new Stripe ID
        await payload.update({
          collection: 'customers',
          id: payloadCustomer.id,
          data: {
            stripeCustomerId: stripeCustomer.id,
          },
        })
      }
    } else {
      // Create Stripe customer first
      stripeCustomer = await stripe.customers.create({
        payment_method: paymentMethodId,
        email: billingDetails.email,
        name: `${billingDetails.firstName} ${billingDetails.lastName}`,
        address: {
          line1: billingDetails.address,
          line2: billingDetails.address2,
          city: billingDetails.city,
          state: billingDetails.state,
          postal_code: billingDetails.postalCode,
          country: 'US',
        },
        shipping: shippingDetails
          ? {
              name: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
              address: {
                line1: shippingDetails.address,
                line2: shippingDetails.address2,
                city: shippingDetails.city,
                state: shippingDetails.state,
                postal_code: shippingDetails.postalCode,
                country: 'US',
              },
            }
          : undefined,
      })

      // Create customer in Payload with Stripe ID
      payloadCustomer = await payload.create({
        collection: 'customers',
        data: {
          email: billingDetails.email,
          name: `${billingDetails.firstName} ${billingDetails.lastName}`,
          firstName: billingDetails.firstName,
          lastName: billingDetails.lastName,
          phone: billingDetails.phone,
          stripeCustomerId: stripeCustomer.id,
          shippingAddresses: [
            {
              name: shippingDetails
                ? `${shippingDetails.firstName} ${shippingDetails.lastName}`
                : `${billingDetails.firstName} ${billingDetails.lastName}`,
              firstName: shippingDetails ? shippingDetails.firstName : billingDetails.firstName,
              lastName: shippingDetails ? shippingDetails.lastName : billingDetails.lastName,
              line1: shippingDetails ? shippingDetails.address : billingDetails.address,
              line2: shippingDetails
                ? shippingDetails.address2
                : billingDetails.address2 || undefined,
              city: shippingDetails ? shippingDetails.city : billingDetails.city,
              state: shippingDetails ? shippingDetails.state : billingDetails.state,
              postalCode: shippingDetails ? shippingDetails.postalCode : billingDetails.postalCode,
              country: 'US',
              isDefault: true,
            },
          ],
          billingAddresses: [
            {
              name: `${billingDetails.firstName} ${billingDetails.lastName}`,
              firstName: billingDetails.firstName,
              lastName: billingDetails.lastName,
              line1: billingDetails.address,
              line2: billingDetails.address2 || undefined,
              city: billingDetails.city,
              state: billingDetails.state,
              postalCode: billingDetails.postalCode,
              country: 'US',
              isDefault: true,
            },
          ],
        },
      })
    }

    const customerId = payloadCustomer.id as number

    // Calculate order details
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = Math.floor(item.price * item.quantity * 100) / 100
      return Math.floor((sum + lineTotal) * 100) / 100
    }, 0)

    // Calculate individual discount amounts
    const dealerDiscountAmount = body.discounts?.dealer
      ? Math.floor(((subtotal * body.discounts.dealer.percentage) / 100) * 100) / 100
      : 0

    // Calculate volume discount if applicable
    const volumeDiscountAmount = body.discounts?.dealer?.volumeDiscountApplied
      ? Math.floor(((subtotal * body.discounts.dealer.volumeDiscountPercentage) / 100) * 100) / 100
      : 0

    const affiliateDiscountAmount = body.discounts?.affiliate
      ? Math.floor(subtotal * (body.discounts.affiliate.percentage / 100) * 100) / 100
      : 0

    const discountCodeAmount = body.discounts?.discountCode
      ? body.discounts.discountCode.type === 'percentage'
        ? Math.floor(subtotal * (body.discounts.discountCode.amount / 100) * 100) / 100
        : Math.floor(body.discounts.discountCode.amount * 100) / 100
      : 0

    // Calculate total discounts
    const totalDiscounts =
      Math.floor(
        (dealerDiscountAmount +
          volumeDiscountAmount +
          affiliateDiscountAmount +
          discountCodeAmount) *
          100,
      ) / 100

    // Calculate discounted subtotal
    const discountedSubtotal = Math.floor((subtotal - totalDiscounts) * 100) / 100

    // Get shipping rates
    const shippingResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/shipping/calculate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          destination: shippingDetails || billingDetails,
          subtotal,
          dealerId: body.dealerId,
        }),
      },
    )

    if (!shippingResponse.ok) {
      throw new Error('Failed to calculate shipping')
    }

    const shippingData = await shippingResponse.json()

    // Find the selected shipping method
    const selectedShippingMethod = shippingData.methods.find(
      (method: any) => method.id === body.shippingMethod,
    )

    if (!selectedShippingMethod) {
      console.error('Selected shipping method not available:', {
        requestedMethod: body.shippingMethod,
        availableMethods: shippingData.methods,
      })
      throw new Error('Selected shipping method not available')
    }

    const shipping = selectedShippingMethod.price

    const tax = body.discounts?.dealer?.taxExempt
      ? 0
      : await calculateTax(items, billingDetails, shipping, body.discounts || undefined)

    // Calculate final total
    const total = Number((discountedSubtotal + tax + shipping).toFixed(2))

    // Validate products exist
    const productIds = items.map((item) => item.id)
    const products = await payload.find({
      collection: 'products',
      where: {
        id: {
          in: productIds,
        },
      },
    })

    if (products.docs.length !== productIds.length) {
      throw new Error('Some products in the order do not exist')
    }

    // Calculate Dealer Price total
    let dealerTotal = 0
    for (const item of items) {
      const product = products.docs.find((p) => p.id === item.id)
      if (product) {
        const dealerPrice = product.dealerPrice || product.price || 0
        dealerTotal += dealerPrice * item.quantity
      }
    }
    // Determine dealer ID - prioritize discount-based dealer, fallback to current authenticated dealer
    let dealerId: number | null = null
    if (body.discounts?.dealer) {
      // If there's a dealer discount, find the dealer account by discount tier
      const dealers = await payload.find({
        collection: 'dealers',
        where: {
          discountTier: {
            equals: body.discounts.dealer.tierId,
          },
        },
      })
      if (dealers.totalDocs > 0) {
        dealerId = Number(dealers.docs[0].id)
      }
    } else if (currentDealerId) {
      // If no discount but user is authenticated as dealer, use that dealer
      dealerId = currentDealerId
    }

    // If there's an affiliate discount, find the affiliate account
    let affiliateId: number | null = null
    let affiliateData
    if (body.discounts?.affiliate) {
      const affiliates = await payload.find({
        collection: 'affiliates',
        where: {
          affiliateCode: {
            equals: body.discounts.affiliate.code,
          },
        },
      })

      if (affiliates.totalDocs > 0) {
        affiliateData = affiliates.docs[0]
        affiliateId = Number(affiliateData.id)
      }
    }

    // Create the payment intent with tax details
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomer.id,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        customerEmail: billingDetails.email,
        items: JSON.stringify(items),
        discounts: JSON.stringify({
          dealer: body.discounts?.dealer,
          affiliate: body.discounts?.affiliate,
          discountCode: body.discounts?.discountCode,
        }),
      },
      shipping: shippingDetails
        ? {
            name: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
            address: {
              line1: shippingDetails.address,
              line2: shippingDetails.address2,
              city: shippingDetails.city,
              state: shippingDetails.state,
              postal_code: shippingDetails.postalCode,
              country: 'US',
            },
          }
        : undefined,
      receipt_email: billingDetails.email,
    })

    // Now create order with the valid Stripe payment intent ID
    const order = await payload.create({
      collection: 'orders',
      data: {
        uuid: crypto.randomUUID(),
        customer: customerId,
        dealer: dealerId,
        affiliate: affiliateId,
        status: 'processing',
        stripePaymentIntentId: paymentIntent.id,
        isDropship: body.isDropship || false,
        items: items.map((item) => ({
          product: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
        })),
        subtotal,
        tax,
        taxExempt: !!body.discounts?.dealer?.taxExempt,
        shipping,
        shippingService: selectedShippingMethod.service,
        total,
        dealerTotal,
        shippingAddress: {
          firstName: shippingDetails ? shippingDetails.firstName : billingDetails.firstName,
          lastName: shippingDetails ? shippingDetails.lastName : billingDetails.lastName,
          phone: shippingDetails ? shippingDetails.phone : billingDetails.phone,
          line1: shippingDetails ? shippingDetails.address : billingDetails.address,
          line2: shippingDetails ? shippingDetails.address2 : billingDetails.address2,
          city: shippingDetails ? shippingDetails.city : billingDetails.city,
          state: shippingDetails ? shippingDetails.state : billingDetails.state,
          postalCode: shippingDetails ? shippingDetails.postalCode : billingDetails.postalCode,
          country: 'US',
        },
        billingAddress: {
          firstName: billingDetails.firstName,
          lastName: billingDetails.lastName,
          phone: billingDetails.phone,
          line1: billingDetails.address,
          line2: billingDetails.address2,
          city: billingDetails.city,
          state: billingDetails.state,
          postalCode: billingDetails.postalCode,
          country: 'US',
        },
        discounts: {
          dealer: body.discounts?.dealer
            ? {
                percentage: body.discounts.dealer.percentage,
                tierId: body.discounts.dealer.tierId,
                tierName: body.discounts.dealer.tierName,
                amount: dealerDiscountAmount,
                volumeDiscountApplied: body.discounts.dealer.volumeDiscountApplied,
                volumeDiscountThreshold: body.discounts.dealer.volumeDiscountThreshold,
                volumeDiscountPercentage: body.discounts.dealer.volumeDiscountPercentage,
                volumeDiscountAmount: volumeDiscountAmount,
              }
            : undefined,
          affiliate: body.discounts?.affiliate
            ? {
                code: body.discounts.affiliate.code,
                percentage: body.discounts.affiliate.percentage,
                amount: affiliateDiscountAmount,
                commission: body.discounts.affiliate.commission,
              }
            : undefined,
          discountCode: body.discounts?.discountCode
            ? {
                code: body.discounts.discountCode.code,
                type: body.discounts.discountCode.type,
                amount: discountCodeAmount,
              }
            : undefined,
        },
      },
    })

    // Update payment intent with the order ID
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...paymentIntent.metadata,
        orderId: order.id.toString(),
      },
    })

    // Validate shipping address fields
    const addressToUse = body.shippingDetails || body.billingDetails

    if (!customerId || !items || !total || !subtotal || !paymentIntent.id || !addressToUse) {
      return NextResponse.json({ error: 'Missing required order information' }, { status: 400 })
    }

    // Validate shipping address fields
    if (
      !addressToUse.address ||
      !addressToUse.city ||
      !addressToUse.state ||
      !addressToUse.postalCode
    ) {
      return NextResponse.json(
        { error: 'Missing required shipping address fields' },
        { status: 400 },
      )
    }

    // Complete discount code if one was used
    if (body.discounts?.discountCode?.code) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/discount-codes/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: body.discounts.discountCode.code,
          }),
        })
      } catch (error) {
        console.error('Error completing discount code:', error)
        // Don't throw error here, as the order was already created successfully
      }
    }

    // Return the client secret and order information
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: stripeCustomer.id,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
