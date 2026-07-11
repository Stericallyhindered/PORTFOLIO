# growmie-hub firmware

ESP32-S3 firmware for the Growmie grow-room hub. Replaces the phone as the
always-on controller: reads the canopy sensor and drives the humidifier /
dehumidifier through Tuya, streams everything into Supabase, and listens for
commands the phone sends from anywhere on the internet.

```
sensor + outlets <-- Tuya cloud --> ESP32-S3 hub <-- Supabase --> phone
```

## Build

```bash
# install PlatformIO Core if you don't have it
pipx install platformio          # or: brew install platformio

# build the firmware
pio run -e esp32-s3

# flash a connected ESP32-S3 dev board
pio run -e esp32-s3 -t upload

# serial monitor
pio device monitor -b 115200
```

## Wi-Fi: Spectrum / compile-time defaults (optional)

To skip typing your home SSID on first boot, copy
`include/wifi_secrets.h.example` → `include/wifi_secrets.h` and set:

```cpp
#define GROWMIE_DEFAULT_WIFI_SSID     "SpectrumSetup-6D"
#define GROWMIE_DEFAULT_WIFI_PASSWORD "your_password_here"
```

`wifi_secrets.h` is listed in `.gitignore` so your password is not committed.
The firmware calls `applyWifiCompileDefaults()` before joining the network so
**SpectrumSetup-6D** (or any SSID you set there) is used when NVS has no saved
Wi-Fi yet.

You still complete the captive portal once for Supabase URL/JWT and Tuya
OpenAPI credentials unless you add those another way.

### Hub / Supabase / Tuya compile-time defaults (optional)

Copy `include/hub_secrets.example.h` → `include/hub_secrets.h` and fill in URL,
hub UUID, anon key, and **either** a long-lived **hub JWT** (claim `hub_id`,
used with the anon key under RLS) **or** the **service_role** key (bypasses
RLS — only on a trusted device). `hub_secrets.h` is gitignored.

At boot, `applyHubCompileDefaults()` merges these into any empty NVS fields so
you can flash once without pasting multi-line secrets in the portal.

## First boot

1. Power the hub. After ~3 s it opens a temporary WiFi AP named
   `Growmie-Hub-XXXX` (password `growmie123`).
2. Join that network from your phone. A captive portal opens.
3. Pick your home WiFi and enter:
   - **Supabase URL** (e.g. `https://qherdxscddnagsklkbxx.supabase.co`)
   - **Supabase anon key** (Settings → API → anon public).
   - **Supabase hub JWT** — long-lived token with `hub_id` claim (see
     `supabase/README.md`). Leave blank if you use **service_role** instead.
   - **Service role key** (optional, dev/trusted hub only) — if set, JWT can be
     empty.
   - **Tuya OpenAPI client_id + secret** from your Tuya IoT Core Cloud
     Development Project (https://iot.tuya.com).
   - **Tuya region host** (`openapi.tuyaus.com`, `openapi.tuyaeu.com`, etc).
4. Save. The hub reboots, reads the config from NVS, and goes headless.

To re-provision: hold `BOOT` on the dev board for 5 s while it boots, or
write `growmie-hub reset` to the serial console. Both wipe NVS and reopen
the captive portal.

## Layout

| Path                    | Role                                                   |
| ----------------------- | ------------------------------------------------------ |
| `src/main.cpp`          | boot sequence + main control loop                      |
| `src/config_store.*`    | NVS-backed key/value store                             |
| `src/wifi_provision.*`  | captive portal + WiFi connect                          |
| `src/tuya_client.*`     | Tuya OpenAPI v2.0 client (HMAC-SHA256)                 |
| `src/supabase_client.*` | Supabase REST writes + Realtime WebSocket subscribers  |
| `src/climate.*`         | climate evaluator (port of the Dart controller logic)  |
| `src/burst.*`           | duty-cycle (burst) controller for the hum + dehu       |
| `src/ring_buffer.*`     | bounded in-RAM queue for samples/events on retry       |
| `include/types.h`       | C++ structs mirroring the Supabase row shapes          |

## Operational invariants

- **No local persistence** beyond NVS config and a 256-entry RAM ring buffer
  for unsent telemetry. The grow-room source-of-truth is Supabase; the hub
  never writes sensor history to flash.
- **Internet outages do not stop control.** The climate loop keeps polling
  Tuya and flipping relays. Supabase writes back up in the RAM buffer until
  connectivity returns.
- **The phone is a remote, not the controller.** When the phone is offline
  the room keeps running.

## Tuya prerequisites

Provisioning the hub requires a Tuya IoT Core Cloud Development Project
(separate from the Smart-Life App SDK credentials the Flutter app uses
today). At https://iot.tuya.com:

1. Create a Cloud project, note its `Access ID/Client ID` and
   `Access Secret/Client Secret`.
2. Enable the **IoT Core** + **Authorization Token Management** APIs.
3. Run the **Link Devices by App Account** wizard inside the project and
   attach your Smart Life / Growmie user. Confirm the canopy sensor, hum,
   and dehu show up under *Devices*.
