import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { w9Service } from '@/lib/w9-service'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get all W9 forms for admin review
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'submitted' | 'approved' | 'rejected' | null

    const forms = await w9Service.getFormsForReview(status || undefined)

    return successResponse({
      forms,
      counts: {
        submitted: forms.filter(f => f.status === 'submitted').length,
        approved: forms.filter(f => f.status === 'approved').length,
        rejected: forms.filter(f => f.status === 'rejected').length,
        total: forms.length
      }
    }, 'W9 forms retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

