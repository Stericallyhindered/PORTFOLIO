-- Local Tuya migration.
--
-- Drops Tuya Cloud dependency entirely. The ESP32 talks straight to each
-- device on the LAN (port 6668, AES-128-ECB) using a per-device `local_key`
-- extracted with the `tinytuya` wizard. New columns:
--   local_key         16-char secret printed by `tinytuya wizard`
--   ip                last-known LAN IP (UDP discovery refreshes it)
--   protocol_version  Tuya protocol revision: '3.3' (default) or '3.4'
--   dp_map            optional JSON map of friendly-name -> DP id strings
--                     (e.g. {"temperature":"1","humidity":"2","switch":"1"})

alter table public.devices
  add column if not exists local_key         text,
  add column if not exists ip                text,
  add column if not exists protocol_version  text  not null default '3.3',
  add column if not exists dp_map            jsonb not null default '{}'::jsonb;
