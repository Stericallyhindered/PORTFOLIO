import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { adminNotificationService } from '@/lib/admin-notifications'

export const dynamic = 'force-dynamic';

// PATCH - Mark notification as read or resolved
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request)
    const { id: notificationId } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'read') {
      await adminNotificationService.markAsRead(notificationId, adminUser.id)
      return successResponse({}, 'Notification marked as read')
    } else if (action === 'resolve') {
      await adminNotificationService.markAsResolved(notificationId, adminUser.id)
      return successResponse({}, 'Notification marked as resolved')
    } else {
      return handleApiError(new Error('Invalid action. Use "read" or "resolve"'))
    }

  } catch (error) {
    return handleApiError(error)
  }
}

