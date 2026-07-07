import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array required' },
        { status: 400 }
      )
    }

    // Update all variants
    await Promise.all(
      updates.map((update: any) =>
        prisma.productVariant.update({
          where: { id: update.variantId },
          data: {
            ...(update.inventoryQuantity !== undefined && {
              inventoryQuantity: update.inventoryQuantity,
            }),
            ...(update.lowStockThreshold !== undefined && {
              lowStockThreshold: update.lowStockThreshold,
            }),
          },
        })
      )
    )

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}





