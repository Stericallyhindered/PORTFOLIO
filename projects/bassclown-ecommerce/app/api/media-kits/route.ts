import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { mediaKitService } from '@/lib/media-kit-service'

export const dynamic = 'force-dynamic';

const createMediaKitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
  type: z.enum(['brand', 'creator', 'contest']),
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
  }).optional(),
  isPublic: z.boolean().optional()
})

// GET - Get user's media kits
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'brand' | 'creator' | 'contest' | null
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null

    const mediaKits = await mediaKitService.getUserMediaKits(user.id, type || undefined, status || undefined)

    return successResponse({
      mediaKits
    }, 'Media kits retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create new media kit
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = createMediaKitSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { title, description, templateId, type, customization, isPublic } = validation.data

    // Create media kit - the service will generate stats automatically
    if (!templateId) {
      return validationErrorResponse({ templateId: ['Template ID is required'] })
    }

    const mediaKitId = await mediaKitService.createMediaKit(
      user.id,
      templateId,
      title,
      type,
      {
        description
      }
    )

    // Get user's media kits to find the created one
    const userKits = await mediaKitService.getUserMediaKits(user.id)
    const mediaKit = userKits.find(kit => kit.id === mediaKitId)
    
    if (!mediaKit) {
      return handleApiError(new Error('Failed to retrieve created media kit'))
    }

    return successResponse({
      mediaKit
    }, 'Media kit created successfully', 201)

  } catch (error) {
    return handleApiError(error)
  }
}

