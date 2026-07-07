import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createLocation, getLocations } from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireAdmin()
    const locations = await getLocations()
    return NextResponse.json({ locations })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const location = await createLocation(body)
    return NextResponse.json({ location })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create location' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    // If setting as default, unset other defaults
    if (data.default) {
      await prisma.location.updateMany({
        where: { default: true },
        data: { default: false },
      })
    }

    const location = await prisma.location.update({
      where: { id },
      data,
    })

    return NextResponse.json({ location })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

    // Soft delete by setting active to false
    const location = await prisma.location.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ location })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete location' },
      { status: 500 }
    )
  }
}


