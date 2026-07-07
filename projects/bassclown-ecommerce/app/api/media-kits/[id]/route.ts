import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { successResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'
import { mediaKitService } from '@/lib/media-kit-service'
import { db, mediaKits } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

const updateMediaKitSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isPublic: z.boolean().optional(),
  customization: z.object({
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional()
    }).optional(),
    fonts: z.object({
      heading: z.string().optional(),
      body: z.string().optional()
    }).optional(),
    layout: z.object({
      sections: z.array(z.string()).optional(),
      sectionOrder: z.array(z.number()).optional()
    }).optional(),
    branding: z.object({
      logoUrl: z.string().url().optional(),
      headerImageUrl: z.string().url().optional(),
      showWatermark: z.boolean().optional()
    }).optional()
  }).optional()
})

// GET - Get specific media kit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: mediaKitId } = await params

    // Get media kit
    const [mediaKit] = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.id, mediaKitId))
      .limit(1)

    if (!mediaKit) {
      return notFoundResponse('Media kit not found')
    }

    // Check if user owns the media kit or it's public
    if (mediaKit.userId !== user.id && (!mediaKit.isPublic || mediaKit.status !== 'published')) {
      return handleApiError(new Error('Access denied'))
    }

    return successResponse({
      mediaKit
    }, 'Media kit retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update media kit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: mediaKitId } = await params
    const body = await request.json()

    // Validate input
    const validation = updateMediaKitSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

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

    // Update media kit
    await mediaKitService.updateMediaKit(
      mediaKitId,
      user.id,
      {
        title: validation.data.title,
        description: validation.data.description,
        customization: validation.data.customization as any,
        status: validation.data.status,
        isPublic: validation.data.isPublic
      }
    )

    // Get updated media kit
    const userKits = await mediaKitService.getUserMediaKits(user.id)
    const updatedKit = userKits.find(kit => kit.id === mediaKitId)

    return successResponse({
      mediaKit: updatedKit
    }, 'Media kit updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Delete media kit
export async function DELETE(
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

    // Delete media kit (or archive it)
    await db
      .update(mediaKits)
      .set({
        status: 'archived',
        updatedAt: new Date()
      })
      .where(eq(mediaKits.id, mediaKitId))

    return successResponse({
      message: 'Media kit archived successfully'
    }, 'Media kit archived successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

