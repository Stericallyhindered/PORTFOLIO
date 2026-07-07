import { db } from '@/lib/db';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { DatabaseMigrationService } from '@/lib/database-migrations';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  storageLocation: 'local' | 's3' | 'gcs';
  storageConfig: any;
  includeTables: string[];
  excludeTables: string[];
  notificationEmails: string[];
}

export interface BackupMetadata {
  id: string;
  type: BackupType;
  status: BackupStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size: number;
  compressedSize?: number;
  location: string;
  checksum: string;
  version: string;
  metadata: any;
  errorMessage?: string;
}

export type BackupType = 
  | 'full'
  | 'incremental'
  | 'differential'
  | 'schema_only'
  | 'data_only'
  | 'manual';

export type BackupStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  restoreType: 'full' | 'schema_only' | 'data_only' | 'selective';
  selectedTables?: string[];
  pointInTime?: Date;
  validateBeforeRestore: boolean;
  createBackupBeforeRestore: boolean;
}

export interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  recoveryType: 'disaster' | 'corruption' | 'point_in_time' | 'migration';
  steps: RecoveryStep[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  rollbackPlan?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  type: 'backup' | 'restore' | 'migration' | 'validation' | 'notification';
  command?: string;
  parameters: any;
  dependencies: string[];
  timeout: number;
  retryAttempts: number;
  critical: boolean;
}

export class BackupRecoveryService {
  private static instance: BackupRecoveryService;
  private migrationService: DatabaseMigrationService;
  private backupDir: string;
  private config: BackupConfig;

  public static getInstance(): BackupRecoveryService {
    if (!BackupRecoveryService.instance) {
      BackupRecoveryService.instance = new BackupRecoveryService();
    }
    return BackupRecoveryService.instance;
  }

  constructor() {
    this.migrationService = new DatabaseMigrationService();
    // Use /tmp on serverless environments (Vercel, AWS Lambda)
    // Check multiple indicators since VERCEL env var may not always be set
    const isServerless = !!(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.VERCEL_ENV ||
      process.cwd().startsWith('/var/task')
    );
    this.backupDir = isServerless ? '/tmp/backups' : path.join(process.cwd(), 'backups');
    this.config = this.getDefaultConfig();
    // Don't call ensureBackupDirectory in constructor — it's async and
    // constructors can't await. We'll ensure it lazily before each operation.
  }

  // Get default backup configuration
  private getDefaultConfig(): BackupConfig {
    return {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retentionDays: 30,
      compressionEnabled: true,
      encryptionEnabled: false,
      storageLocation: 'local',
      storageConfig: {},
      includeTables: [],
      excludeTables: ['admin_analytics', 'file_uploads'],
      notificationEmails: []
    };
  }

  // Ensure backup directory exists
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  // Create full database backup
  async createFullBackup(
    description?: string,
    compressionEnabled: boolean = true
  ): Promise<BackupMetadata> {
    await this.ensureBackupDirectory();
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    const metadata: BackupMetadata = {
      id: backupId,
      type: 'full',
      status: 'running',
      startTime,
      size: 0,
      location: '',
      checksum: '',
      version: await this.getDatabaseVersion(),
      metadata: {
        description,
        compressionEnabled,
        tables: await this.getAllTableNames()
      }
    };

    try {
      // Create backup file path
      const fileName = `${backupId}.sql${compressionEnabled ? '.gz' : ''}`;
      const filePath = path.join(this.backupDir, fileName);
      metadata.location = filePath;

      // Generate SQL dump
      const sqlDump = await this.generateSQLDump();
      
      // Write to file with optional compression
      if (compressionEnabled) {
        await this.writeCompressedFile(filePath, sqlDump);
      } else {
        await fs.writeFile(filePath, sqlDump, 'utf8');
      }

      // Calculate file size and checksum
      const stats = await fs.stat(filePath);
      metadata.size = Buffer.byteLength(sqlDump, 'utf8');
      metadata.compressedSize = stats.size;
      metadata.checksum = await this.calculateChecksum(sqlDump);
      
      // Update metadata
      metadata.endTime = new Date();
      metadata.duration = metadata.endTime.getTime() - startTime.getTime();
      metadata.status = 'completed';

      // Store backup metadata
      await this.storeBackupMetadata(metadata);

      // Clean up old backups
      await this.cleanupOldBackups();

      return metadata;

    } catch (error) {
      metadata.status = 'failed';
      metadata.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metadata.endTime = new Date();
      
      await this.storeBackupMetadata(metadata);
      throw error;
    }
  }

  // Create incremental backup (ensures backup dir exists)
  async createIncrementalBackup(
    lastBackupTime: Date,
    description?: string
  ): Promise<BackupMetadata> {
    await this.ensureBackupDirectory();
    const backupId = `incremental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    const metadata: BackupMetadata = {
      id: backupId,
      type: 'incremental',
      status: 'running',
      startTime,
      size: 0,
      location: '',
      checksum: '',
      version: await this.getDatabaseVersion(),
      metadata: {
        description,
        lastBackupTime,
        compressionEnabled: true
      }
    };

    try {
      // Generate incremental SQL dump
      const sqlDump = await this.generateIncrementalSQLDump(lastBackupTime);
      
      // Create backup file
      const fileName = `${backupId}.sql.gz`;
      const filePath = path.join(this.backupDir, fileName);
      metadata.location = filePath;

      await this.writeCompressedFile(filePath, sqlDump);

      // Update metadata
      const stats = await fs.stat(filePath);
      metadata.size = Buffer.byteLength(sqlDump, 'utf8');
      metadata.compressedSize = stats.size;
      metadata.checksum = await this.calculateChecksum(sqlDump);
      metadata.endTime = new Date();
      metadata.duration = metadata.endTime.getTime() - startTime.getTime();
      metadata.status = 'completed';

      await this.storeBackupMetadata(metadata);
      return metadata;

    } catch (error) {
      metadata.status = 'failed';
      metadata.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metadata.endTime = new Date();
      
      await this.storeBackupMetadata(metadata);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(options: RestoreOptions): Promise<void> {
    const backup = await this.getBackupMetadata(options.backupId);
    if (!backup) {
      throw new Error(`Backup ${options.backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup ${options.backupId} is not in completed status`);
    }

    // Create backup before restore if requested
    if (options.createBackupBeforeRestore) {
      await this.createFullBackup('Pre-restore backup');
    }

    try {
      // Validate backup integrity
      if (options.validateBeforeRestore) {
        await this.validateBackup(options.backupId);
      }

      // Read backup file
      const sqlContent = await this.readBackupFile(backup.location);

      // Apply restore based on type
      switch (options.restoreType) {
        case 'full':
          await this.restoreFullDatabase(sqlContent);
          break;
        case 'schema_only':
          await this.restoreSchemaOnly(sqlContent);
          break;
        case 'data_only':
          await this.restoreDataOnly(sqlContent);
          break;
        case 'selective':
          if (!options.selectedTables) {
            throw new Error('Selected tables required for selective restore');
          }
          await this.restoreSelectedTables(sqlContent, options.selectedTables);
          break;
      }

    } catch (error) {
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate SQL dump of entire database
  private async generateSQLDump(): Promise<string> {
    const tables = await this.getAllTableNames();
    let sqlDump = '';

    // Add header
    sqlDump += `-- Bass Clown Co Database Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database Version: ${await this.getDatabaseVersion()}\n\n`;

    // Add schema and data for each table
    for (const tableName of tables) {
      if (this.config.excludeTables.includes(tableName)) {
        continue;
      }

      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += await this.getTableSchema(tableName);
      sqlDump += '\n';
      sqlDump += await this.getTableData(tableName);
      sqlDump += '\n\n';
    }

    return sqlDump;
  }

  // Generate incremental SQL dump
  private async generateIncrementalSQLDump(since: Date): Promise<string> {
    const tables = await this.getAllTableNames();
    let sqlDump = '';

    sqlDump += `-- Bass Clown Co Incremental Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Since: ${since.toISOString()}\n\n`;

    for (const tableName of tables) {
      if (this.config.excludeTables.includes(tableName)) {
        continue;
      }

      const changedData = await this.getChangedTableData(tableName, since);
      if (changedData) {
        sqlDump += `-- Table: ${tableName} (changes since ${since.toISOString()})\n`;
        sqlDump += changedData;
        sqlDump += '\n\n';
      }
    }

    return sqlDump;
  }

  // Get all table names
  private async getAllTableNames(): Promise<string[]> {
    // This would query the database schema to get all table names
    // For now, return the known tables from our schema
    return [
      'users', 'contests', 'contest_applications', 'contest_submissions',
      'giveaways', 'giveaway_entries', 'giveaway_winners',
      'points_transactions', 'payment_history', 'file_uploads',
      'notifications', 'user_settings', 'admin_analytics',
      'contest_judges', 'judge_scores', 'judging_sessions', 'judge_discussions',
      'media_kit_templates', 'media_kits', 'media_kit_assets', 'media_kit_analytics',
      'dropbox_sync_settings', 'dropbox_sync_jobs', 'dropbox_files',
      'w9_forms', 'brand_collaborations', 'brand_proposals',
      'collaboration_messages', 'brand_contracts'
    ];
  }

  // Get table schema as SQL
  private async getTableSchema(tableName: string): Promise<string> {
    // This would generate CREATE TABLE statement for the table
    // For now, return a placeholder
    return `-- Schema for ${tableName} would be generated here\n`;
  }

  // Get table data as SQL INSERT statements
  private async getTableData(tableName: string): Promise<string> {
    // This would generate INSERT statements for all data in the table
    // For now, return a placeholder
    return `-- Data for ${tableName} would be generated here\n`;
  }

  // Get changed table data since a specific date
  private async getChangedTableData(tableName: string, since: Date): Promise<string | null> {
    // This would query for records changed since the given date
    // Tables need updated_at or created_at columns for this to work
    return `-- Changed data for ${tableName} since ${since.toISOString()}\n`;
  }

  // Get database version
  private async getDatabaseVersion(): Promise<string> {
    // This would query the database version
    return '1.0.0';
  }

  // Write compressed file
  private async writeCompressedFile(filePath: string, content: string): Promise<void> {
    const writeStream = createWriteStream(filePath);
    const gzipStream = createGzip();
    
    await pipeline(
      async function* () {
        yield Buffer.from(content, 'utf8');
      },
      gzipStream,
      writeStream
    );
  }

  // Read backup file (handles compression)
  private async readBackupFile(filePath: string): Promise<string> {
    if (filePath.endsWith('.gz')) {
      return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        const readStream = createReadStream(filePath);
        const gunzipStream = createGunzip();

        gunzipStream.on('data', (chunk) => chunks.push(chunk));
        gunzipStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        gunzipStream.on('error', reject);

        readStream.pipe(gunzipStream);
      });
    } else {
      return fs.readFile(filePath, 'utf8');
    }
  }

  // Calculate checksum
  private async calculateChecksum(content: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Store backup metadata
  private async storeBackupMetadata(metadata: BackupMetadata): Promise<void> {
    await this.ensureBackupDirectory();
    const metadataPath = path.join(this.backupDir, `${metadata.id}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  // Get backup metadata
  async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = path.join(this.backupDir, `${backupId}.json`);
      const content = await fs.readFile(metadataPath, 'utf8');
      if (!content || content === 'undefined') {
        return null;
      }
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // List all backups
  async listBackups(
    type?: BackupType,
    status?: BackupStatus,
    limit: number = 50
  ): Promise<BackupMetadata[]> {
    try {
      await this.ensureBackupDirectory();
      const files = await fs.readdir(this.backupDir);
      const metadataFiles = files.filter(f => f.endsWith('.json'));
      
      const backups: BackupMetadata[] = [];
      
      for (const file of metadataFiles) {
        try {
          const content = await fs.readFile(path.join(this.backupDir, file), 'utf8');
          const metadata = JSON.parse(content);
          
          if (type && metadata.type !== type) continue;
          if (status && metadata.status !== status) continue;
          
          backups.push(metadata);
        } catch {
          // Skip invalid metadata files
        }
      }

      return backups
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // Validate backup integrity
  async validateBackup(backupId: string): Promise<boolean> {
    const metadata = await this.getBackupMetadata(backupId);
    if (!metadata) {
      throw new Error(`Backup ${backupId} not found`);
    }

    try {
      // Check if file exists
      await fs.access(metadata.location);

      // Read content and verify checksum
      const content = await this.readBackupFile(metadata.location);
      const calculatedChecksum = await this.calculateChecksum(content);

      if (calculatedChecksum !== metadata.checksum) {
        throw new Error('Backup checksum validation failed');
      }

      return true;
    } catch (error) {
      throw new Error(`Backup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Clean up old backups based on retention policy
  private async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const backups = await this.listBackups();
    
    for (const backup of backups) {
      if (new Date(backup.startTime) < cutoffDate && backup.status === 'completed') {
        try {
          // Delete backup file
          await fs.unlink(backup.location);
          
          // Delete metadata file
          const metadataPath = path.join(this.backupDir, `${backup.id}.json`);
          await fs.unlink(metadataPath);
        } catch {
          // Continue if file deletion fails
        }
      }
    }
  }

  // Restore full database
  private async restoreFullDatabase(sqlContent: string): Promise<void> {
    // This would execute the SQL content to restore the entire database
    // Implementation would depend on the database driver and connection
    console.log('Restoring full database...');
  }

  // Restore schema only
  private async restoreSchemaOnly(sqlContent: string): Promise<void> {
    // Extract and execute only CREATE TABLE statements
    console.log('Restoring schema only...');
  }

  // Restore data only
  private async restoreDataOnly(sqlContent: string): Promise<void> {
    // Extract and execute only INSERT statements
    console.log('Restoring data only...');
  }

  // Restore selected tables
  private async restoreSelectedTables(sqlContent: string, tables: string[]): Promise<void> {
    // Extract and execute statements for selected tables only
    console.log(`Restoring selected tables: ${tables.join(', ')}`);
  }

  // Create recovery plan
  async createRecoveryPlan(
    name: string,
    description: string,
    recoveryType: 'disaster' | 'corruption' | 'point_in_time' | 'migration'
  ): Promise<RecoveryPlan> {
    const plan: RecoveryPlan = {
      id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      recoveryType,
      steps: this.generateRecoverySteps(recoveryType),
      estimatedTime: this.calculateEstimatedTime(recoveryType),
      riskLevel: this.assessRiskLevel(recoveryType),
      prerequisites: this.getPrerequisites(recoveryType),
      rollbackPlan: this.generateRollbackPlan(recoveryType),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store recovery plan
    const planPath = path.join(this.backupDir, 'recovery_plans', `${plan.id}.json`);
    await fs.mkdir(path.dirname(planPath), { recursive: true });
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));

    return plan;
  }

  // Generate recovery steps based on type
  private generateRecoverySteps(recoveryType: string): RecoveryStep[] {
    const baseSteps: RecoveryStep[] = [
      {
        id: 'step_1',
        name: 'Assess Situation',
        description: 'Evaluate the extent of the issue and determine recovery requirements',
        type: 'validation',
        parameters: {},
        dependencies: [],
        timeout: 300,
        retryAttempts: 0,
        critical: true
      },
      {
        id: 'step_2',
        name: 'Create Pre-Recovery Backup',
        description: 'Create a backup of current state before starting recovery',
        type: 'backup',
        parameters: { type: 'full', description: 'Pre-recovery backup' },
        dependencies: ['step_1'],
        timeout: 1800,
        retryAttempts: 2,
        critical: true
      }
    ];

    switch (recoveryType) {
      case 'disaster':
        return [
          ...baseSteps,
          {
            id: 'step_3',
            name: 'Restore from Latest Backup',
            description: 'Restore database from the most recent valid backup',
            type: 'restore',
            parameters: { restoreType: 'full', validateBeforeRestore: true },
            dependencies: ['step_2'],
            timeout: 3600,
            retryAttempts: 1,
            critical: true
          }
        ];

      case 'corruption':
        return [
          ...baseSteps,
          {
            id: 'step_3',
            name: 'Identify Corrupted Tables',
            description: 'Scan database to identify corrupted tables',
            type: 'validation',
            parameters: { scanType: 'corruption' },
            dependencies: ['step_2'],
            timeout: 600,
            retryAttempts: 0,
            critical: true
          },
          {
            id: 'step_4',
            name: 'Selective Restore',
            description: 'Restore only corrupted tables from backup',
            type: 'restore',
            parameters: { restoreType: 'selective' },
            dependencies: ['step_3'],
            timeout: 1800,
            retryAttempts: 1,
            critical: true
          }
        ];

      default:
        return baseSteps;
    }
  }

  // Calculate estimated recovery time
  private calculateEstimatedTime(recoveryType: string): number {
    switch (recoveryType) {
      case 'disaster': return 120; // 2 hours
      case 'corruption': return 60; // 1 hour
      case 'point_in_time': return 90; // 1.5 hours
      case 'migration': return 180; // 3 hours
      default: return 60;
    }
  }

  // Assess risk level
  private assessRiskLevel(recoveryType: string): 'low' | 'medium' | 'high' {
    switch (recoveryType) {
      case 'disaster': return 'high';
      case 'corruption': return 'medium';
      case 'point_in_time': return 'medium';
      case 'migration': return 'low';
      default: return 'medium';
    }
  }

  // Get prerequisites
  private getPrerequisites(recoveryType: string): string[] {
    const base = [
      'Valid database backups available',
      'Administrative access to database',
      'Sufficient storage space',
      'Notification of stakeholders'
    ];

    switch (recoveryType) {
      case 'disaster':
        return [...base, 'Alternative hosting environment ready', 'DNS redirection capability'];
      case 'migration':
        return [...base, 'Migration scripts tested', 'Rollback plan verified'];
      default:
        return base;
    }
  }

  // Generate rollback plan
  private generateRollbackPlan(recoveryType: string): string[] {
    return [
      'Stop all application processes',
      'Create snapshot of current state',
      'Restore from pre-recovery backup',
      'Verify system integrity',
      'Resume normal operations',
      'Notify stakeholders of rollback'
    ];
  }

  // Execute recovery plan
  async executeRecoveryPlan(planId: string): Promise<void> {
    const planPath = path.join(this.backupDir, 'recovery_plans', `${planId}.json`);
    const planContent = await fs.readFile(planPath, 'utf8');
    const plan: RecoveryPlan = JSON.parse(planContent);

    console.log(`Executing recovery plan: ${plan.name}`);
    
    for (const step of plan.steps) {
      console.log(`Executing step: ${step.name}`);
      
      try {
        await this.executeRecoveryStep(step);
        console.log(`Step completed: ${step.name}`);
      } catch (error) {
        console.error(`Step failed: ${step.name}`, error);
        
        if (step.critical) {
          throw new Error(`Critical step failed: ${step.name}`);
        }
      }
    }
  }

  // Execute individual recovery step
  private async executeRecoveryStep(step: RecoveryStep): Promise<void> {
    switch (step.type) {
      case 'backup':
        await this.createFullBackup(step.parameters.description);
        break;
      case 'restore':
        // Would implement restore logic based on parameters
        break;
      case 'validation':
        // Would implement validation logic
        break;
      case 'notification':
        // Would send notifications
        break;
      default:
        console.log(`Executing custom step: ${step.name}`);
    }
  }

  // Get backup statistics
  async getBackupStatistics(): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackupTime?: Date;
    oldestBackupTime?: Date;
    successRate: number;
    averageBackupTime: number;
  }> {
    const backups = await this.listBackups();
    
    const totalBackups = backups.length;
    const completedBackups = backups.filter(b => b.status === 'completed');
    const totalSize = completedBackups.reduce((sum, b) => sum + (b.compressedSize || b.size), 0);
    
    const lastBackupTime = completedBackups.length > 0 
      ? new Date(Math.max(...completedBackups.map(b => new Date(b.startTime).getTime())))
      : undefined;
    
    const oldestBackupTime = completedBackups.length > 0
      ? new Date(Math.min(...completedBackups.map(b => new Date(b.startTime).getTime())))
      : undefined;
    
    const successRate = totalBackups > 0 ? (completedBackups.length / totalBackups) * 100 : 0;
    
    const averageBackupTime = completedBackups.length > 0
      ? completedBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBackups.length
      : 0;

    return {
      totalBackups,
      totalSize,
      lastBackupTime,
      oldestBackupTime,
      successRate,
      averageBackupTime
    };
  }

  // Update backup configuration
  async updateBackupConfig(config: Partial<BackupConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Save configuration to file
    await this.ensureBackupDirectory();
    const configPath = path.join(this.backupDir, 'backup_config.json');
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
  }

  // Get current backup configuration
  getBackupConfig(): BackupConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const backupRecoveryService = BackupRecoveryService.getInstance(); 