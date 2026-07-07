import { NextRequest, NextResponse } from 'next/server'
import { getInventoryStatus } from '@/lib/services/inventory'

export async function GET(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const status = await getInventoryStatus(params.variantId)
    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get inventory status' },
      { status: 500 }
    )
  }
}





