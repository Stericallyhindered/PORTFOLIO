import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const discounts = await prisma.discountCode.findMany({
      include: {
        products: true,
        collections: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(discounts)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()

    const discount = await prisma.discountCode.create({
      data: {
        code: body.code.toUpperCase(),
        type: body.type,
        value: body.type === 'percentage' ? body.value : Math.round(body.value * 100),
        minPurchase: body.minPurchase ? Math.round(body.minPurchase * 100) : null,
        maxDiscount: body.maxDiscount ? Math.round(body.maxDiscount * 100) : null,
        usageLimit: body.usageLimit || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        active: body.active ?? true,
        products: body.productIds
          ? {
              create: body.productIds.map((productId: string) => ({
                productId,
              })),
            }
          : undefined,
        collections: body.collectionIds
          ? {
              create: body.collectionIds.map((collectionId: string) => ({
                collectionId,
              })),
            }
          : undefined,
      },
    })

    return NextResponse.json(discount, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create discount' },
      { status: 500 }
    )
  }
}





