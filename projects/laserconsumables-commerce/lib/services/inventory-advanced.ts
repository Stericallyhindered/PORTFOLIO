import { prisma } from '@/lib/db/prisma'

export interface CreateLocationData {
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  default?: boolean
}

export async function createLocation(data: CreateLocationData) {
  // If this is set as default, unset other defaults
  if (data.default) {
    await prisma.location.updateMany({
      where: { default: true },
      data: { default: false },
    })
  }

  return await prisma.location.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country || 'US',
      phone: data.phone,
      email: data.email,
      default: data.default || false,
    },
  })
}

export async function getLocations() {
  return await prisma.location.findMany({
    where: { active: true },
    orderBy: [{ default: 'desc' }, { name: 'asc' }],
  })
}

export async function getLocationInventory(locationId: string, variantId?: string) {
  const where: any = { locationId }
  if (variantId) {
    where.variantId = variantId
  }

  return await prisma.locationInventory.findMany({
    where,
    include: {
      variant: {
        include: {
          product: true,
        },
      },
      location: true,
    },
  })
}

export async function adjustInventory(data: {
  locationId?: string
  variantId: string
  quantity: number // Positive for additions, negative for removals
  reason: string
  notes?: string
  userId?: string
}) {
  return await prisma.$transaction(async (tx) => {
    // Get current inventory
    let locationInventory
    if (data.locationId) {
      locationInventory = await tx.locationInventory.findUnique({
        where: {
          locationId_variantId: {
            locationId: data.locationId,
            variantId: data.variantId,
          },
        },
      })

      if (!locationInventory) {
        // Create location inventory if it doesn't exist
        locationInventory = await tx.locationInventory.create({
          data: {
            locationId: data.locationId,
            variantId: data.variantId,
            quantity: 0,
          },
        })
      }
    } else {
      // Global inventory (variant level)
      const variant = await tx.productVariant.findUnique({
        where: { id: data.variantId },
      })
      if (!variant) {
        throw new Error('Variant not found')
      }
    }

    const quantityBefore = locationInventory
      ? locationInventory.quantity
      : (await tx.productVariant.findUnique({ where: { id: data.variantId } }))?.inventoryQuantity || 0

    // Update inventory
    if (locationInventory) {
      await tx.locationInventory.update({
        where: { id: locationInventory.id },
        data: {
          quantity: {
            increment: data.quantity,
          },
        },
      })
    } else {
      await tx.productVariant.update({
        where: { id: data.variantId },
        data: {
          inventoryQuantity: {
            increment: data.quantity,
          },
        },
      })
    }

    const quantityAfter = quantityBefore + data.quantity

    // Create adjustment record
    const adjustment = await tx.inventoryAdjustment.create({
      data: {
        locationId: data.locationId,
        variantId: data.variantId,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      },
    })

    // Create history record
    await tx.inventoryHistory.create({
      data: {
        variantId: data.variantId,
        locationId: data.locationId,
        changeType: 'adjustment',
        quantityBefore,
        quantityAfter,
        quantityChange: data.quantity,
        reason: data.reason,
        adjustmentId: adjustment.id,
      },
    })

    return adjustment
  })
}

export async function transferInventory(data: {
  fromLocationId: string
  toLocationId: string
  variantId: string
  quantity: number
  notes?: string
}) {
  return await prisma.$transaction(async (tx) => {
    // Check source inventory
    const fromInventory = await tx.locationInventory.findUnique({
      where: {
        locationId_variantId: {
          locationId: data.fromLocationId,
          variantId: data.variantId,
        },
      },
    })

    if (!fromInventory || fromInventory.quantity < data.quantity) {
      throw new Error('Insufficient inventory at source location')
    }

    // Get or create destination inventory
    let toInventory = await tx.locationInventory.findUnique({
      where: {
        locationId_variantId: {
          locationId: data.toLocationId,
          variantId: data.variantId,
        },
      },
    })

    if (!toInventory) {
      toInventory = await tx.locationInventory.create({
        data: {
          locationId: data.toLocationId,
          variantId: data.variantId,
          quantity: 0,
        },
      })
    }

    // Create transfer record
    const transfer = await tx.inventoryTransfer.create({
      data: {
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        variantId: data.variantId,
        quantity: data.quantity,
        notes: data.notes,
        status: 'PENDING',
      },
    })

    // Update inventories
    await tx.locationInventory.update({
      where: { id: fromInventory.id },
      data: {
        quantity: {
          decrement: data.quantity,
        },
      },
    })

    await tx.locationInventory.update({
      where: { id: toInventory.id },
      data: {
        quantity: {
          increment: data.quantity,
        },
      },
    })

    // Update transfer status
    await tx.inventoryTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Create history records
    await tx.inventoryHistory.createMany({
      data: [
        {
          variantId: data.variantId,
          locationId: data.fromLocationId,
          changeType: 'transfer',
          quantityBefore: fromInventory.quantity,
          quantityAfter: fromInventory.quantity - data.quantity,
          quantityChange: -data.quantity,
          reason: `Transfer to ${data.toLocationId}`,
          transferId: transfer.id,
        },
        {
          variantId: data.variantId,
          locationId: data.toLocationId,
          changeType: 'transfer',
          quantityBefore: toInventory.quantity,
          quantityAfter: toInventory.quantity + data.quantity,
          quantityChange: data.quantity,
          reason: `Transfer from ${data.fromLocationId}`,
          transferId: transfer.id,
        },
      ],
    })

    return transfer
  })
}

export async function reserveInventory(data: {
  locationId?: string
  variantId: string
  orderId: string
  quantity: number
  expiresAt?: Date
}) {
  return await prisma.$transaction(async (tx) => {
    // Check available inventory
    let availableQty = 0
    let locationInventoryId: string | undefined

    if (data.locationId) {
      const locInventory = await tx.locationInventory.findUnique({
        where: {
          locationId_variantId: {
            locationId: data.locationId,
            variantId: data.variantId,
          },
        },
      })

      if (!locInventory || locInventory.quantity - locInventory.reserved < data.quantity) {
        throw new Error('Insufficient available inventory')
      }

      availableQty = locInventory.quantity - locInventory.reserved
      locationInventoryId = locInventory.id

      // Update reserved quantity
      await tx.locationInventory.update({
        where: { id: locInventory.id },
        data: {
          reserved: {
            increment: data.quantity,
          },
        },
      })
    } else {
      const variant = await tx.productVariant.findUnique({
        where: { id: data.variantId },
      })

      if (!variant || variant.inventoryQuantity < data.quantity) {
        throw new Error('Insufficient inventory')
      }

      availableQty = variant.inventoryQuantity
    }

    // Create reservation
    const reservation = await tx.inventoryReservation.create({
      data: {
        locationInventoryId,
        variantId: data.variantId,
        orderId: data.orderId,
        quantity: data.quantity,
        expiresAt: data.expiresAt,
      },
    })

    // Create history record
    await tx.inventoryHistory.create({
      data: {
        variantId: data.variantId,
        locationId: data.locationId,
        changeType: 'reservation',
        quantityBefore: availableQty,
        quantityAfter: availableQty,
        quantityChange: 0, // Reservation doesn't change available qty, just reserves it
        reason: `Reserved for order ${data.orderId}`,
      },
    })

    return reservation
  })
}

export async function releaseReservation(reservationId: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.inventoryReservation.findUnique({
      where: { id: reservationId },
      include: {
        locationInventory: true,
      },
    })

    if (!reservation) {
      throw new Error('Reservation not found')
    }

    if (reservation.status !== 'RESERVED') {
      throw new Error('Reservation is not active')
    }

    // Release reserved quantity
    if (reservation.locationInventoryId && reservation.locationInventory) {
      await tx.locationInventory.update({
        where: { id: reservation.locationInventoryId },
        data: {
          reserved: {
            decrement: reservation.quantity,
          },
        },
      })
    }

    // Update reservation status
    return await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        status: 'CANCELLED',
      },
    })
  })
}

export async function fulfillReservation(reservationId: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.inventoryReservation.findUnique({
      where: { id: reservationId },
      include: {
        locationInventory: true,
        variant: true,
      },
    })

    if (!reservation) {
      throw new Error('Reservation not found')
    }

    if (reservation.status !== 'RESERVED') {
      throw new Error('Reservation is not active')
    }

    // Fulfill reservation - remove from inventory
    if (reservation.locationInventoryId && reservation.locationInventory) {
      const quantityBefore = reservation.locationInventory.quantity
      const quantityAfter = quantityBefore - reservation.quantity

      await tx.locationInventory.update({
        where: { id: reservation.locationInventoryId },
        data: {
          quantity: {
            decrement: reservation.quantity,
          },
          reserved: {
            decrement: reservation.quantity,
          },
        },
      })

      // Create history record
      await tx.inventoryHistory.create({
        data: {
          variantId: reservation.variantId,
          locationId: reservation.locationInventory.locationId,
          changeType: 'sale',
          quantityBefore,
          quantityAfter,
          quantityChange: -reservation.quantity,
          reason: `Fulfilled reservation for order ${reservation.orderId}`,
          orderId: reservation.orderId,
        },
      })
    } else {
      // Global inventory
      const variant = await tx.productVariant.findUnique({
        where: { id: reservation.variantId },
      })

      if (!variant || variant.inventoryQuantity < reservation.quantity) {
        throw new Error('Insufficient inventory')
      }

      const quantityBefore = variant.inventoryQuantity
      const quantityAfter = quantityBefore - reservation.quantity

      await tx.productVariant.update({
        where: { id: reservation.variantId },
        data: {
          inventoryQuantity: {
            decrement: reservation.quantity,
          },
        },
      })

      // Create history record
      await tx.inventoryHistory.create({
        data: {
          variantId: reservation.variantId,
          changeType: 'sale',
          quantityBefore,
          quantityAfter,
          quantityChange: -reservation.quantity,
          reason: `Fulfilled reservation for order ${reservation.orderId}`,
          orderId: reservation.orderId,
        },
      })
    }

    // Update reservation status
    return await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        status: 'FULFILLED',
      },
    })
  })
}

export async function createStocktaking(locationId?: string) {
  return await prisma.stocktaking.create({
    data: {
      locationId,
      status: 'PENDING',
    },
  })
}

export async function addStocktakingItem(data: {
  stocktakingId: string
  variantId: string
  countedQty: number
  notes?: string
}) {
  // Get expected quantity
  let expectedQty = 0

  const stocktaking = await prisma.stocktaking.findUnique({
    where: { id: data.stocktakingId },
    include: {
      location: true,
    },
  })

  if (stocktaking?.locationId) {
    const locInventory = await prisma.locationInventory.findUnique({
      where: {
        locationId_variantId: {
          locationId: stocktaking.locationId,
          variantId: data.variantId,
        },
      },
    })
    expectedQty = locInventory?.quantity || 0
  } else {
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
    })
    expectedQty = variant?.inventoryQuantity || 0
  }

  const variance = data.countedQty - expectedQty

  return await prisma.stocktakingItem.create({
    data: {
      stocktakingId: data.stocktakingId,
      variantId: data.variantId,
      expectedQty,
      countedQty: data.countedQty,
      variance,
      notes: data.notes,
    },
  })
}

export async function completeStocktaking(stocktakingId: string, applyAdjustments: boolean = false) {
  return await prisma.$transaction(async (tx) => {
    const stocktaking = await tx.stocktaking.findUnique({
      where: { id: stocktakingId },
      include: {
        items: true,
        location: true,
      },
    })

    if (!stocktaking) {
      throw new Error('Stocktaking not found')
    }

    if (applyAdjustments) {
      // Apply adjustments for variances
      for (const item of stocktaking.items) {
        if (item.variance !== 0) {
          await adjustInventory({
            locationId: stocktaking.locationId || undefined,
            variantId: item.variantId,
            quantity: item.variance,
            reason: 'cycle_count',
            notes: `Stocktaking adjustment - Expected: ${item.expectedQty}, Counted: ${item.countedQty}`,
          })
        }
      }
    }

    return await tx.stocktaking.update({
      where: { id: stocktakingId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
  })
}

export async function getInventoryHistory(params?: {
  variantId?: string
  locationId?: string
  changeType?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.variantId) where.variantId = params.variantId
  if (params?.locationId) where.locationId = params.locationId
  if (params?.changeType) where.changeType = params.changeType
  if (params?.startDate || params?.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const [history, total] = await Promise.all([
    prisma.inventoryHistory.findMany({
      where,
      skip,
      take: limit,
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryHistory.count({ where }),
  ])

  return {
    history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function exportInventoryToCSV(locationId?: string) {
  const inventory = locationId
    ? await prisma.locationInventory.findMany({
        where: { locationId },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
          location: true,
        },
      })
    : await prisma.productVariant.findMany({
        include: {
          product: true,
        },
      })

  const headers = locationId
    ? ['Location', 'Product', 'Variant', 'SKU', 'Quantity', 'Reserved', 'Available']
    : ['Product', 'Variant', 'SKU', 'Quantity', 'Low Stock Threshold', 'Status']

  const rows = inventory.map((item: any) => {
    if (locationId) {
      return [
        item.location.name,
        item.variant.product.name,
        item.variant.name || 'Default',
        item.variant.sku || '',
        item.quantity,
        item.reserved,
        item.quantity - item.reserved,
      ]
    } else {
      const status =
        item.inventoryQuantity === 0
          ? 'Out of Stock'
          : item.inventoryQuantity <= item.lowStockThreshold
          ? 'Low Stock'
          : 'In Stock'

      return [
        item.product.name,
        item.name || 'Default',
        item.sku || '',
        item.inventoryQuantity,
        item.lowStockThreshold,
        status,
      ]
    }
  })

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  return csv
}



