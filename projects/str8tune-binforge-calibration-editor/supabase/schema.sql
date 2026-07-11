create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  shop_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  primary_color text not null default '#57d4ff',
  accent_color text not null default '#7cff9f',
  shadow_depth integer not null default 36,
  surface_style text not null default 'glass',
  table_density text not null default 'comfortable',
  ai_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint user_preferences_surface_style_check check (surface_style in ('mesh', 'glass', 'contour'))
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  display_name text not null,
  make text,
  model text,
  year integer,
  ecu text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tune_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  xdf_name text,
  bin_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tune_projects(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  original_name text not null,
  byte_size bigint,
  checksum text,
  uploaded_at timestamptz not null default now(),
  constraint project_files_kind_check check (kind in ('bin', 'xdf', 'export'))
);

create table if not exists public.table_aliases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tune_projects(id) on delete cascade,
  source_key text not null,
  alias text not null,
  category text,
  color_hex text,
  sort_order integer,
  updated_at timestamptz not null default now(),
  unique(project_id, source_key)
);

create table if not exists public.ai_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tune_projects(id) on delete cascade,
  selected_table_key text,
  selected_cell_row integer,
  selected_cell_column integer,
  context_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.vehicles enable row level security;
alter table public.tune_projects enable row level security;
alter table public.project_files enable row level security;
alter table public.table_aliases enable row level security;
alter table public.ai_context_snapshots enable row level security;

create policy "profiles owner select" on public.profiles for select using (auth.uid() = id);
create policy "profiles owner insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles owner update" on public.profiles for update using (auth.uid() = id);
create policy "preferences owner all" on public.user_preferences using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vehicles owner all" on public.vehicles using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects owner all" on public.tune_projects using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "files owner all"
on public.project_files
using (
  exists (
    select 1 from public.tune_projects p
    where p.id = project_files.project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tune_projects p
    where p.id = project_files.project_id and p.user_id = auth.uid()
  )
);

create policy "aliases owner all"
on public.table_aliases
using (
  exists (
    select 1 from public.tune_projects p
    where p.id = table_aliases.project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tune_projects p
    where p.id = table_aliases.project_id and p.user_id = auth.uid()
  )
);

create policy "ai snapshots owner all"
on public.ai_context_snapshots
using (
  exists (
    select 1 from public.tune_projects p
    where p.id = ai_context_snapshots.project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tune_projects p
    where p.id = ai_context_snapshots.project_id and p.user_id = auth.uid()
  )
);
