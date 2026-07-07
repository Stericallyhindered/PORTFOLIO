import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()

    const {
      customerId,
      email,
      phone,
      orderItems,
      shippingAddress,
      billingAddress,
      useShippingForBilling,
      subtotal,
      tax,
      shipping,
      total,
      notes,
    } = body

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create order with all related data
    const order = await prisma.$transaction(async (tx) => {
      // Create shipping address
      const shippingAddr = await tx.shippingAddress.create({
        data: {
          customerId: customerId || undefined,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          company: shippingAddress.company || undefined,
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country || 'US',
          phone: shippingAddress.phone || phone || undefined,
        },
      })

      // Create billing address
      const billingData = useShippingForBilling ? shippingAddress : billingAddress
      const billingAddr = await tx.billingAddress.create({
        data: {
          customerId: customerId || undefined,
          firstName: billingData.firstName,
          lastName: billingData.lastName,
          company: billingData.company || undefined,
          address1: billingData.address1,
          address2: billingData.address2 || undefined,
          city: billingData.city,
          state: billingData.state,
          zip: billingData.zip,
          country: billingData.country || 'US',
          phone: billingData.phone || phone || undefined,
        },
      })

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerId || undefined,
          email,
          phone: phone || undefined,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal,
          tax,
          shipping,
          total,
          notes: notes || undefined,
          items: {
            create: orderItems.map((item: any) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          shippingAddress: {
            connect: { id: shippingAddr.id },
          },
          billingAddress: {
            connect: { id: billingAddr.id },
          },
          statusHistory: {
            create: {
              status: 'PENDING',
              note: 'Manual order created',
            },
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          customer: {
            include: {
              user: true,
            },
          },
        },
      })

      return newOrder
    })

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Error creating manual order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}


