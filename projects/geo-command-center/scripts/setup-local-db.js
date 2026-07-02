const fs = require("fs");
const postgres = require("postgres");

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("Set DATABASE_URL before running local database setup.");
}
const sql = postgres(url, { max: 1 });

async function main() {
  await sql.unsafe(`
    drop schema if exists public cascade;
    create schema public;
    grant usage on schema public to postgres, public;
    create extension if not exists pgcrypto;
  `);

  await sql.unsafe(fs.readFileSync("drizzle/migrations/000_initial.sql", "utf8"));
  await sql.unsafe(fs.readFileSync("drizzle/migrations/001_page_entity_scores.sql", "utf8"));

  // Local Postgres does not have Supabase's auth schema/functions.
  await sql.unsafe(`
    create schema if not exists auth;
    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as 'select ''00000000-0000-0000-0000-000000000000''::uuid';
  `);

  await sql.unsafe(fs.readFileSync("supabase/rls-policies.sql", "utf8"));

  console.log("Local DB schema + RLS applied.");
}

main()
  .then(async () => {
    await sql.end();
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });

