-- Idempotent for DBs created before 20260510_000001_init.sql included this fix.
-- Greenfield installs already have owner_uid in hubs_select from init.sql.

drop policy if exists hubs_select on public.hubs;
create policy hubs_select on public.hubs
  for select using (
    public.is_hub_member(id)
    or id = public.jwt_hub_id()
    or owner_uid = auth.uid()
  );
