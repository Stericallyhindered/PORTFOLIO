import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/api-response'
import { mediaKitService } from '@/lib/media-kit-service'
import { db, mediaKits } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

// POST - Generate PDF for media kit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: mediaKitId } = await params

    // Check if media kit exists and user owns it
    const [existingKit] = await db
      .select()
      .from(mediaKits)
      .where(and(
        eq(mediaKits.id, mediaKitId),
        eq(mediaKits.userId, user.id)
      ))
      .limit(1)

    if (!existingKit) {
      return notFoundResponse('Media kit not found or access denied')
    }

    // Generate PDF
    const pdfUrl = await mediaKitService.generatePDF(mediaKitId)

    // Track download event
    await mediaKitService.trackEvent(mediaKitId, 'download', {}, user.id)

    return successResponse({
      mediaKitId,
      pdfUrl
    }, 'PDF generated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

