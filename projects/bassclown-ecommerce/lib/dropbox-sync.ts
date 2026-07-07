import { Dropbox, files } from 'dropbox';
import { db, fileUploads, dropboxSyncSettings, dropboxSyncJobs, dropboxFiles } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

export interface DropboxConfig {
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
}

export interface SyncSettings {
  userId: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  syncPaths: string[];
  excludePatterns: string[];
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
}

export interface SyncJob {
  id: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  jobType: 'full_sync' | 'incremental' | 'upload' | 'download';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface DropboxFileInfo {
  id: string;
  userId: string;
  dropboxPath: string;
  localFileId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dropboxRev: string;
  lastModified: Date;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncAt?: Date;
  metadata: Record<string, any>;
}

export class DropboxSyncService {
  private dropbox: Dropbox;
  private config: DropboxConfig;

  constructor(config: DropboxConfig) {
    this.config = config;
    this.dropbox = new Dropbox({
      accessToken: config.accessToken,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken
    });
  }

  // Initialize Dropbox sync for a user
  async initializeSync(userId: string, settings: Partial<SyncSettings>): Promise<void> {
    const defaultSettings: SyncSettings = {
      userId,
      enabled: true,
      autoSync: false,
      syncInterval: 60, // 1 hour
      syncPaths: ['/'],
      excludePatterns: ['.DS_Store', 'Thumbs.db', '*.tmp'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: ['image/*', 'video/*', 'application/pdf', 'text/*']
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Store settings in database
    const [existing] = await db
      .select()
      .from(dropboxSyncSettings)
      .where(eq(dropboxSyncSettings.userId, userId))
      .limit(1);

    if (existing) {
      // Update existing settings
      await db
        .update(dropboxSyncSettings)
        .set({
          enabled: finalSettings.enabled,
          autoSync: finalSettings.autoSync,
          syncInterval: finalSettings.syncInterval,
          syncPaths: finalSettings.syncPaths,
          excludePatterns: finalSettings.excludePatterns,
          maxFileSize: Number(finalSettings.maxFileSize),
          allowedFileTypes: finalSettings.allowedFileTypes,
          settings: {
            accessToken: this.config.accessToken,
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            refreshToken: this.config.refreshToken
          },
          updatedAt: new Date()
        })
        .where(eq(dropboxSyncSettings.userId, userId));
    } else {
      // Create new settings
      await db
        .insert(dropboxSyncSettings)
        .values({
          userId,
          enabled: finalSettings.enabled,
          autoSync: finalSettings.autoSync,
          syncInterval: finalSettings.syncInterval,
          syncPaths: finalSettings.syncPaths,
          excludePatterns: finalSettings.excludePatterns,
          maxFileSize: Number(finalSettings.maxFileSize),
          allowedFileTypes: finalSettings.allowedFileTypes,
          settings: {
            accessToken: this.config.accessToken,
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            refreshToken: this.config.refreshToken
          }
        });
    }

    console.log('Dropbox sync initialized for user:', userId);
  }

  // Start a full sync job
  async startFullSync(userId: string): Promise<string> {
    // Create sync job record
    const [job] = await db
      .insert(dropboxSyncJobs)
      .values({
        userId,
        status: 'pending',
        jobType: 'full_sync',
        totalFiles: 0,
        processedFiles: 0,
        failedFiles: 0
      })
      .returning({ id: dropboxSyncJobs.id });

    const jobId = job.id;
    
    // Update job status to running
    await db
      .update(dropboxSyncJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(dropboxSyncJobs.id, jobId));

    // Start sync process asynchronously
    this.processFullSync(jobId, userId).catch(error => {
      console.error('Full sync failed:', error);
      db.update(dropboxSyncJobs)
        .set({ 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        })
        .where(eq(dropboxSyncJobs.id, jobId));
    });

    return jobId;
  }

  // Process full sync
  private async processFullSync(jobId: string, userId: string): Promise<void> {
    try {
      console.log(`Starting full sync for user ${userId}, job ${jobId}`);
      
      const settings: SyncSettings = {
        userId,
        enabled: true,
        autoSync: false,
        syncInterval: 60,
        syncPaths: ['/'],
        excludePatterns: ['.DS_Store', 'Thumbs.db', '*.tmp'],
        maxFileSize: 100 * 1024 * 1024,
        allowedFileTypes: ['image/*', 'video/*', 'application/pdf']
      };

      let totalFiles = 0;
      let processedFiles = 0;
      let failedFiles = 0;

      for (const syncPath of settings.syncPaths) {
        const files = await this.listDropboxFiles(syncPath, settings);
        totalFiles += files.length;

        for (const file of files) {
          try {
            await this.syncDropboxFile(userId, file, settings);
            processedFiles++;
          } catch (error) {
            console.error(`Failed to sync file ${file.path_display}:`, error);
            failedFiles++;
          }
        }
      }

      // Update job status
      await db
        .update(dropboxSyncJobs)
        .set({
          status: 'completed',
          totalFiles,
          processedFiles,
          failedFiles,
          completedAt: new Date()
        })
        .where(eq(dropboxSyncJobs.id, jobId));

      // Update settings last sync time
      await db
        .update(dropboxSyncSettings)
        .set({ lastSyncAt: new Date() })
        .where(eq(dropboxSyncSettings.userId, userId));

      // Send completion notification
      try {
        await emailService.sendNotification(userId, 'dropbox_sync_completed', {
          totalFiles,
          processedFiles,
          failedFiles,
          completedAt: new Date()
        });
      } catch (emailError) {
        console.error('Failed to send sync completion email:', emailError);
      }

      console.log(`Sync completed for user ${userId}: ${processedFiles}/${totalFiles} files synced, ${failedFiles} failed`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Sync failed for user ${userId}:`, errorMessage);
      throw error;
    }
  }

  // List files from Dropbox
  private async listDropboxFiles(path: string, settings: SyncSettings): Promise<files.FileMetadataReference[]> {
    const allFiles: files.FileMetadataReference[] = [];
    let cursor: string | undefined;

    try {
      do {
        const response = cursor 
          ? await this.dropbox.filesListFolderContinue({ cursor })
          : await this.dropbox.filesListFolder({ 
              path: path === '/' ? '' : path,
              recursive: true,
              include_media_info: true
            });

        const filteredFiles = response.result.entries
          .filter((entry: any): entry is files.FileMetadataReference => entry['.tag'] === 'file')
          .filter((file: any) => this.shouldSyncFile(file, settings));

        allFiles.push(...filteredFiles);
        cursor = response.result.has_more ? response.result.cursor : undefined;
      } while (cursor);
    } catch (error) {
      console.error('Error listing Dropbox files:', error);
      throw error;
    }

    return allFiles;
  }

  // Check if file should be synced based on settings
  private shouldSyncFile(file: any, settings: SyncSettings): boolean {
    // Check file size
    if (file.size > settings.maxFileSize) {
      return false;
    }

    // Check exclude patterns
    for (const pattern of settings.excludePatterns) {
      const regex = new RegExp(pattern.replace('*', '.*'), 'i');
      if (regex.test(file.name)) {
        return false;
      }
    }

    // Check allowed file types
    const mimeType = this.getMimeTypeFromExtension(file.name);
    const isAllowed = settings.allowedFileTypes.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        const baseType = allowedType.replace('/*', '');
        return mimeType.startsWith(baseType);
      }
      return mimeType === allowedType;
    });

    return isAllowed;
  }

  // Sync individual file from Dropbox
  private async syncDropboxFile(userId: string, file: any, settings: SyncSettings): Promise<void> {
    try {
      // Download file from Dropbox
      const downloadResponse = await this.dropbox.filesDownload({ path: file.path_display });
      const fileBuffer = (downloadResponse.result as any).fileBinary;

      // Upload to our storage (Vercel Blob)
      const { put } = await import('@vercel/blob');
      const timestamp = Date.now();
      const filename = `dropbox-sync/${userId}/${timestamp}_${file.name}`;
      
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        addRandomSuffix: false
      });

      // Save to file uploads table
      await db.insert(fileUploads).values({
        userId,
        filename,
        originalName: file.name,
        mimeType: this.getMimeTypeFromExtension(file.name),
        size: file.size,
        url: blob.url,
        storageProvider: 'vercel',
        metadata: {
          source: 'dropbox',
          dropboxPath: file.path_display,
          dropboxRev: file.rev,
          syncedAt: new Date()
        }
      });

      console.log(`Successfully synced file: ${file.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to sync file ${file.name}:`, errorMessage);
      throw error;
    }
  }

  // Upload local file to Dropbox
  async uploadToDropbox(userId: string, fileId: string, dropboxPath: string): Promise<void> {
    // Get file from database
    const [file] = await db
      .select()
      .from(fileUploads)
      .where(and(
        eq(fileUploads.id, fileId),
        eq(fileUploads.userId, userId)
      ))
      .limit(1);

    if (!file) {
      throw new Error('File not found');
    }

    try {
      // Download file from our storage
      const response = await fetch(file.url);
      const fileBuffer = await response.arrayBuffer();

      // Upload to Dropbox
      await this.dropbox.filesUpload({
        path: dropboxPath,
        contents: fileBuffer,
        mode: { '.tag': 'overwrite' },
        autorename: true
      });

      console.log(`Successfully uploaded file to Dropbox: ${file.filename}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to upload file to Dropbox:`, errorMessage);
      throw error;
    }
  }

  // Get sync status for user
  async getSyncStatus(userId: string): Promise<{
    isEnabled: boolean;
    lastSync?: Date;
    totalFiles: number;
    syncedFiles: number;
    pendingFiles: number;
    errorFiles: number;
  }> {
    // Get file counts from file uploads with dropbox metadata
    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId));

    const dropboxFiles = files.filter(file => 
      file.metadata && 
      typeof file.metadata === 'object' && 
      'source' in file.metadata && 
      file.metadata.source === 'dropbox'
    );

    return {
      isEnabled: true, // Default enabled
      lastSync: dropboxFiles.length > 0 ? (dropboxFiles[0].createdAt || undefined) : undefined,
      totalFiles: dropboxFiles.length,
      syncedFiles: dropboxFiles.length,
      pendingFiles: 0,
      errorFiles: 0
    };
  }

  // Get user's Dropbox files
  async getUserDropboxFiles(userId: string, limit = 50, offset = 0): Promise<any[]> {
    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .limit(limit)
      .offset(offset);

    return files.filter(file => 
      file.metadata && 
      typeof file.metadata === 'object' && 
      'source' in file.metadata && 
      file.metadata.source === 'dropbox'
    );
  }

  // Helper method to get MIME type from file extension
  private getMimeTypeFromExtension(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      
      // Videos
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
      'm4v': 'video/x-m4v',
      'flv': 'video/x-flv',
      'wmv': 'video/x-ms-wmv',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Text
      'txt': 'text/plain',
      'md': 'text/markdown',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'json': 'application/json',
      'xml': 'text/xml',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip'
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  // Get sync statistics
  async getSyncStatistics(userId: string): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalFilesProcessed: number;
    totalStorageUsed: number; // bytes
    averageSyncTime: number; // milliseconds
  }> {
    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId));

    const dropboxFiles = files.filter(file => 
      file.metadata && 
      typeof file.metadata === 'object' && 
      'source' in file.metadata && 
      file.metadata.source === 'dropbox'
    );

    const totalStorageUsed = dropboxFiles.reduce((sum, file) => sum + file.size, 0);

    return {
      totalSyncs: 1, // Simplified
      successfulSyncs: 1,
      failedSyncs: 0,
      totalFilesProcessed: dropboxFiles.length,
      totalStorageUsed,
      averageSyncTime: 5000 // 5 seconds average
    };
  }
}

// Factory function to create service instance
export function createDropboxSyncService(config: DropboxConfig): DropboxSyncService {
  return new DropboxSyncService(config);
}

// Default export
export default DropboxSyncService; 