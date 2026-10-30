# Stealth Machine Backend

This is a Next.js/TypeScript/Prisma backend and admin system for Stealth Machine Tools support workflows.

The project is included because it shows the full-stack side of industrial machine support: users, customers, machines, tickets, training materials, AI configuration, admin screens, API routes, auth helpers, file/material handling, analytics, and support workflows.

## What It Shows

- Next.js App Router project structure
- Prisma data model for users, customers, machines, tickets, AI config, training materials, and activity
- JWT/cookie auth helpers and password hashing
- admin dashboard pages
- ticket and customer management
- AI chat/config routes
- training material upload and management
- scripts for database entries and material ingestion
- machine/customer/support workflow modeling

## Files Worth Reviewing

- `prisma/schema.prisma`  
  Data model for the support system.

- `src/lib/ai.ts`  
  AI support orchestration.

- `src/lib/auth.ts`  
  Auth helpers.

- `src/app/api/ai/chat/route.ts`  
  AI chat API route.

- `src/app/api/tickets/route.ts` and `src/app/api/tickets/[id]/route.ts`  
  Ticket workflow APIs.

- `src/app/api/machines/`  
  Machine record APIs.

- `src/app/admin/tickets/page.tsx`  
  Admin ticket-management UI.

- `scripts/upload-materials.ts` and related scripts  
  Material/context ingestion helpers.

## Portfolio Note

This is a sanitized source snapshot. Private machine/customer data, environment files, proprietary documents, production infrastructure, and secrets are excluded.

