import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import {
  createShippingProfile,
  getShippingProfiles,
} from '@/lib/services/shipping-advanced'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireAdmin()
    const profiles = await getShippingProfiles()
    return NextResponse.json({ profiles })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const profile = await createShippingProfile(body)
    return NextResponse.json({ profile })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create shipping profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    const profiles = await getShippingProfiles()
    const index = profiles.findIndex((p) => p.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    profiles[index] = { ...profiles[index], ...data }

    await prisma.siteSetting.upsert({
      where: { key: 'shipping_profiles' },
      create: {
        key: 'shipping_profiles',
        value: JSON.stringify(profiles),
        type: 'json',
        group: 'shipping',
      },
      update: {
        value: JSON.stringify(profiles),
      },
    })

    return NextResponse.json({ profile: profiles[index] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update shipping profile' },
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
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    const profiles = await getShippingProfiles()
    const filtered = profiles.filter((p) => p.id !== id)

    await prisma.siteSetting.upsert({
      where: { key: 'shipping_profiles' },
      create: {
        key: 'shipping_profiles',
        value: JSON.stringify(filtered),
        type: 'json',
        group: 'shipping',
      },
      update: {
        value: JSON.stringify(filtered),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete shipping profile' },
      { status: 500 }
    )
  }
}


