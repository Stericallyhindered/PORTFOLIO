# JB4Pro Mobile Device Tools

This is the final JB4Pro Flutter mobile app source snapshot from `D:\jb4pro_final`.

This project is included because it shows real hardware-connected mobile work: BLE/device communication, automotive tuning workflows, gauges, logging, settings, firmware-related command flows, user-adjustment screens, WMI/diagnostic views, protocol notes, and platform-specific Flutter app structure.

## What To Look At

- `lib/main.dart` - app entry point and primary app wiring
- `lib/providers/ble_provider.dart` - BLE/device communication logic
- `lib/gauge_screen.dart` and `lib/custom_gauge_widget.dart` - live gauge/dashboard UI work
- `lib/logging_screen.dart` - vehicle data/logging workflow
- `lib/settings_screen.dart` and `lib/user_adjustment_screen.dart` - tuning/settings workflows
- `lib/screens/firmware_screen.dart` - firmware-related app flow
- `lib/wmi_screen.dart` - vehicle/diagnostic lookup workflow
- `Mapping.cs` - mapping/protocol-related support code
- `savingsettings.txt`, `settings_protocol.txt`, and related docs - command/settings notes and implementation references

## Portfolio Note

This is a sanitized public snapshot. Generated build outputs, local caches, packaged app binaries, runtime secrets, and private environment files are excluded. Source, docs, assets, platform scaffolding, and implementation notes are intentionally kept so the project is reviewable.
