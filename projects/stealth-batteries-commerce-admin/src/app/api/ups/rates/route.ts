import { NextResponse } from 'next/server'
import { getRates } from '@/lib/shipping/services/ups'
import type { RateRequest } from '@/lib/shipping/services/ups'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const rateRequest = (await req.json()) as RateRequest
    const rates = await getRates(rateRequest)
    return NextResponse.json(rates)
  } catch (error) {
    console.error('Failed to get UPS rates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get UPS rates' },
      { status: 500 },
    )
  }
}
