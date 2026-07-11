# Supabase backend for Growmie

This folder holds the Supabase schema and policies that back the always-on
grow-room architecture (ESP32 hub writes telemetry / state, Flutter phone app
reads it from anywhere and writes commands back).

Project (from `qherdxscddnagsklkbxx.supabase.co`):
- `SUPABASE_URL = https://qherdxscddnagsklkbxx.supabase.co`
- `SUPABASE_ANON_KEY = sb_publishable_O3gCue-pYx5qv-in40j-4Q_pVtN4jvv`

These are the publishable (anon) credentials and are safe to ship inside the
Flutter app. The Postgres password and the JWT signing secret are **not** in
this repo and must never be committed.

### Direct Postgres connection (your PC only — pgAdmin, psql, DBeaver)

**One rule:** the line below is **only** for desktop SQL tools and CLI on **your
computer**. Paste your real password into it **there** (connection dialog or
local env file). That is **correct** and what this section is for.

**Never** paste this full URL (with password) into: the Flutter app, the ESP32
firmware, GitHub, or any file you commit — those use **Supabase URL + anon
key**, not Postgres.

```
postgresql://postgres:[YOUR-PASSWORD]@db.qherdxscddnagsklkbxx.supabase.co:5432/postgres
```

Get **Database password** from Dashboard → **Project Settings** → **Database**
(or reset it there). Host `db.qherdxscddnagsklkbxx.supabase.co` = project ref
`qherdxscddnagsklkbxx`.

## Layout

```
supabase/
  migrations/
    20260510_000001_init.sql   -- schema + RLS + Realtime
  README.md                    -- this file
```

## Applying the migration

Pick whichever workflow you prefer.

### Option A: Supabase CLI (recommended)

```bash
# one-time login
npx supabase login

# link this repo to your hosted project
npx supabase link --project-ref qherdxscddnagsklkbxx

# push the SQL in supabase/migrations/ to the live project
npx supabase db push
```

### Option B: Dashboard SQL editor

1. Open the project at https://supabase.com/dashboard/project/qherdxscddnagsklkbxx
2. Go to **SQL Editor -> New query**
3. Paste the contents of `migrations/20260510_000001_init.sql` and run it.

The migration is idempotent (uses `create table if not exists`, `drop policy if
exists`, etc) so you can rerun it safely.

## Auth model

Two callers exist:

1. **Phone (Flutter app)** signs in with Supabase Auth (magic-link email).
   `auth.uid()` is the human user. RLS keys access off `hub_members`.

2. **ESP32 hub** authenticates with a JWT that carries the hub's id as a
   top-level claim:
   ```json
   { "role": "authenticated",
     "sub": "<hub-uuid>",
     "hub_id": "<hub-uuid>",
     "iat": ..., "exp": ... }
   ```
   The hub gets that token at provisioning time (see firmware project), saves
   it to NVS, and refreshes it well before `exp`. Every hub-side RLS policy
   keys off `public.jwt_hub_id()` which reads that claim.

## Tables overview

| Table                  | Writers       | Readers              | Realtime |
| ---------------------- | ------------- | -------------------- | -------- |
| `hubs`                 | phone (owner) | phone members + hub  | yes      |
| `hub_members`          | phone (owner) | phone members        | no       |
| `devices`              | hub + phone   | phone members + hub  | yes      |
| `sensor_samples`       | hub           | phone members + hub  | yes      |
| `outlet_events`        | hub           | phone members + hub  | yes      |
| `automation_decisions` | hub           | phone members + hub  | yes      |
| `controller_state`     | hub           | phone members + hub  | yes      |
| `commands`             | phone (ins)   | phone members + hub  | yes      |
|                        | hub (ack)     |                      |          |
| `scenes`               | phone         | phone members + hub  | yes      |

### Command kinds

The hub firmware dispatches on `kind`:

| `kind`             | `payload` shape                                            |
| ------------------ | ---------------------------------------------------------- |
| `setOutlet`        | `{ "device_id": "<uuid>", "on": true, "hold_seconds": 0 }` |
| `activateScene`    | `{ "scene_id": "<uuid>" }`                                 |
| `deactivateScene`  | `{ "scene_id": "<uuid>" }`                                 |
| `setBurst`         | `{ "on_seconds": 30, "off_seconds": 150 }`                 |
| `setStage`         | `{ "stage": "midFlower" }`                                 |
| `setPhotoperiod`   | `{ "phase": "lightsOn" }`                                  |
| `assignRole`       | `{ "device_id": "<uuid>", "role": "humidifier" }`          |
| `renameDevice`     | `{ "device_id": "<uuid>", "name": "Hum Outlet 1" }`        |
| `refresh`          | `{}`                                                       |

Adding a new kind is a one-line switch arm in the firmware; no schema change.

## Local dev (optional)

If you want a local Supabase stack:

```bash
npx supabase start             # boots Postgres + Studio + Realtime + Auth
npx supabase db reset          # rebuilds the local DB from migrations/
```

Then point the Flutter app at `http://localhost:54321` and the local anon key
printed by `supabase status`.
