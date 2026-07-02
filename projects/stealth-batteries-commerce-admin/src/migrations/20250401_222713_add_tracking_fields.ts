import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_dealers_tax_exempt_documents_type') THEN
   CREATE TYPE "public"."enum_dealers_tax_exempt_documents_type" AS ENUM('resale', 'exemption', 'other');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_dealers_tax_exempt_status') THEN
  CREATE TYPE "public"."enum_dealers_tax_exempt_status" AS ENUM('none', 'pending', 'approved', 'rejected');
      END IF;
      -- ... Add similar IF NOT EXISTS checks for other enums ...
    END $$;

    -- Continue with table creation
  CREATE TABLE IF NOT EXISTS "admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
    -- ... Rest of the table creation statements ...
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop tables first
    DROP TABLE IF EXISTS "admins";
    -- ... Rest of the table drops ...

    -- Then drop enums
    DO $$
    BEGIN
      DROP TYPE IF EXISTS "public"."enum_dealers_tax_exempt_documents_type";
      DROP TYPE IF EXISTS "public"."enum_dealers_tax_exempt_status";
      -- ... Rest of the enum drops ...
    END $$;
  `)
}
