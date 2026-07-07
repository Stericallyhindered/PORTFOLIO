import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError, notFoundResponse } from '@/lib/api-response'
import { retrieveRefund, cancelRefund } from '@/lib/stripe'

export const dynamic = 'force-dynamic';

// GET - Get specific refund
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ refundId: string }> }
) {
  try {
    await requireAdmin(request)
    const { refundId } = await params

    const refund = await retrieveRefund(refundId)

    return successResponse({
      refund
    }, 'Refund retrieved successfully')

  } catch (error) {
    if (error instanceof Error && error.message.includes('No such refund')) {
      return notFoundResponse('Refund not found')
    }
    return handleApiError(error)
  }
}

// POST - Cancel refund (if still pending)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ refundId: string }> }
) {
  try {
    await requireAdmin(request)
    const { refundId } = await params

    const refund = await cancelRefund(refundId)

    return successResponse({
      refund,
      message: 'Refund cancelled successfully'
    }, 'Refund cancelled successfully')

  } catch (error) {
    if (error instanceof Error && error.message.includes('No such refund')) {
      return notFoundResponse('Refund not found')
    }
    return handleApiError(error)
  }
}

