import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { w9FormService } from '@/lib/w9-form-service'
import { successResponse, handleApiError, notFoundResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get full W9 form details for admin (with decrypted data)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id: w9FormId } = await params

    const formDetails = await w9FormService.getW9FormDetailsForAdmin(w9FormId)

    if (!formDetails) {
      return notFoundResponse('W9 form not found')
    }

    return successResponse({
      form: formDetails
    }, 'W9 form details retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

