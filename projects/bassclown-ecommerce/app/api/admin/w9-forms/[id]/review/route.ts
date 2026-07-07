import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { w9Service } from '@/lib/w9-service'
import { successResponse, handleApiError, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional()
})

// POST - Review (approve/reject) a W9 form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request)
    const { id: formId } = await params
    const body = await request.json()

    // Validate input
    const validation = reviewSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { action, rejectionReason } = validation.data

    // Get form to verify it exists and is in correct status
    const form = await w9Service.getW9FormById(formId)
    if (!form) {
      return handleApiError(new Error('W9 form not found'))
    }

    if (form.status !== 'submitted' && action !== 'approve') {
      return handleApiError(new Error('W9 form must be in submitted status to review'))
    }

    // Review the form
    await w9Service.reviewW9Form(
      formId,
      adminUser.id,
      action,
      action === 'reject' ? rejectionReason : undefined
    )

    // Get updated form
    const updatedForm = await w9Service.getW9FormById(formId)

    return successResponse({
      form: updatedForm,
      message: action === 'approve' 
        ? 'W9 form approved successfully' 
        : 'W9 form rejected successfully'
    }, 'W9 form reviewed successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

