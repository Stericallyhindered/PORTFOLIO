import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { transferInventory } from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')

    const where: any = {}
    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ]
    }
    if (status) {
      where.status = status
    }

    const transfers = await prisma.inventoryTransfer.findMany({
      where,
      include: {
        fromLocation: true,
        toLocation: true,
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ transfers })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const transfer = await transferInventory(body)
    return NextResponse.json({ transfer })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create transfer' },
      { status: 500 }
    )
  }
}


