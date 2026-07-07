import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { migrationService } from '@/lib/database-migrations'

export const dynamic = 'force-dynamic';

// GET - Get migration status
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    await migrationService.initialize()
    const status = await migrationService.getMigrationStatus()
    const stats = await migrationService.getStatistics()

    return successResponse({
      status,
      statistics: stats
    }, 'Migration status retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Run pending migrations
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    await migrationService.initialize()
    await migrationService.runPendingMigrations()

    const status = await migrationService.getMigrationStatus()

    return successResponse({
      status,
      message: 'Migrations completed successfully'
    }, 'Migrations completed successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

