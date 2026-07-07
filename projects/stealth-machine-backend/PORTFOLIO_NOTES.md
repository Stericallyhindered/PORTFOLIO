# Stealth Machine Backend

Public portfolio snapshot of a Next.js/TypeScript operations backend for Stealth Machine Tools.

## What To Review

- `src/app/admin/ai/page.tsx` - AI/admin workflow UI for internal support operations.
- `src/app/admin/materials/page.tsx` - support-material management workflow.
- `src/app/admin/customers/page.tsx` - customer and machine account administration.
- `src/app/api` - route handlers for users, tickets, materials, auth, analytics, and system workflows.
- `prisma/schema.prisma` - relational data model for users, machines, support tickets, AI config, training materials, and activity.
- `src/lib/ai.ts` - Anthropic-backed AI support orchestration.
- `src/lib/auth.ts` - JWT/cookie auth helpers and password hashing.

## Why It Matters

This shows full-stack operational software: auth, database modeling, admin dashboards, AI integration, ticket flows, customer records, support materials, and production-style API routes.

## Public Snapshot Notes

Runtime secrets, deployment config, dependency folders, generated builds, and private credentials were removed before publishing.
