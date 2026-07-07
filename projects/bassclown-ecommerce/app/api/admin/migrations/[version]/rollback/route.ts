import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError, notFoundResponse } from '@/lib/api-response'
import { migrationService } from '@/lib/database-migrations'

export const dynamic = 'force-dynamic';

// POST - Rollback a migration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  try {
    await requireAdmin(request)
    const { version } = await params

    await migrationService.initialize()
    await migrationService.rollbackMigration(version)

    return successResponse({
      version,
      message: 'Migration rolled back successfully'
    }, 'Migration rolled back successfully')

  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return notFoundResponse(error.message)
    }
    return handleApiError(error)
  }
}

