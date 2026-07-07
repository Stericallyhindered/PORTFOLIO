import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { adjustInventory } from '@/lib/services/inventory-advanced'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const variantId = searchParams.get('variantId')
    const reason = searchParams.get('reason')

    const where: any = {}
    if (locationId) where.locationId = locationId
    if (variantId) where.variantId = variantId
    if (reason) where.reason = reason

    const adjustments = await prisma.inventoryAdjustment.findMany({
      where,
      include: {
        location: true,
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ adjustments })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adjustments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const user = await getCurrentUser()
    const body = await request.json()
    const adjustment = await adjustInventory({
      ...body,
      userId: user?.id,
    })
    return NextResponse.json({ adjustment })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create adjustment' },
      { status: 500 }
    )
  }
}

