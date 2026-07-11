# Growmie Hub — Arduino IDE sketch

Open **`growmie-hub-arduino.ino`** in Arduino IDE (double-click or File → Open). The sketch folder name must match the `.ino` filename (`growmie-hub-arduino`).

## Libraries

Install via **Sketch → Include Library → Manage Libraries…**

| Library       | Author           | Notes        |
| ------------- | ---------------- | ------------ |
| **ArduinoJson** | Benoit Blanchon | v7.x         |
| **WiFiManager** | tzapu           | v2.x         |

mbedTLS and WiFi stack ship with the ESP32 core.

## Board package

**File → Preferences → Additional boards manager URLs:** add Espressif’s ESP32 index if needed, then **Tools → Board → Boards Manager → esp32** (by Espressif Systems).

Pick the board that matches your module (e.g. **ESP32-S3 Dev Module**).

## Optional secrets (same workflow as PlatformIO `firmware/growmie-hub`)

- `include/wifi_secrets.h` — copy from `wifi_secrets.h.example`
- `include/hub_secrets.h` — copy from `hub_secrets.example.h`

Both filenames are gitignored when present.

## Same firmware as PlatformIO

Logic is mirrored from `firmware/growmie-hub/`. Prefer PlatformIO for repeatable CLI builds; use this folder when you develop in Arduino IDE only.
