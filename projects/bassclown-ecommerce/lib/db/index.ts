// Patch JSON.parse during Next.js build to avoid `"undefined"` errors.
// This must be imported **before** any Drizzle/Neon code executes.
import '../drizzle-build-patch'

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Clean up the DATABASE_URL to handle potential line breaks
const databaseUrl = process.env.DATABASE_URL?.replace(/\n/g, '') || ''

// Detect build-time so we don’t attempt to connect to the database while
// Next.js statically evaluates modules during `next build`.
const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export'

// ---------------------------------------------------------------------------
// Debugging aid – helps verify whether build-time detection works as expected.
// This will print during `next build` as well as during `next dev`, giving us
// quick feedback in the terminal without affecting runtime behaviour.
// ---------------------------------------------------------------------------
let db: ReturnType<typeof drizzle>

if (!isBuildTime && databaseUrl) {
  const sql = neon(databaseUrl)
  db = drizzle(sql, { schema })
} else {
  // Provide a typed stub during build to satisfy imports. Runtime code should
  // guard with `if (!db)` before using the database.
  db = undefined as unknown as ReturnType<typeof drizzle>
}

export { db }

export * from './schema' 