import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { w9FormService } from '@/lib/w9-form-service'
import { successResponse, handleApiError, notFoundResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// POST - Generate PDF for W9 form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id: w9FormId } = await params

    // Check if form exists
    const form = await w9FormService.getW9FormById(w9FormId)
    if (!form) {
      return notFoundResponse('W9 form not found')
    }

    // Generate PDF
    const pdfUrl = await w9FormService.generatePDF(w9FormId)

    return successResponse({
      w9FormId,
      pdfUrl
    }, 'PDF generated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

