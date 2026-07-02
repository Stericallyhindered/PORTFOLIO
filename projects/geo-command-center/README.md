# GEO Command Center

Production-focused multi-tenant GEO SaaS for agency + client portal workflows.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind + shadcn/ui + TanStack Table
- Supabase Auth + Supabase Postgres + Drizzle ORM
- BullMQ + Redis worker
- Supabase Storage-ready report/artifact model
- Sentry (web + worker)

## Environment

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required for full functionality:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `PERPLEXITY_API_KEY` (optional, mock connector used if missing)
- `ANTHROPIC_API_KEY` (optional, fallback summary used if missing)
- `SENTRY_DSN` (optional)

## Local Development

Install dependencies:

```bash
npm install
```

Generate/apply DB migrations:

```bash
npm run db:generate
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed
```

Run web app:

```bash
npm run dev
```

Run worker (separate terminal):

```bash
npm run worker:dev
```

Run tests:

```bash
npm test
```

Build production app:

```bash
npm run build
```

## Key Routes

- `/login`
- `/app`
- `/app/dashboard`
- `/app/tasks`
- `/app/visibility`
- `/app/content-audits`
- `/app/entities`
- `/app/reports`
- `/app/reports/[id]`
- `/app/sprints/[month]`
- `/admin`
- `/admin/clients`
- `/admin/clients/[id]`
- `/admin/templates`

## API Surface (selected)

- Authenticated internal APIs:
  - `/api/clients`
  - `/api/tasks`
  - `/api/approvals`
  - `/api/geo-runs`
  - `/api/content-audits/run`
  - `/api/entities/coverage`
  - `/api/reports/generate`
  - `/api/reports/[id]/download`
  - `/api/visibility/aggregate`
  - `/api/exports/*`
- External token APIs:
  - `/api/external/[token]/tracked-queries`
  - `/api/external/[token]/citations`
  - `/api/external/[token]/tasks`

## Connectors

- Mock connector: always available in dev.
- Real connector: Perplexity (`PERPLEXITY_API_KEY`).
- Monthly narrative generation: Claude (`ANTHROPIC_API_KEY`) with fallback text when key is absent.

## Deployment

### Web

- Deploy Next.js app to Vercel.
- Configure all env vars in Vercel project settings.
- Use Supabase managed Postgres and auth.

### Worker

- Deploy `worker/index.ts` as a separate Node service (Render/Fly/Railway/etc).
- Same env vars as web for DB/Redis/connectors/Sentry.
- Start command:

```bash
npm run worker:dev
```

(Use `tsx` in production process manager or compile to JS entrypoint.)

## Notes

- Plan/billing enforcement is implemented as internal plan limits (queries/engines/seats).
- Stripe subscriptions are intentionally not wired.
- RLS starter policies are provided in `supabase/rls-policies.sql`.

## GEO Prompt Alignment

This repository now includes a Python/FastAPI backend scaffold under `backend/` that follows the `GEO_PROMPT.txt` architecture:

- GEO Prompt alignment for prompt-cluster generation (`informational`, `commercial`, `comparison`, `alternatives`, `best-for`, `how-to`, `troubleshooting`, `navigational`, `long-tail-conversational`, `follow-up`).
- GEO Prompt alignment for scoring formulas (`page`, `cluster`, `project` GEO scores).
- GEO Prompt alignment for multi-engine routing and citations (`chatgpt`, `google-ai-overviews`, `perplexity`, `gemini`, `claude`).

### Backend quickstart

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker quickstart

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Postgres: `localhost:5433`
- Redis: `localhost:6379`
