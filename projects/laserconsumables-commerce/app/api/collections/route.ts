import { NextRequest, NextResponse } from 'next/server'
import { getCollections } from '@/lib/services/products'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'

export async function GET() {
  try {
    const collections = await getCollections()
    return NextResponse.json(collections)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const collection = await prisma.collection.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        image: body.image,
        featured: body.featured ?? false,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create collection' },
      { status: 500 }
    )
  }
}





