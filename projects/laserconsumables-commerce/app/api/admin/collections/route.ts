import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, slug, description, image } = body

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
      },
    })

    return NextResponse.json(collection)
  } catch (error: any) {
    console.error('Failed to create collection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create collection' },
      { status: 500 }
    )
  }
}
