import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // First, check what columns exist
  const { rows: mainTableColumns } = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'stealth_events'
  `)

  const { rows: versionTableColumns } = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '_stealth_events_v'
  `)

  const mainColumnNames = mainTableColumns.map((row) => row.column_name)
  const versionColumnNames = versionTableColumns.map((row) => row.column_name)

  // Handle main table
  if (mainColumnNames.includes('event_date') && !mainColumnNames.includes('event_start_date')) {
    await db.execute(sql`
      ALTER TABLE "stealth_events" 
      RENAME COLUMN "event_date" TO "event_start_date"
    `)
  }

  if (!mainColumnNames.includes('event_end_date')) {
    await db.execute(sql`
      ALTER TABLE "stealth_events" 
      ADD COLUMN "event_end_date" timestamp with time zone;
      
      UPDATE "stealth_events"
      SET "event_end_date" = "event_start_date"
    `)
  }

  // Handle version table
  if (
    versionColumnNames.includes('version_event_date') &&
    !versionColumnNames.includes('version_event_start_date')
  ) {
    await db.execute(sql`
      ALTER TABLE "_stealth_events_v" 
      RENAME COLUMN "version_event_date" TO "version_event_start_date"
    `)
  }

  if (!versionColumnNames.includes('version_event_end_date')) {
    await db.execute(sql`
      ALTER TABLE "_stealth_events_v" 
      ADD COLUMN "version_event_end_date" timestamp with time zone;
      
      UPDATE "_stealth_events_v"
      SET "version_event_end_date" = "version_event_start_date"
    `)
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  const { rows: mainTableColumns } = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'stealth_events'
  `)

  const { rows: versionTableColumns } = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '_stealth_events_v'
  `)

  const mainColumnNames = mainTableColumns.map((row) => row.column_name)
  const versionColumnNames = versionTableColumns.map((row) => row.column_name)

  // Revert main table
  if (mainColumnNames.includes('event_end_date')) {
    await db.execute(sql`
      ALTER TABLE "stealth_events" 
      DROP COLUMN "event_end_date"
    `)
  }

  if (mainColumnNames.includes('event_start_date')) {
    await db.execute(sql`
      ALTER TABLE "stealth_events" 
      RENAME COLUMN "event_start_date" TO "event_date"
    `)
  }

  // Revert version table
  if (versionColumnNames.includes('version_event_end_date')) {
    await db.execute(sql`
      ALTER TABLE "_stealth_events_v" 
      DROP COLUMN "version_event_end_date"
    `)
  }

  if (versionColumnNames.includes('version_event_start_date')) {
    await db.execute(sql`
      ALTER TABLE "_stealth_events_v" 
      RENAME COLUMN "version_event_start_date" TO "version_event_date"
    `)
  }
}
