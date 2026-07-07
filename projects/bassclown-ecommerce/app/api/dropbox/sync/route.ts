import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response';
import { createDropboxSyncService } from '@/lib/dropbox-sync';
import { db, dropboxSyncSettings, dropboxSyncJobs, dropboxFiles } from '@/lib/db';
import { eq, and, desc, count } from 'drizzle-orm';

const syncRequestSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  refreshToken: z.string().optional(),
  syncPaths: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional()
});

export const dynamic = 'force-dynamic';

// POST - Start Dropbox sync
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate input
    const validation = syncRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return validationErrorResponse(errors);
    }

    const {
      accessToken,
      clientId,
      clientSecret,
      refreshToken,
      syncPaths,
      excludePatterns,
      maxFileSize,
      allowedFileTypes
    } = validation.data;

    // Create Dropbox sync service
    const dropboxService = createDropboxSyncService({
      accessToken,
      clientId,
      clientSecret,
      refreshToken
    });

    // Initialize sync settings
    await dropboxService.initializeSync(user.id, {
      syncPaths,
      excludePatterns,
      maxFileSize,
      allowedFileTypes
    });

    // Start full sync
    const jobId = await dropboxService.startFullSync(user.id);

    return successResponse({
      jobId,
      message: 'Dropbox sync started successfully'
    }, 'Sync initiated');

  } catch (error) {
    return handleApiError(error);
  }
}

// GET - Get sync status
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get settings
    const [settings] = await db
      .select()
      .from(dropboxSyncSettings)
      .where(eq(dropboxSyncSettings.userId, user.id))
      .limit(1);

    if (!settings) {
      return successResponse({
        isEnabled: false,
        lastSync: undefined,
        totalFiles: 0,
        syncedFiles: 0,
        pendingFiles: 0,
        errorFiles: 0,
        currentJob: null
      }, 'Sync status retrieved');
    }

    // Get latest sync job
    const [latestJob] = await db
      .select()
      .from(dropboxSyncJobs)
      .where(eq(dropboxSyncJobs.userId, user.id))
      .orderBy(desc(dropboxSyncJobs.startedAt))
      .limit(1);

    // Get file counts
    const [syncedCount] = await db
      .select({ count: count() })
      .from(dropboxFiles)
      .where(and(
        eq(dropboxFiles.userId, user.id),
        eq(dropboxFiles.syncStatus, 'synced')
      ));

    const [pendingCount] = await db
      .select({ count: count() })
      .from(dropboxFiles)
      .where(and(
        eq(dropboxFiles.userId, user.id),
        eq(dropboxFiles.syncStatus, 'pending')
      ));

    const [errorCount] = await db
      .select({ count: count() })
      .from(dropboxFiles)
      .where(and(
        eq(dropboxFiles.userId, user.id),
        eq(dropboxFiles.syncStatus, 'error')
      ));

    const [totalCount] = await db
      .select({ count: count() })
      .from(dropboxFiles)
      .where(eq(dropboxFiles.userId, user.id));

    return successResponse({
      isEnabled: settings.enabled || false,
      lastSync: latestJob?.completedAt || latestJob?.startedAt || settings.lastSyncAt || undefined,
      totalFiles: totalCount?.count || 0,
      syncedFiles: syncedCount?.count || 0,
      pendingFiles: pendingCount?.count || 0,
      errorFiles: errorCount?.count || 0,
      currentJob: latestJob ? {
        id: latestJob.id,
        status: latestJob.status,
        progress: latestJob.totalFiles && latestJob.totalFiles > 0 && latestJob.processedFiles !== null
          ? ((latestJob.processedFiles || 0) / latestJob.totalFiles) * 100
          : 0,
        processedFiles: latestJob.processedFiles || 0,
        totalFiles: latestJob.totalFiles || 0,
        failedFiles: latestJob.failedFiles
      } : null
    }, 'Sync status retrieved');

  } catch (error) {
    return handleApiError(error);
  }
} 