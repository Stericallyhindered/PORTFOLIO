import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'
import { backupRecoveryService } from '@/lib/backup-recovery'

export const dynamic = 'force-dynamic';

const createBackupSchema = z.object({
  type: z.enum(['full', 'incremental', 'schema_only', 'data_only']).default('full'),
  description: z.string().optional(),
  compressionEnabled: z.boolean().default(true)
})

// GET - List backups
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') as any
    const status = searchParams.get('status') as any
    const limit = parseInt(searchParams.get('limit') || '50')

    const backups = await backupRecoveryService.listBackups(type, status, limit)
    const statistics = await backupRecoveryService.getBackupStatistics()
    const config = backupRecoveryService.getBackupConfig()

    return successResponse({
      backups,
      statistics,
      config
    }, 'Backups retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create backup
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = createBackupSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { type, description, compressionEnabled } = validation.data

    let backup
    if (type === 'full') {
      backup = await backupRecoveryService.createFullBackup(description, compressionEnabled)
    } else if (type === 'incremental') {
      // Get last backup time
      const backups = await backupRecoveryService.listBackups('full', 'completed', 1)
      const lastBackupTime = backups.length > 0 
        ? new Date(backups[0].startTime)
        : new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        
      backup = await backupRecoveryService.createIncrementalBackup(lastBackupTime, description)
    } else {
      // For schema_only and data_only, we'll use full backup for now
      // These would require more complex implementation
      backup = await backupRecoveryService.createFullBackup(description, compressionEnabled)
    }

    return successResponse({
      backup
    }, 'Backup created successfully', 201)

  } catch (error) {
    return handleApiError(error)
  }
}

