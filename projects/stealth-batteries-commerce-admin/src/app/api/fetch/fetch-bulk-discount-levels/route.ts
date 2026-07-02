import { NextResponse } from 'next/server'
import { getBulkDiscountLevels } from '@/utilities/getBulkDiscountLevels.server'

export async function GET() {
  const levels = await getBulkDiscountLevels()
  return NextResponse.json(levels)
}
