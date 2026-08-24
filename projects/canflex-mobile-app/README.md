# CANFlex Mobile App

This is a Flutter/Dart mobile app for a BLE-connected automotive fuel/sensor controller. It is included because it shows real mobile-to-hardware work, not just a UI demo.

The app is built around the kind of workflow that matters in the car: connect to the device, read live sensor data, show gauges, change settings, handle calibration, track logs, and keep firmware/version behavior visible.

## What It Shows

- Flutter/Dart mobile app structure
- BLE scan, connect, read/write, and notification handling
- live ethanol, fuel temperature, and fuel pressure telemetry
- CAN output configuration
- analog output and pressure mode settings
- calibration flows
- logging screens
- firmware/version awareness
- automotive hardware support UX

## Files Worth Reviewing

- `lib/ble_provider.dart`  
  Main BLE/device communication layer. This is the highest-signal file in the project.

- `lib/screens/main_screen.dart`  
  Live telemetry and gauge UI.

- `lib/screens/settings_page.dart`  
  CAN output, analog output, pressure mode, calibration, logs, and firmware/version UI.

- `lib/screens/log_page.dart`  
  Logging workflow.

- `lib/screens/e85_calculator.dart`  
  E85 calculation utility screen.

## Good Interview Questions

- Walk through the BLE connection lifecycle.
- How does a raw BLE notification become app state?
- What happens when the device disconnects while the user is changing settings?
- How would you test calibration and telemetry parsing without physical hardware connected?
- What would you refactor first if this app became a larger team project?

## Portfolio Note

This is a sanitized source snapshot. Generated builds, private binaries, local caches, secrets, and private environment files are excluded.

