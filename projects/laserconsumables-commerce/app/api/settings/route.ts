import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { key, value, type, group } = body

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value, type, group },
      create: { key, value, type, group },
    })

    return NextResponse.json(setting)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save setting' },
      { status: 500 }
    )
  }
}





