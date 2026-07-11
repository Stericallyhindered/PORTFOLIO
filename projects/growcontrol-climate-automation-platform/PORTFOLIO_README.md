# growcontrol-climate-automation-platform

Flutter + firmware + Supabase grow room control system. This project shows a full product shape across mobile UI, device gateways, climate math, telemetry, automation rules, firmware, local device control, and database migrations.

## What It Shows

- Flutter app structure for dashboards, devices, scenes, logs, calibration, and manual control.
- Domain logic for VPD calculations, telemetry windows, spike detection, scene rules, and actuator role settings.
- Service layer for Supabase, Tuya/local device gateways, settings, logs, and climate control.
- Firmware code for hub-side climate/device control and provisioning.
- Supabase migrations that show backend data modeling for hubs, devices, ownership, and local Tuya state.

## Key Files

- `lib/main.dart` - app entry point.
- `lib/state/grow_room_controller.dart` - central app/control state.
- `lib/domain/vpd/vpd_calculator.dart` - environmental math.
- `lib/services/device_gateway.dart` - device abstraction.
- `lib/services/scene_rules_evaluator.dart` - automation rule evaluation.
- `firmware/growmie-hub/src/main.cpp` - hub firmware entry point.
- `supabase/migrations` - database schema and policy work.

## Portfolio Notes

This is a sanitized source snapshot for portfolio review. Build outputs, vendor SDK bundle folders, local environment files, generated Flutter files, APK/AAR artifacts, IDE metadata, and real secret headers were intentionally excluded.
