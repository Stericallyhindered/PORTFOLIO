import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { mediaKitService } from '@/lib/media-kit-service'

export const dynamic = 'force-dynamic';

// GET - Get available media kit templates
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'brand' | 'creator' | 'contest' | null

    const templates = await mediaKitService.getTemplates(type || undefined)

    return successResponse({
      templates
    }, 'Media kit templates retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

