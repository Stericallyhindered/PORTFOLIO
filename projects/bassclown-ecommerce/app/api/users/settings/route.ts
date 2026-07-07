import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, users, userSettings } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  contestUpdates: z.boolean().optional(),
  giveawayUpdates: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional()
})

export const dynamic = 'force-dynamic';

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get user settings, create default if not exists
    let [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1)

    if (!settings) {
      // Create default settings
      [settings] = await db
        .insert(userSettings)
        .values({
          userId: user.id,
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
          contestUpdates: true,
          giveawayUpdates: true,
          theme: 'light',
          timezone: 'UTC',
          language: 'en'
        })
        .returning()
    }

    return successResponse(settings, 'Settings retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    // Validate input
    const validation = updateSettingsSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const updateData = validation.data

    // Check if settings exist
    const [existingSettings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1)

    let updatedSettings

    if (existingSettings) {
      // Update existing settings
      [updatedSettings] = await db
        .update(userSettings)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(userSettings.userId, user.id))
        .returning()
    } else {
      // Create new settings with defaults and updates
      [updatedSettings] = await db
        .insert(userSettings)
        .values({
          userId: user.id,
          emailNotifications: updateData.emailNotifications ?? true,
          pushNotifications: updateData.pushNotifications ?? true,
          marketingEmails: updateData.marketingEmails ?? false,
          contestUpdates: updateData.contestUpdates ?? true,
          giveawayUpdates: updateData.giveawayUpdates ?? true,
          theme: updateData.theme ?? 'light',
          timezone: updateData.timezone ?? 'UTC',
          language: updateData.language ?? 'en'
        })
        .returning()
    }

    return successResponse(updatedSettings, 'Settings updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 