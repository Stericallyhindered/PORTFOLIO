import { prisma } from '@/lib/db/prisma'

export interface AbandonedCartData {
  customerId?: string
  email: string
  sessionId?: string
  items: Array<{
    variantId: string
    quantity: number
    price: number
  }>
  subtotal: number
}

export async function createAbandonedCart(data: AbandonedCartData) {
  return await prisma.abandonedCart.create({
    data: {
      customerId: data.customerId,
      email: data.email,
      sessionId: data.sessionId,
      items: JSON.stringify(data.items),
      subtotal: Math.round(data.subtotal * 100), // Convert to cents
    },
  })
}

export async function markAbandonedCartEmailSent(id: string) {
  return await prisma.abandonedCart.update({
    where: { id },
    data: {
      emailSent: true,
      emailSentAt: new Date(),
    },
  })
}

export async function markAbandonedCartRecovered(id: string) {
  return await prisma.abandonedCart.update({
    where: { id },
    data: {
      recovered: true,
      recoveredAt: new Date(),
    },
  })
}

export async function getAbandonedCarts(params?: {
  page?: number
  limit?: number
  recovered?: boolean
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.recovered !== undefined) {
    where.recovered = params.recovered
  }

  const [carts, total] = await Promise.all([
    prisma.abandonedCart.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.abandonedCart.count({ where }),
  ])

  return {
    carts: carts.map((cart) => ({
      ...cart,
      items: JSON.parse(cart.items),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getAbandonedCartsForEmail() {
  // Get carts that haven't been emailed and are older than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  return await prisma.abandonedCart.findMany({
    where: {
      emailSent: false,
      createdAt: {
        lt: oneHourAgo,
      },
    },
    include: {
      customer: {
        include: {
          user: true,
        },
      },
    },
  })
}



