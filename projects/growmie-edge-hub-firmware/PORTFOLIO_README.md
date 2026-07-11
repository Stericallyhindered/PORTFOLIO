# growmie-edge-hub-firmware

Arduino/ESP-style grow room hub firmware for climate sensing, local device control, provisioning, buffering, and cloud sync. This project shows embedded-adjacent automation work that connects physical devices, local state, and backend services.

## What It Shows

- Firmware organization across climate, burst control, local Tuya integration, Supabase sync, provisioning, and config storage.
- Ring-buffer and state-management code for device-side telemetry/workflow handling.
- Separation of defaults/examples from private runtime secrets.
- Practical automation code for sensors, environmental control, and device orchestration.

## Key Files

- `growmie_hub_arduino.ino` - Arduino entry point.
- `src/main.cpp` - core firmware application flow.
- `src/climate.cpp` - climate control behavior.
- `src/local_tuya.cpp` - local Tuya/device integration.
- `src/supabase_client.cpp` - backend sync client.
- `include/hub_secrets.example.h` - safe example secret header.

## Portfolio Notes

This is a sanitized source snapshot for portfolio review. Real Wi-Fi and hub secret headers were excluded; only example headers were kept.
