import { db } from './db';
import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Migration history table
export const migrationHistory = pgTable('migration_history', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  version: text('version').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  filename: text('filename').notNull(),
  checksum: text('checksum').notNull(),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  executionTime: integer('execution_time_ms'),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  rollbackScript: text('rollback_script')
});

// Migration interface
export interface Migration {
  version: string;
  name: string;
  description?: string;
  up: string;
  down?: string;
  dependencies?: string[];
  checksum?: string;
}

// Migration status
export interface MigrationStatus {
  version: string;
  name: string;
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
  appliedAt?: Date;
  executionTime?: number;
  error?: string;
}

// Migration service class
export class DatabaseMigrationService {
  private migrationsPath: string;

  constructor(migrationsPath = './migrations') {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize the migration system
   */
  async initialize(): Promise<void> {
    try {
      // Create migration_history table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          version TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          filename TEXT NOT NULL,
          checksum TEXT NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW() NOT NULL,
          execution_time_ms INTEGER,
          success BOOLEAN NOT NULL DEFAULT true,
          error_message TEXT,
          rollback_script TEXT
        );
      `);

      // Create migrations directory if it doesn't exist
      try {
        await fs.access(this.migrationsPath);
      } catch {
        await fs.mkdir(this.migrationsPath, { recursive: true });
      }

      console.log('Database migration system initialized');
    } catch (error) {
      console.error('Failed to initialize migration system:', error);
      throw error;
    }
  }

  /**
   * Generate a new migration file
   */
  async generateMigration(
    name: string,
    description?: string,
    upScript?: string,
    downScript?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const version = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const filename = `${version}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    const migrationContent = this.generateMigrationTemplate(
      version,
      name,
      description,
      upScript,
      downScript
    );

    await fs.writeFile(filepath, migrationContent, 'utf8');
    
    console.log(`Generated migration: ${filename}`);
    return filepath;
  }

  /**
   * Generate migration template
   */
  private generateMigrationTemplate(
    version: string,
    name: string,
    description?: string,
    upScript?: string,
    downScript?: string
  ): string {
    return `-- Migration: ${name}
-- Version: ${version}
-- Description: ${description || 'No description provided'}
-- Created: ${new Date().toISOString()}

-- ==== UP MIGRATION ====
${upScript || '-- Add your up migration script here'}

-- ==== DOWN MIGRATION ====
-- This section is used for rollbacks
${downScript || '-- Add your rollback script here (optional)'}

-- ==== METADATA ====
-- Dependencies: []
-- Tags: []
`;
  }

  /**
   * Parse migration file
   */
  async parseMigrationFile(filepath: string): Promise<Migration> {
    const content = await fs.readFile(filepath, 'utf8');
    const filename = path.basename(filepath);
    
    // Extract version from filename
    const versionMatch = filename.match(/^(\d{8}T\d{6}_[^.]+)/);
    if (!versionMatch) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    
    const version = versionMatch[1];
    
    // Extract metadata
    const nameMatch = content.match(/-- Migration: (.+)/);
    const descriptionMatch = content.match(/-- Description: (.+)/);
    const dependenciesMatch = content.match(/-- Dependencies: \[([^\]]*)\]/);
    
    const name = nameMatch?.[1] || 'Unnamed Migration';
    const description = descriptionMatch?.[1];
    const dependencies = dependenciesMatch?.[1] 
      ? dependenciesMatch[1].split(',').map(d => d.trim()).filter(Boolean)
      : [];

    // Extract up and down scripts
    const upMatch = content.match(/-- ==== UP MIGRATION ====\s*([\s\S]*?)(?=-- ==== DOWN MIGRATION ====|-- ==== METADATA ====|$)/);
    const downMatch = content.match(/-- ==== DOWN MIGRATION ====\s*([\s\S]*?)(?=-- ==== METADATA ====|$)/);
    
    const up = upMatch?.[1]?.trim() || '';
    const down = downMatch?.[1]?.trim() || '';

    // Calculate checksum
    const checksum = crypto.createHash('md5').update(content).digest('hex');

    return {
      version,
      name,
      description,
      up,
      down,
      dependencies,
      checksum
    };
  }

  /**
   * Get all migration files
   */
  async getAllMigrations(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort by filename (which includes timestamp)

      const migrations: Migration[] = [];
      for (const file of migrationFiles) {
        const filepath = path.join(this.migrationsPath, file);
        const migration = await this.parseMigrationFile(filepath);
        migrations.push(migration);
      }

      return migrations;
    } catch (error) {
      console.error('Failed to get migrations:', error);
      return [];
    }
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations(): Promise<MigrationStatus[]> {
    try {
      const result = await db.execute(sql`
        SELECT version, name, executed_at, execution_time_ms, success, error_message
        FROM migration_history
        ORDER BY executed_at ASC
      `);

      return result.rows.map(row => ({
        version: row.version as string,
        name: row.name as string,
        status: row.success ? 'applied' : 'failed',
        appliedAt: new Date(row.executed_at as string),
        executionTime: row.execution_time_ms as number,
        error: row.error_message as string
      }));
    } catch (error) {
      console.error('Failed to get applied migrations:', error);
      return [];
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    pending: MigrationStatus[];
    applied: MigrationStatus[];
    failed: MigrationStatus[];
  }> {
    const allMigrations = await this.getAllMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    const pending: MigrationStatus[] = allMigrations
      .filter(m => !appliedVersions.has(m.version))
      .map(m => ({
        version: m.version,
        name: m.name,
        status: 'pending' as const
      }));

    const applied = appliedMigrations.filter(m => m.status === 'applied');
    const failed = appliedMigrations.filter(m => m.status === 'failed');

    return { pending, applied, failed };
  }

  /**
   * Run a single migration
   */
  async runMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Running migration: ${migration.version} - ${migration.name}`);
      
      // Check if migration was already applied
      const existing = await db.execute(sql`
        SELECT version FROM migration_history WHERE version = ${migration.version}
      `);
      
      if (existing.rows.length > 0) {
        console.log(`Migration ${migration.version} already applied, skipping`);
        return;
      }

      // Validate dependencies
      if (migration.dependencies && migration.dependencies.length > 0) {
        await this.validateDependencies(migration.dependencies);
      }

      // Execute the migration in a transaction
      await db.transaction(async (tx) => {
        // Execute the up script
        if (migration.up.trim()) {
          const statements = this.splitSqlStatements(migration.up);
          for (const statement of statements) {
            if (statement.trim()) {
              await tx.execute(sql.raw(statement));
            }
          }
        }

        // Record the migration
        const executionTime = Date.now() - startTime;
        await tx.execute(sql`
          INSERT INTO migration_history (
            version, name, description, filename, checksum, 
            execution_time_ms, success, rollback_script
          ) VALUES (
            ${migration.version},
            ${migration.name},
            ${migration.description || null},
            ${migration.version}.sql,
            ${migration.checksum || ''},
            ${executionTime},
            true,
            ${migration.down || null}
          )
        `);
      });

      console.log(`Migration ${migration.version} completed successfully in ${Date.now() - startTime}ms`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Record the failed migration
      try {
        await db.execute(sql`
          INSERT INTO migration_history (
            version, name, description, filename, checksum, 
            execution_time_ms, success, error_message, rollback_script
          ) VALUES (
            ${migration.version},
            ${migration.name},
            ${migration.description || null},
            ${migration.version}.sql,
            ${migration.checksum || ''},
            ${executionTime},
            false,
            ${errorMessage},
            ${migration.down || null}
          )
        `);
      } catch (recordError) {
        console.error('Failed to record migration failure:', recordError);
      }

      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(): Promise<void> {
    const status = await this.getMigrationStatus();
    
    if (status.pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${status.pending.length} pending migrations...`);
    
    const allMigrations = await this.getAllMigrations();
    const pendingMigrations = allMigrations.filter(m => 
      status.pending.some(p => p.version === m.version)
    );

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    console.log('All pending migrations completed');
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(version: string): Promise<void> {
    try {
      console.log(`Rolling back migration: ${version}`);

      // Get the migration record
      const result = await db.execute(sql`
        SELECT * FROM migration_history 
        WHERE version = ${version} AND success = true
        ORDER BY executed_at DESC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        throw new Error(`Migration ${version} not found or not successfully applied`);
      }

      const migrationRecord = result.rows[0];
      const rollbackScript = migrationRecord.rollback_script as string;

      if (!rollbackScript || !rollbackScript.trim()) {
        throw new Error(`No rollback script available for migration ${version}`);
      }

      // Execute rollback in a transaction
      await db.transaction(async (tx) => {
        // Execute the rollback script
        const statements = this.splitSqlStatements(rollbackScript);
        for (const statement of statements) {
          if (statement.trim()) {
            await tx.execute(sql.raw(statement));
          }
        }

        // Mark as rolled back
        await tx.execute(sql`
          UPDATE migration_history 
          SET success = false, error_message = 'Rolled back'
          WHERE version = ${version}
        `);
      });

      console.log(`Migration ${version} rolled back successfully`);
    } catch (error) {
      console.error(`Failed to rollback migration ${version}:`, error);
      throw error;
    }
  }

  /**
   * Validate migration dependencies
   */
  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      const result = await db.execute(sql`
        SELECT version FROM migration_history 
        WHERE version = ${dependency} AND success = true
      `);

      if (result.rows.length === 0) {
        throw new Error(`Dependency migration ${dependency} not found or not applied`);
      }
    }
  }

  /**
   * Split SQL script into individual statements
   */
  private splitSqlStatements(script: string): string[] {
    // Remove comments and split by semicolon
    const cleaned = script
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    return cleaned
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
  }

  /**
   * Create a backup before running migrations
   */
  async createBackup(backupName?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const name = backupName || `backup_${timestamp}`;
    
    // This would typically use pg_dump or similar
    // For now, we'll create a simple backup record
    console.log(`Creating backup: ${name}`);
    
    // In a real implementation, you would:
    // 1. Use pg_dump to create a database backup
    // 2. Store the backup file in a secure location
    // 3. Record backup metadata
    
    return name;
  }

  /**
   * Verify migration integrity
   */
  async verifyIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Check for missing migration files
      const appliedMigrations = await this.getAppliedMigrations();
      const allMigrations = await this.getAllMigrations();
      const fileVersions = new Set(allMigrations.map(m => m.version));
      
      for (const applied of appliedMigrations) {
        if (!fileVersions.has(applied.version)) {
          issues.push(`Migration file missing for applied migration: ${applied.version}`);
        }
      }

      // Check for checksum mismatches
      for (const migration of allMigrations) {
        const result = await db.execute(sql`
          SELECT checksum FROM migration_history 
          WHERE version = ${migration.version}
        `);
        
        if (result.rows.length > 0) {
          const storedChecksum = result.rows[0].checksum as string;
          if (storedChecksum !== migration.checksum) {
            issues.push(`Checksum mismatch for migration: ${migration.version}`);
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Error during integrity check: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        issues
      };
    }
  }

  /**
   * Get migration statistics
   */
  async getStatistics(): Promise<{
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: number;
    failedMigrations: number;
    averageExecutionTime: number;
    lastMigrationDate?: Date;
  }> {
    const status = await this.getMigrationStatus();
    const appliedMigrations = await this.getAppliedMigrations();
    
    const executionTimes = appliedMigrations
      .filter(m => m.executionTime)
      .map(m => m.executionTime!);
    
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    const lastMigrationDate = appliedMigrations.length > 0
      ? appliedMigrations[appliedMigrations.length - 1].appliedAt
      : undefined;

    return {
      totalMigrations: status.pending.length + status.applied.length + status.failed.length,
      appliedMigrations: status.applied.length,
      pendingMigrations: status.pending.length,
      failedMigrations: status.failed.length,
      averageExecutionTime,
      lastMigrationDate
    };
  }
}

// Create default migration service instance
export const migrationService = new DatabaseMigrationService();

// Utility functions for common migration operations
export const migrationUtils = {
  /**
   * Generate a table creation migration
   */
  generateCreateTableMigration(tableName: string, columns: string[]): string {
    const columnDefs = columns.join(',\n  ');
    return `CREATE TABLE ${tableName} (
  ${columnDefs}
);`;
  },

  /**
   * Generate an index creation migration
   */
  generateCreateIndexMigration(
    indexName: string, 
    tableName: string, 
    columns: string[], 
    unique = false
  ): string {
    const uniqueKeyword = unique ? 'UNIQUE ' : '';
    const columnList = columns.join(', ');
    return `CREATE ${uniqueKeyword}INDEX ${indexName} ON ${tableName} (${columnList});`;
  },

  /**
   * Generate a column addition migration
   */
  generateAddColumnMigration(
    tableName: string, 
    columnName: string, 
    columnType: string, 
    constraints = ''
  ): string {
    return `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType} ${constraints};`;
  },

  /**
   * Generate a column removal migration
   */
  generateDropColumnMigration(tableName: string, columnName: string): string {
    return `ALTER TABLE ${tableName} DROP COLUMN ${columnName};`;
  }
};

// CLI-like interface for migrations
export const migrationCLI = {
  async status() {
    await migrationService.initialize();
    const status = await migrationService.getMigrationStatus();
    const stats = await migrationService.getStatistics();
    
    console.log('\n=== Migration Status ===');
    console.log(`Total migrations: ${stats.totalMigrations}`);
    console.log(`Applied: ${stats.appliedMigrations}`);
    console.log(`Pending: ${stats.pendingMigrations}`);
    console.log(`Failed: ${stats.failedMigrations}`);
    console.log(`Average execution time: ${stats.averageExecutionTime.toFixed(2)}ms`);
    
    if (stats.lastMigrationDate) {
      console.log(`Last migration: ${stats.lastMigrationDate.toISOString()}`);
    }

    if (status.pending.length > 0) {
      console.log('\nPending migrations:');
      status.pending.forEach(m => console.log(`  - ${m.version}: ${m.name}`));
    }

    if (status.failed.length > 0) {
      console.log('\nFailed migrations:');
      status.failed.forEach(m => console.log(`  - ${m.version}: ${m.name} (${m.error})`));
    }
  },

  async migrate() {
    await migrationService.initialize();
    await migrationService.runPendingMigrations();
  },

  async rollback(version: string) {
    await migrationService.initialize();
    await migrationService.rollbackMigration(version);
  },

  async generate(name: string, description?: string) {
    await migrationService.initialize();
    const filepath = await migrationService.generateMigration(name, description);
    console.log(`Migration created: ${filepath}`);
  },

  async verify() {
    await migrationService.initialize();
    const result = await migrationService.verifyIntegrity();
    
    if (result.valid) {
      console.log('✅ Migration integrity verified');
    } else {
      console.log('❌ Migration integrity issues found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }
}; 