import { prisma } from '@/lib/db/prisma'

export interface CreateGiftCardData {
  code: string
  initialBalance: number // In dollars
  customerId?: string
  orderId?: string
  expiresAt?: Date
}

export async function createGiftCard(data: CreateGiftCardData) {
  const balance = Math.round(data.initialBalance * 100) // Convert to cents

  return await prisma.giftCard.create({
    data: {
      code: data.code.toUpperCase(),
      initialBalance: balance,
      balance: balance,
      customerId: data.customerId,
      orderId: data.orderId,
      expiresAt: data.expiresAt,
    },
  })
}

export async function getGiftCardByCode(code: string) {
  return await prisma.giftCard.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      customer: {
        include: {
          user: true,
        },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

export async function validateGiftCard(code: string, amount: number) {
  const giftCard = await getGiftCardByCode(code)

  if (!giftCard) {
    return { valid: false, message: 'Gift card not found' }
  }

  if (!giftCard.active) {
    return { valid: false, message: 'Gift card is inactive' }
  }

  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    return { valid: false, message: 'Gift card has expired' }
  }

  const amountInCents = Math.round(amount * 100)
  if (giftCard.balance < amountInCents) {
    return {
      valid: false,
      message: `Insufficient balance. Available: $${(giftCard.balance / 100).toFixed(2)}`,
    }
  }

  return { valid: true, giftCard }
}

export async function useGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string
) {
  const amountInCents = Math.round(amount * 100)

  const giftCard = await prisma.giftCard.findUnique({
    where: { id: giftCardId },
  })

  if (!giftCard || giftCard.balance < amountInCents) {
    throw new Error('Insufficient gift card balance')
  }

  return await prisma.$transaction(async (tx) => {
    // Update balance
    const updated = await tx.giftCard.update({
      where: { id: giftCardId },
      data: {
        balance: {
          decrement: amountInCents,
        },
      },
    })

    // Create transaction record
    await tx.giftCardTransaction.create({
      data: {
        giftCardId,
        orderId,
        amount: -amountInCents, // Negative for usage
        type: 'usage',
      },
    })

    return updated
  })
}

export async function refundGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string
) {
  const amountInCents = Math.round(amount * 100)

  return await prisma.$transaction(async (tx) => {
    // Update balance
    const updated = await tx.giftCard.update({
      where: { id: giftCardId },
      data: {
        balance: {
          increment: amountInCents,
        },
      },
    })

    // Create transaction record
    await tx.giftCardTransaction.create({
      data: {
        giftCardId,
        orderId,
        amount: amountInCents, // Positive for refund
        type: 'refund',
      },
    })

    return updated
  })
}

export async function getGiftCards(params?: {
  page?: number
  limit?: number
  active?: boolean
  customerId?: string
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.active !== undefined) {
    where.active = params.active
  }
  if (params?.customerId) {
    where.customerId = params.customerId
  }

  const [giftCards, total] = await Promise.all([
    prisma.giftCard.findMany({
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
    prisma.giftCard.count({ where }),
  ])

  return {
    giftCards,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding confusing chars
  let code = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-'
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function generateUniqueGiftCardCode(): Promise<string> {
  let code = generateGiftCardCode()
  let exists = await prisma.giftCard.findUnique({ where: { code } })

  // Try up to 10 times to find a unique code
  let attempts = 0
  while (exists && attempts < 10) {
    code = generateGiftCardCode()
    exists = await prisma.giftCard.findUnique({ where: { code } })
    attempts++
  }

  if (exists) {
    throw new Error('Unable to generate unique gift card code')
  }

  return code
}
