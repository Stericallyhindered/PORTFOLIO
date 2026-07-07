import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  createStocktaking,
  addStocktakingItem,
  completeStocktaking,
} from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')

    const where: any = {}
    if (locationId) where.locationId = locationId
    if (status) where.status = status

    const stocktakings = await prisma.stocktaking.findMany({
      where,
      include: {
        location: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ stocktakings })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stocktakings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create') {
      const stocktaking = await createStocktaking(data.locationId)
      return NextResponse.json({ stocktaking })
    } else if (action === 'add_item') {
      const item = await addStocktakingItem(data)
      return NextResponse.json({ item })
    } else if (action === 'complete') {
      const stocktaking = await completeStocktaking(data.stocktakingId, data.applyAdjustments || false)
      return NextResponse.json({ stocktaking })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process stocktaking' },
      { status: 500 }
    )
  }
}


