import { prisma } from '@/lib/db/prisma'

export interface CreateReturnData {
  orderId: string
  reason?: string
  items: Array<{
    orderItemId: string
    quantity: number
  }>
  refundMethod?: string // original_payment, store_credit, gift_card
}

export async function createReturn(data: CreateReturnData) {
  // Get order to calculate refund amount
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      items: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Calculate refund amount based on returned items
  let refundAmount = 0
  const returnItems: any[] = []

  for (const returnItem of data.items) {
    const orderItem = order.items.find((item) => item.id === returnItem.orderItemId)
    if (orderItem) {
      const itemRefund = (orderItem.price * returnItem.quantity)
      refundAmount += itemRefund
      returnItems.push({
        orderItemId: orderItem.id,
        variantId: orderItem.variantId,
        quantity: returnItem.quantity,
        price: orderItem.price,
      })
    }
  }

  // Generate return number
  const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  return await prisma.orderReturn.create({
    data: {
      orderId: data.orderId,
      returnNumber,
      reason: data.reason,
      items: JSON.stringify(returnItems),
      refundAmount,
      refundMethod: data.refundMethod || 'original_payment',
    },
  })
}

export async function approveReturn(returnId: string) {
  const returnRecord = await prisma.orderReturn.findUnique({
    where: { id: returnId },
    include: {
      order: true,
    },
  })

  if (!returnRecord) {
    throw new Error('Return not found')
  }

  if (returnRecord.status !== 'PENDING') {
    throw new Error('Return is not pending')
  }

  return await prisma.orderReturn.update({
    where: { id: returnId },
    data: {
      status: 'APPROVED',
    },
  })
}

export async function rejectReturn(returnId: string, reason?: string) {
  const returnRecord = await prisma.orderReturn.findUnique({
    where: { id: returnId },
  })

  if (!returnRecord) {
    throw new Error('Return not found')
  }

  return await prisma.orderReturn.update({
    where: { id: returnId },
    data: {
      status: 'REJECTED',
      notes: reason ? `${returnRecord.notes || ''}\nRejection reason: ${reason}`.trim() : returnRecord.notes,
    },
  })
}

export async function completeReturn(returnId: string) {
  const returnRecord = await prisma.orderReturn.findUnique({
    where: { id: returnId },
    include: {
      order: true,
    },
  })

  if (!returnRecord) {
    throw new Error('Return not found')
  }

  if (returnRecord.refunded) {
    throw new Error('Return already refunded')
  }

  return await prisma.$transaction(async (tx) => {
    // Update return status
    const updated = await tx.orderReturn.update({
      where: { id: returnId },
      data: {
        status: 'COMPLETED',
        refunded: true,
        refundedAt: new Date(),
      },
    })

    // Process refund based on refund method
    if (returnRecord.refundMethod === 'gift_card' && returnRecord.order.giftCardId) {
      // Refund to gift card
      const refundAmount = returnRecord.refundAmount / 100 // Convert cents to dollars
      await tx.giftCard.update({
        where: { id: returnRecord.order.giftCardId },
        data: {
          balance: {
            increment: returnRecord.refundAmount,
          },
        },
      })

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: returnRecord.order.giftCardId,
          orderId: returnRecord.orderId,
          amount: returnRecord.refundAmount,
          type: 'refund',
          notes: `Refund for return ${returnRecord.returnNumber}`,
        },
      })
    }
    // For original_payment and store_credit, refund would be processed via Stripe or other payment processor
    // This would typically be handled by a webhook or admin action

    return updated
  })
}

export async function getReturns(params?: {
  page?: number
  limit?: number
  status?: string
  orderId?: string
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.status) {
    where.status = params.status
  }
  if (params?.orderId) {
    where.orderId = params.orderId
  }

  const [returns, total] = await Promise.all([
    prisma.orderReturn.findMany({
      where,
      skip,
      take: limit,
      include: {
        order: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.orderReturn.count({ where }),
  ])

  return {
    returns: returns.map((r) => ({
      ...r,
      items: JSON.parse(r.items),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getReturn(id: string) {
  const returnRecord = await prisma.orderReturn.findUnique({
    where: { id },
    include: {
      order: {
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
          customer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  })

  if (!returnRecord) {
    return null
  }

  return {
    ...returnRecord,
    items: JSON.parse(returnRecord.items),
  }
}

