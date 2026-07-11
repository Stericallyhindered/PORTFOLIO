-- ESP32 Hub + Supabase: initial schema for the always-on grow room.
--
-- Layout:
--   hubs              one row per ESP32 hub
--   hub_members       phone users authorised against each hub
--   devices           Tuya devices the hub talks to
--   sensor_samples    append-only telemetry from the canopy sensor(s)
--   outlet_events     append-only on/off transitions (auto / manual / burst)
--   automation_decisions  append-only "tick" log (decision JSON + zone)
--   controller_state  single live row per hub (relay states, burst phase)
--   commands          phone -> hub queue (setOutlet, activateScene, etc.)
--   scenes            phone authors them here, hub hot-reloads via Realtime
--
-- All hub-scoped tables key access off `hub_id`. The phone is bound via
-- `hub_members` + `auth.uid()`. The hub authenticates with a JWT that carries
-- `hub_id` as a top-level claim (see `public.jwt_hub_id()` below).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Pull the active hub_id off the current JWT. Accepts either a top-level
-- `hub_id` claim (preferred for service-minted hub tokens) or a nested
-- `app_metadata.hub_id` (handy for hubs that authenticate as a regular user).
create or replace function public.jwt_hub_id() returns uuid
  language sql stable as $$
  select coalesce(
    nullif(auth.jwt() ->> 'hub_id', '')::uuid,
    nullif(auth.jwt() -> 'app_metadata' ->> 'hub_id', '')::uuid
  )
$$;

-- `is_hub_member` is defined after `hub_members` exists (see below).

create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- hubs
-- ---------------------------------------------------------------------------
create table if not exists public.hubs (
  id              uuid primary key default gen_random_uuid(),
  owner_uid       uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  fw_version      text,
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_hubs_updated_at
  before update on public.hubs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- hub_members  (phone access control)
-- ---------------------------------------------------------------------------
create table if not exists public.hub_members (
  id         uuid primary key default gen_random_uuid(),
  hub_id     uuid not null references public.hubs (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (hub_id, user_id)
);

create index if not exists hub_members_user_idx on public.hub_members (user_id);

-- True iff `auth.uid()` has any membership row for this hub. Must follow
-- `hub_members` so the function body can reference that table.
create or replace function public.is_hub_member(target_hub_id uuid)
  returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.hub_members hm
    where hm.hub_id = target_hub_id
      and hm.user_id = auth.uid()
  )
$$;

-- When a hub is inserted, automatically grant the owner a membership row so
-- the phone can immediately see the hub it just created.
create or replace function public.on_hub_inserted()
  returns trigger language plpgsql security definer as $$
begin
  insert into public.hub_members (hub_id, user_id, role)
  values (new.id, new.owner_uid, 'owner')
  on conflict (hub_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_hubs_owner_membership on public.hubs;
create trigger trg_hubs_owner_membership
  after insert on public.hubs
  for each row execute function public.on_hub_inserted();

-- ---------------------------------------------------------------------------
-- devices
-- ---------------------------------------------------------------------------
create table if not exists public.devices (
  id              uuid primary key default gen_random_uuid(),
  hub_id          uuid not null references public.hubs (id) on delete cascade,
  tuya_device_id  text not null,
  name            text not null default '',
  role            text not null default 'unassigned',
  kind            text not null default 'smartOutlet',
  online          boolean not null default false,
  last_dps_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (hub_id, tuya_device_id)
);

create index if not exists devices_hub_idx on public.devices (hub_id);

create trigger trg_devices_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sensor_samples (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.sensor_samples (
  id        uuid primary key default gen_random_uuid(),
  hub_id    uuid not null references public.hubs (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  ts        timestamptz not null default now(),
  temp_c    numeric(6, 2),
  rh_pct    numeric(6, 2),
  vpd_kpa   numeric(6, 3),
  raw       jsonb
);

create index if not exists sensor_samples_hub_ts_idx
  on public.sensor_samples (hub_id, ts desc);

-- ---------------------------------------------------------------------------
-- outlet_events (append-only). `is_on` to avoid PG reserved-word collision.
-- ---------------------------------------------------------------------------
create table if not exists public.outlet_events (
  id         uuid primary key default gen_random_uuid(),
  hub_id     uuid not null references public.hubs (id) on delete cascade,
  device_id  uuid references public.devices (id) on delete set null,
  ts         timestamptz not null default now(),
  is_on      boolean not null,
  reason     text not null default '',
  source     text not null default 'auto', -- auto | manual | burst | rule
  role       text                          -- humidifier / dehumidifier / ...
);

create index if not exists outlet_events_hub_ts_idx
  on public.outlet_events (hub_id, ts desc);
create index if not exists outlet_events_device_ts_idx
  on public.outlet_events (device_id, ts desc);

-- ---------------------------------------------------------------------------
-- automation_decisions (append-only tick log)
-- ---------------------------------------------------------------------------
create table if not exists public.automation_decisions (
  id        uuid primary key default gen_random_uuid(),
  hub_id    uuid not null references public.hubs (id) on delete cascade,
  ts        timestamptz not null default now(),
  decision  jsonb not null,
  zone      text,
  notes     text
);

create index if not exists automation_decisions_hub_ts_idx
  on public.automation_decisions (hub_id, ts desc);

-- ---------------------------------------------------------------------------
-- controller_state (live, 1:1 with hub, upserted by hub each tick)
-- ---------------------------------------------------------------------------
create table if not exists public.controller_state (
  hub_id                    uuid primary key references public.hubs (id) on delete cascade,
  hum_relay_on              boolean,
  dehu_relay_on             boolean,
  hum_burst_phase           text,     -- on | cooldown | idle | null
  hum_burst_remaining_ms    integer,
  dehu_burst_phase          text,
  dehu_burst_remaining_ms   integer,
  hum_desired               boolean,
  dehu_desired              boolean,
  last_temp_c               numeric(6, 2),
  last_rh_pct               numeric(6, 2),
  last_vpd_kpa              numeric(6, 3),
  last_tick_at              timestamptz,
  last_error                text,
  active_scene_ids          uuid[]  not null default '{}',
  manual_held_ids           uuid[]  not null default '{}',
  updated_at                timestamptz not null default now()
);

create trigger trg_controller_state_updated_at
  before update on public.controller_state
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- commands (phone -> hub queue)
-- ---------------------------------------------------------------------------
create table if not exists public.commands (
  id            uuid primary key default gen_random_uuid(),
  hub_id        uuid not null references public.hubs (id) on delete cascade,
  kind          text not null,
  payload       jsonb not null default '{}'::jsonb,
  status        text not null default 'pending', -- pending | acked | failed
  requested_by  uuid references auth.users (id) on delete set null,
  requested_at  timestamptz not null default now(),
  acked_at      timestamptz,
  error         text
);

create index if not exists commands_hub_pending_idx
  on public.commands (hub_id, status, requested_at);

-- ---------------------------------------------------------------------------
-- scenes (phone authors, hub consumes via Realtime)
-- ---------------------------------------------------------------------------
create table if not exists public.scenes (
  id                       uuid primary key default gen_random_uuid(),
  hub_id                   uuid not null references public.hubs (id) on delete cascade,
  name                     text not null,
  stage_override           text,
  photoperiod_override     text,
  member_device_ids        uuid[] not null default '{}',
  automation_overrides     jsonb not null default '{}'::jsonb,
  automation_rules         jsonb not null default '[]'::jsonb,
  active                   boolean not null default false,
  active_order             integer,  -- monotonic; latest active wears the "crown"
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists scenes_hub_idx on public.scenes (hub_id);
create index if not exists scenes_active_idx
  on public.scenes (hub_id, active, active_order);

create trigger trg_scenes_updated_at
  before update on public.scenes
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.hubs                   enable row level security;
alter table public.hub_members            enable row level security;
alter table public.devices                enable row level security;
alter table public.sensor_samples         enable row level security;
alter table public.outlet_events          enable row level security;
alter table public.automation_decisions   enable row level security;
alter table public.controller_state       enable row level security;
alter table public.commands               enable row level security;
alter table public.scenes                 enable row level security;

-- ---- hubs ----
-- Owners can always SELECT hubs they own (owner_uid) so the AFTER INSERT
-- trigger on hub_members can see the new hub row in the same transaction
-- (chicken-and-egg fix; see former 20260512_000002 migration).
drop policy if exists hubs_select on public.hubs;
create policy hubs_select on public.hubs
  for select using (
    public.is_hub_member(id)
    or id = public.jwt_hub_id()
    or owner_uid = auth.uid()
  );

drop policy if exists hubs_insert_own on public.hubs;
create policy hubs_insert_own on public.hubs
  for insert with check (owner_uid = auth.uid());

drop policy if exists hubs_update_member on public.hubs;
create policy hubs_update_member on public.hubs
  for update using (
    public.is_hub_member(id) or id = public.jwt_hub_id()
  );

-- ---- hub_members ----
drop policy if exists hub_members_self_select on public.hub_members;
create policy hub_members_self_select on public.hub_members
  for select using (user_id = auth.uid() or public.is_hub_member(hub_id));

drop policy if exists hub_members_owner_manage on public.hub_members;
create policy hub_members_owner_manage on public.hub_members
  for all using (
    exists (
      select 1 from public.hubs h
      where h.id = hub_members.hub_id
        and h.owner_uid = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.hubs h
      where h.id = hub_members.hub_id
        and h.owner_uid = auth.uid()
    )
  );

-- ---- devices ----
drop policy if exists devices_select on public.devices;
create policy devices_select on public.devices
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

drop policy if exists devices_phone_write on public.devices;
create policy devices_phone_write on public.devices
  for update using (public.is_hub_member(hub_id))
  with check (public.is_hub_member(hub_id));

-- Phone upserts new device rows after Tuya Smart Life sync (first insert per
-- tuya_device_id; see former 20260512_000003 migration).
drop policy if exists devices_phone_insert on public.devices;
create policy devices_phone_insert on public.devices
  for insert with check (public.is_hub_member(hub_id));

drop policy if exists devices_hub_write on public.devices;
create policy devices_hub_write on public.devices
  for all using (hub_id = public.jwt_hub_id())
  with check (hub_id = public.jwt_hub_id());

-- ---- sensor_samples (hub writes, phone reads) ----
drop policy if exists sensor_samples_select on public.sensor_samples;
create policy sensor_samples_select on public.sensor_samples
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

drop policy if exists sensor_samples_hub_insert on public.sensor_samples;
create policy sensor_samples_hub_insert on public.sensor_samples
  for insert with check (hub_id = public.jwt_hub_id());

-- ---- outlet_events ----
drop policy if exists outlet_events_select on public.outlet_events;
create policy outlet_events_select on public.outlet_events
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

drop policy if exists outlet_events_hub_insert on public.outlet_events;
create policy outlet_events_hub_insert on public.outlet_events
  for insert with check (hub_id = public.jwt_hub_id());

-- ---- automation_decisions ----
drop policy if exists automation_decisions_select on public.automation_decisions;
create policy automation_decisions_select on public.automation_decisions
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

drop policy if exists automation_decisions_hub_insert on public.automation_decisions;
create policy automation_decisions_hub_insert on public.automation_decisions
  for insert with check (hub_id = public.jwt_hub_id());

-- ---- controller_state ----
drop policy if exists controller_state_select on public.controller_state;
create policy controller_state_select on public.controller_state
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

drop policy if exists controller_state_hub_write on public.controller_state;
create policy controller_state_hub_write on public.controller_state
  for all using (hub_id = public.jwt_hub_id())
  with check (hub_id = public.jwt_hub_id());

-- ---- commands ----
drop policy if exists commands_select on public.commands;
create policy commands_select on public.commands
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

-- Phone inserts a pending command for a hub it belongs to.
drop policy if exists commands_phone_insert on public.commands;
create policy commands_phone_insert on public.commands
  for insert with check (
    public.is_hub_member(hub_id)
    and requested_by = auth.uid()
    and status = 'pending'
  );

-- Hub flips status / acked_at / error on its own commands.
drop policy if exists commands_hub_update on public.commands;
create policy commands_hub_update on public.commands
  for update using (hub_id = public.jwt_hub_id())
  with check (hub_id = public.jwt_hub_id());

-- ---- scenes ----
drop policy if exists scenes_select on public.scenes;
create policy scenes_select on public.scenes
  for select using (
    public.is_hub_member(hub_id) or hub_id = public.jwt_hub_id()
  );

drop policy if exists scenes_phone_write on public.scenes;
create policy scenes_phone_write on public.scenes
  for all using (public.is_hub_member(hub_id))
  with check (public.is_hub_member(hub_id));

-- ===========================================================================
-- Realtime publication
-- ===========================================================================
-- (Supabase ships `supabase_realtime` already created; safe to add tables.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    perform 1;
  else
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.sensor_samples;
alter publication supabase_realtime add table public.outlet_events;
alter publication supabase_realtime add table public.automation_decisions;
alter publication supabase_realtime add table public.controller_state;
alter publication supabase_realtime add table public.commands;
alter publication supabase_realtime add table public.scenes;
alter publication supabase_realtime add table public.devices;
