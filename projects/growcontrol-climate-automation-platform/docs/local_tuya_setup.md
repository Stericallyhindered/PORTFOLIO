# Local Tuya operator onboarding

This is the only manual step left in the GrowControl pipeline. Tuya Cloud is
no longer in the data path — the ESP32 hub talks to every Tuya plug and
sensor directly on your home Wi-Fi (port 6668, AES-128-ECB). To do that it
needs each device's `local_key`, which Tuya only exposes through the
free Smart Life app + a one-time `tinytuya` extraction.

You only do this once per device. After that the device shows up in the
GrowControl app and the ESP32 starts polling it within ~5 seconds.

## Architecture recap

```
Phone (anywhere) ────HTTPS────▶ Supabase ◀────HTTPS──── ESP32 hub
                                                        │
                                                        │ LAN, port 6668
                                                        │ AES-128-ECB w/ local_key
                                                        ▼
                                              Tuya plug / sensor
```

- Supabase stores the device list (`public.devices`) and the command queue
  (`public.commands`). Every row has a `local_key` column that the hub reads
  on boot and on every realtime update.
- The phone never touches the device. It only PATCHes Supabase.
- The hub never touches Tuya Cloud. It only reads its row, opens a TCP
  socket on the LAN, encrypts a tiny JSON payload with `local_key`, and
  parses the reply.

## Per-device setup (one-time)

### 1. Pair the device on your Wi-Fi (Tuya Smart Life)

1. Install **Smart Life** (free, by Tuya Inc.) from the Play Store or App
   Store.
2. Create an account or sign in.
3. Put the device into pairing mode (usually hold the button until the LED
   blinks fast).
4. In Smart Life → **Add Device** → let it auto-discover, then enter your
   2.4 GHz Wi-Fi SSID + password.

The device is now joined to your LAN and reports its state to Tuya Cloud
*and* the LAN. We only care about the LAN side.

> Tuya Smart Life is free and only ever talks to Tuya Cloud for the initial
> pairing handshake. It does **not** cost the $25k/year that the Tuya IoT
> Core developer subscription does.

### 2. Pull the `local_key` with `tinytuya`

On your PC (Windows / Mac / Linux, anywhere with Python 3.7+):

```bash
pip install tinytuya
python -m tinytuya wizard
```

The wizard prompts for:

- **Tuya API Key (Access ID)** — from
  <https://iot.tuya.com/cloud/> → your project → Authorization Key. **This
  free developer key never expires** and is independent of the paid Cloud
  Development plan.
- **Tuya API Secret (Access Secret)** — same page.
- **Tuya API Region** — pick whatever matches the data center you signed
  the app up under (Smart Life shows it under Me → Settings → About →
  Region).

When it's done, the wizard writes `devices.json` next to itself with one
entry per device:

```json
[
  {
    "name": "Canopy Sensor",
    "id": "ebb28e4e4a1042c60bs17v",
    "key": "abc123def4567890",
    "ver": "3.3",
    "ip": "192.168.1.45"
  }
]
```

The fields you need:

| Field | Maps to | Notes |
|-------|---------|-------|
| `id`  | `tuya_device_id` (Tuya `gwId`) | What the hub uses to address the device |
| `key` | `local_key` | 16-char AES secret — keep secret |
| `ver` | `protocol_version` | `3.3` or `3.4`. Defaults to `3.3` if omitted |
| `ip`  | `ip` | Hint only; the hub re-discovers it via UDP broadcasts |
| `name` | `name` | Friendly name |

### 3. Paste into GrowControl

Open the app and tap **Add device** (the `+` button in the top-right of
the home shell):

- **Form mode** — manually enter one device at a time. Use this for
  devices that don't show up in `devices.json` for some reason.
- **Paste tinytuya JSON mode** — paste the entire `devices.json` blob and
  the app upserts every entry in one shot. This is the fast path.

The sheet:

1. Inserts/updates `public.devices` via the existing
   `upsertDevicesLocal` RPC (which writes `local_key`, `ip`,
   `protocol_version`, `dp_map`).
2. Supabase Realtime fans the change out to the hub.
3. Within ~5 seconds the hub opens a TCP connection on `192.168.x.x:6668`,
   does a DP_QUERY (`0x0A`) for sensors or a CONTROL (`0x07`) for outlets,
   and you'll see the row's `online=true` flip in Supabase.

### 4. Assign a role

In **Devices → tap the row → Role**, pick one of:

- **canopySensor** — feeds the climate decision tick.
- **humidifier** / **dehumidifier** — burst-cycled by the climate
  controller.
- **fan / light / unassigned** — manual + scene rules only.

The hub picks up the role change on its next 10-second list refresh.

## Manually editing in SQL

If you ever need to fix a key by hand (e.g. you swapped a humidifier and
its old row points at the wrong physical device):

```sql
update public.devices
   set local_key       = 'newsecret123abc',
       protocol_version = '3.3',
       ip              = '192.168.1.50'
 where hub_id          = '00000000-0000-0000-0000-000000000000'
   and tuya_device_id  = 'eb43d8fb4fe9cde09bdyhp';
```

The hub picks up the change on its next 10-second device list refresh.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Device row stays `online=false` for >30s | `local_key` typo, or the device is still on Tuya Cloud only | Re-run `tinytuya wizard`, confirm the `id` matches `tuya_device_id` |
| Climate dashboard reads zeros | Canopy sensor has no role assigned | Devices → role → **canopySensor** |
| `protocol_version=3.4` not working | Hub's v3.4 handshake fall-back | Toggle the row back to `3.3` first; if the device firmware insists on 3.4, file an issue with the device firmware version |
| LAN traffic but no Supabase rows | RLS rejected the insert | Confirm the hub's `service_role` key is configured in NVS and that the hub's `hub_id` matches the device's `hub_id` |
| Device drops off LAN after Tuya firmware update | Tuya sometimes ships LAN-disabling firmware | In Smart Life → device → **Firmware updates → off** before re-pairing, and re-pair on the previous firmware if needed |

## What does NOT need to be redone

- All Supabase RLS, Realtime, telemetry, command queue, scene rules,
  automation_decisions tables.
- Climate logic: VPD bands, hysteresis, burst cycler, scene rule
  evaluation.
- Phone UI: dashboard, logs, manual control, scenes, settings.
- Hub config persistence (still NVS-backed; just no Tuya OpenAPI keys).
