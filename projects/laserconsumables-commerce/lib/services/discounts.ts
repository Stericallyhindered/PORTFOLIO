import { prisma } from '@/lib/db/prisma'

export interface ValidateDiscountResult {
  valid: boolean
  discount?: number
  error?: string
}

export async function validateDiscountCode(
  code: string,
  subtotal: number,
  productIds?: string[],
  collectionIds?: string[]
): Promise<ValidateDiscountResult> {
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      products: true,
      collections: true,
    },
  })

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' }
  }

  if (!discount.active) {
    return { valid: false, error: 'Discount code is not active' }
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return { valid: false, error: 'Discount code has expired' }
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { valid: false, error: 'Discount code has reached usage limit' }
  }

  if (discount.minPurchase && subtotal < discount.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of $${(discount.minPurchase / 100).toFixed(2)} required`,
    }
  }

  // Check product/collection restrictions
  if (discount.products.length > 0 && productIds) {
    const allowedProductIds = discount.products.map((p) => p.productId)
    const hasAllowedProduct = productIds.some((id) => allowedProductIds.includes(id))
    if (!hasAllowedProduct) {
      return { valid: false, error: 'Discount code not applicable to selected products' }
    }
  }

  if (discount.collections.length > 0 && collectionIds) {
    const allowedCollectionIds = discount.collections.map((c) => c.collectionId)
    const hasAllowedCollection = collectionIds.some((id) => allowedCollectionIds.includes(id))
    if (!hasAllowedCollection) {
      return { valid: false, error: 'Discount code not applicable to selected collections' }
    }
  }

  // Calculate discount amount
  let discountAmount = 0

  if (discount.type === 'percentage') {
    discountAmount = Math.round((subtotal * discount.value) / 100)
    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount)
    }
  } else if (discount.type === 'fixed_amount') {
    discountAmount = discount.value
  }

  return {
    valid: true,
    discount: discountAmount,
  }
}

export async function applyDiscountCode(code: string, orderId: string) {
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!discount) {
    throw new Error('Invalid discount code')
  }

  // Increment usage count
  await prisma.discountCode.update({
    where: { id: discount.id },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  })

  // Link to order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      discountCodeId: discount.id,
    },
  })

  return discount
}





