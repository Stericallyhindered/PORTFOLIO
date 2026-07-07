import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { adminNotificationService } from '@/lib/admin-notifications'

export const dynamic = 'force-dynamic';

// POST - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request)
    
    await adminNotificationService.markAllAsRead(adminUser.id)

    return successResponse({}, 'All notifications marked as read')

  } catch (error) {
    return handleApiError(error)
  }
}

