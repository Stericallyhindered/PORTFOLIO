import { prisma } from '@/lib/db/prisma'

export interface InventoryStatus {
  available: boolean
  quantity: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'
  message?: string
  canPurchase: boolean
  trackInventory?: boolean
}

export async function getInventoryStatus(variantId: string): Promise<InventoryStatus> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })

  if (!variant) {
    return {
      available: false,
      quantity: 0,
      status: 'out_of_stock',
      canPurchase: false,
      message: 'Product not found',
    }
  }

  if (!variant.trackInventory) {
    return {
      available: true,
      quantity: 999999,
      status: 'in_stock',
      canPurchase: true,
      trackInventory: false,
    }
  }

  const quantity = variant.inventoryQuantity

  // Out of stock
  if (quantity <= 0) {
    if (variant.backorderEnabled && variant.inventoryPolicy === 'backorder') {
    return {
      available: false,
      quantity: 0,
      status: 'backorder',
      canPurchase: true,
      trackInventory: true,
      message: variant.backorderMessage || 'Available on backorder',
    }
    }

    return {
      available: false,
      quantity: 0,
      status: 'out_of_stock',
      canPurchase: false,
      trackInventory: true,
      message: 'Out of stock',
    }
  }

  // Low stock
  if (quantity <= variant.lowStockThreshold) {
    return {
      available: true,
      quantity,
      status: 'low_stock',
      canPurchase: true,
      trackInventory: true,
      message: `Only ${quantity} left in stock`,
    }
  }

  // In stock
  return {
    available: true,
    quantity,
    status: 'in_stock',
    canPurchase: true,
    trackInventory: true,
  }
}

export async function checkInventoryAvailability(
  variantId: string,
  requestedQuantity: number
): Promise<{ available: boolean; message?: string }> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })

  if (!variant) {
    return { available: false, message: 'Product not found' }
  }

  if (!variant.trackInventory) {
    return { available: true }
  }

  const availableQuantity = variant.inventoryQuantity

  if (availableQuantity <= 0) {
    if (variant.backorderEnabled && variant.inventoryPolicy === 'backorder') {
      return { available: true, message: 'Available on backorder' }
    }
    return { available: false, message: 'Out of stock' }
  }

  if (requestedQuantity > availableQuantity) {
    if (variant.backorderEnabled && variant.inventoryPolicy === 'backorder') {
      return {
        available: true,
        message: `${availableQuantity} in stock, ${requestedQuantity - availableQuantity} on backorder`,
      }
    }
    return {
      available: false,
      message: `Only ${availableQuantity} available`,
    }
  }

  return { available: true }
}

export async function reserveInventory(
  variantId: string,
  quantity: number
): Promise<{ success: boolean; message?: string }> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })

  if (!variant) {
    return { success: false, message: 'Product not found' }
  }

  if (!variant.trackInventory) {
    return { success: true }
  }

  if (variant.inventoryPolicy === 'backorder' && variant.backorderEnabled) {
    // Allow backorders, don't reserve inventory
    return { success: true }
  }

  if (variant.inventoryQuantity < quantity) {
    return {
      success: false,
      message: `Only ${variant.inventoryQuantity} available`,
    }
  }

  // Reserve inventory
  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      inventoryQuantity: {
        decrement: quantity,
      },
    },
  })

  return { success: true }
}

export async function releaseInventory(
  variantId: string,
  quantity: number
): Promise<void> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })

  if (!variant || !variant.trackInventory) {
    return
  }

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      inventoryQuantity: {
        increment: quantity,
      },
    },
  })
}

export async function getLowStockVariants(threshold?: number) {
  return await prisma.productVariant.findMany({
    where: {
      trackInventory: true,
      AND: [
        { inventoryQuantity: { lte: threshold || 10 } },
        { inventoryQuantity: { gt: 0 } },
      ],
    },
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
    orderBy: {
      inventoryQuantity: 'asc',
    },
  })
}

export async function getOutOfStockVariants() {
  return await prisma.productVariant.findMany({
    where: {
      trackInventory: true,
      inventoryQuantity: {
        lte: 0,
      },
      OR: [
        { backorderEnabled: false },
        { inventoryPolicy: { not: 'backorder' } },
      ],
    },
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
  })
}

export async function getBackorderVariants() {
  return await prisma.productVariant.findMany({
    where: {
      trackInventory: true,
      inventoryQuantity: {
        lte: 0,
      },
      backorderEnabled: true,
      inventoryPolicy: 'backorder',
    },
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
  })
}

