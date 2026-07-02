import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" RENAME COLUMN "map" TO "dealer_price";
   ALTER TABLE "_products_v" RENAME COLUMN "version_map" TO "version_dealer_price";
   ALTER TABLE "orders" RENAME COLUMN "map_total" TO "dealer_total";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "map" numeric DEFAULT 400;
   ALTER TABLE "_products_v" ADD COLUMN "version_map" numeric DEFAULT 400;
   ALTER TABLE "orders" ADD COLUMN "map_total" numeric DEFAULT 0;
   ALTER TABLE "products" DROP COLUMN IF EXISTS "dealer_price";
   ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_dealer_price";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "dealer_total";
  `)
}
