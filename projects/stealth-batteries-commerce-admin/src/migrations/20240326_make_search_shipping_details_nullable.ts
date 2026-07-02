import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "search"
    ALTER COLUMN "shipping_details_weight" DROP NOT NULL,
    ALTER COLUMN "shipping_details_length" DROP NOT NULL,
    ALTER COLUMN "shipping_details_width" DROP NOT NULL,
    ALTER COLUMN "shipping_details_height" DROP NOT NULL;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "search"
    ALTER COLUMN "shipping_details_weight" SET NOT NULL,
    ALTER COLUMN "shipping_details_length" SET NOT NULL,
    ALTER COLUMN "shipping_details_width" SET NOT NULL,
    ALTER COLUMN "shipping_details_height" SET NOT NULL;
  `)
}
