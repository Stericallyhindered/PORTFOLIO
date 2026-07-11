-- Idempotent for DBs created before 20260510_000001_init.sql included this policy.
-- Greenfield installs already have devices_phone_insert from init.sql.

drop policy if exists devices_phone_insert on public.devices;
create policy devices_phone_insert on public.devices
  for insert with check (public.is_hub_member(hub_id));
