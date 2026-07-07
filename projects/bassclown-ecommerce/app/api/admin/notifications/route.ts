import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { adminNotificationService, AdminNotificationType } from '@/lib/admin-notifications'

export const dynamic = 'force-dynamic';

// GET - Get admin notifications
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const priority = searchParams.get('priority')
    const type = searchParams.get('type') as AdminNotificationType | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const notifications = await adminNotificationService.getAdminNotifications(adminUser.id, {
      unreadOnly,
      priority: priority || undefined,
      type: type || undefined,
      limit
    })

    // Get notification stats
    const stats = await adminNotificationService.getNotificationStats(adminUser.id)

    return successResponse({
      notifications,
      stats
    }, 'Notifications retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

