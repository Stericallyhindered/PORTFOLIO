import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { auditLogService } from '@/lib/audit-log'

export const dynamic = 'force-dynamic';

// GET - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined
    const resourceType = searchParams.get('resourceType') || undefined
    const resourceId = searchParams.get('resourceId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const logs = await auditLogService.getLogs({
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit,
      offset
    })

    const statistics = await auditLogService.getStatistics(
      startDate && endDate ? { startDate, endDate } : undefined
    )

    return successResponse({
      logs,
      statistics,
      pagination: {
        limit,
        offset,
        total: logs.length
      }
    }, 'Audit logs retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

