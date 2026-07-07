import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { variantId, inventoryQuantity, lowStockThreshold, backorderEnabled, backorderMessage, inventoryPolicy, trackInventory } = body

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(inventoryQuantity !== undefined && { inventoryQuantity }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        ...(backorderEnabled !== undefined && { backorderEnabled }),
        ...(backorderMessage !== undefined && { backorderMessage }),
        ...(inventoryPolicy !== undefined && { inventoryPolicy }),
        ...(trackInventory !== undefined && { trackInventory }),
      },
    })

    return NextResponse.json(variant)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}





