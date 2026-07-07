import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError, notFoundResponse } from '@/lib/api-response'
import { backupRecoveryService } from '@/lib/backup-recovery'

export const dynamic = 'force-dynamic';

const restoreBackupSchema = z.object({
  restoreType: z.enum(['full', 'schema_only', 'data_only', 'selective']),
  selectedTables: z.array(z.string()).optional(),
  validateBeforeRestore: z.boolean().default(true),
  createBackupBeforeRestore: z.boolean().default(true),
  targetDatabase: z.string().optional()
})

// POST - Restore from backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ backupId: string }> }
) {
  try {
    await requireAdmin(request)
    const { backupId } = await params
    const body = await request.json()

    // Validate input
    const validation = restoreBackupSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const options = validation.data

    // Check if backup exists
    const backup = await backupRecoveryService.getBackupMetadata(backupId)
    if (!backup) {
      return notFoundResponse('Backup not found')
    }

    // Restore from backup
    await backupRecoveryService.restoreFromBackup({
      backupId,
      restoreType: options.restoreType,
      selectedTables: options.selectedTables,
      validateBeforeRestore: options.validateBeforeRestore,
      createBackupBeforeRestore: options.createBackupBeforeRestore,
      targetDatabase: options.targetDatabase
    })

    return successResponse({
      backupId,
      message: 'Backup restored successfully'
    }, 'Backup restored successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

