import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.pool.query(`
    -- Add force_password_change column to dealers table if it doesn't exist
    ALTER TABLE "dealers" 
    ADD COLUMN IF NOT EXISTS "force_password_change" BOOLEAN DEFAULT false;

    -- Set default value for existing records
    UPDATE "dealers" 
    SET "force_password_change" = false 
    WHERE "force_password_change" IS NULL;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.pool.query(`
    -- Remove the force_password_change column
    ALTER TABLE "dealers" 
    DROP COLUMN IF EXISTS "force_password_change";
  `)
}
