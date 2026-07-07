import { prisma } from '@/lib/db/prisma'

// Order status types (stored as strings in database)
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface CreateOrderData {
  email: string
  phone?: string
  customerId?: string
  shippingAddress: {
    firstName: string
    lastName: string
    company?: string
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country?: string
    phone?: string
  }
  billingAddress: {
    firstName: string
    lastName: string
    company?: string
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country?: string
    phone?: string
  }
  items: Array<{
    variantId: string
    quantity: number
  }>
  discountCodeId?: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
}

export async function createOrder(data: CreateOrderData) {
  // Generate order number
  const orderNumber = `LC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  const order = await prisma.order.create({
    data: {
      orderNumber,
      email: data.email,
      phone: data.phone,
      customerId: data.customerId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      subtotal: Math.round(data.subtotal * 100),
      tax: Math.round(data.tax * 100),
      shipping: Math.round(data.shipping * 100),
      discount: Math.round(data.discount * 100),
      total: Math.round(data.total * 100),
      discountCodeId: data.discountCodeId,
      items: {
        create: await Promise.all(
          data.items.map(async (item) => {
            const variant = await prisma.productVariant.findUnique({
              where: { id: item.variantId },
            })

            if (!variant) {
              throw new Error(`Variant ${item.variantId} not found`)
            }

            return {
              variantId: item.variantId,
              quantity: item.quantity,
              price: variant.price,
            }
          })
        ),
      },
      shippingAddress: {
        create: {
          firstName: data.shippingAddress.firstName,
          lastName: data.shippingAddress.lastName,
          company: data.shippingAddress.company,
          address1: data.shippingAddress.address1,
          address2: data.shippingAddress.address2,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          zip: data.shippingAddress.zip,
          country: data.shippingAddress.country || 'US',
          phone: data.shippingAddress.phone,
        },
      },
      billingAddress: {
        create: {
          firstName: data.billingAddress.firstName,
          lastName: data.billingAddress.lastName,
          company: data.billingAddress.company,
          address1: data.billingAddress.address1,
          address2: data.billingAddress.address2,
          city: data.billingAddress.city,
          state: data.billingAddress.state,
          zip: data.billingAddress.zip,
          country: data.billingAddress.country || 'US',
          phone: data.billingAddress.phone,
        },
      },
      statusHistory: {
        create: {
          status: 'PENDING',
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
    },
  })

  return order
}

export async function getOrders(params?: {
  page?: number
  limit?: number
  status?: OrderStatus
  customerId?: string
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = {}

  if (params?.status) {
    where.status = params.status
  }

  if (params?.customerId) {
    where.customerId = params.customerId
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { position: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        shippingAddress: true,
        customer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getOrder(id: string) {
  // Validate ID is a proper string CUID, not a numeric ShipStation ID
  if (!id || typeof id !== 'string' || /^\d+$/.test(id)) {
    throw new Error(`Invalid order ID format: ${id}. Expected a CUID string, not a numeric ID.`)
  }
  
  return await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
      shippingAddress: true,
      billingAddress: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
      shipments: true,
      customer: {
        include: {
          user: true,
        },
      },
    },
  })
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string
) {
  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          note,
        },
      },
    },
  })

  return order
}

export async function updateOrderPaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
) {
  return await prisma.order.update({
    where: { id },
    data: { paymentStatus },
  })
}





