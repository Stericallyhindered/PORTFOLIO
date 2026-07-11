# t56-ble-transmission-controller

T56 / Grannas Racing controller project with firmware, Flutter app logic, BLE protocol notes, presets, mapping schema, and hardware test documentation. This snapshot shows hardware-connected product work across firmware, protocol design, mobile UI, and configuration data.

## What It Shows

- PlatformIO firmware with BLE server, config storage, PWM capture/output, and gear engine logic.
- Flutter app source for connection, live data, firmware, presets, and table editing workflows.
- Shared JSON presets and schema definitions for vehicle/output mapping.
- BLE protocol and hardware test documentation.

## Key Files

- `firmware/src/main.cpp` - firmware entry point.
- `firmware/src/ble_server.cpp` - BLE server behavior.
- `firmware/src/gear_engine.cpp` - gear/control logic.
- `app/lib/ble/protocol.dart` - app-side BLE protocol.
- `app/lib/services/ble_device_client.dart` - BLE client behavior.
- `shared/schema/mapping_schema.json` - mapping schema.
- `docs/ble_protocol.md` - protocol documentation.

## Portfolio Notes

This is a sanitized source snapshot for portfolio review. Build outputs, generated platform caches, APKs, local properties, and generated desktop/mobile build artifacts were intentionally excluded.
