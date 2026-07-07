# Flutter App

This Flutter app is the Phase 1 telemetry and logging shell for the
TurboLamik AWD controller project.

## What It Does Today

- renders a live monitoring dashboard for the normalized signal model
- shows recent raw CAN frames
- shows decoded drivetrain and chassis signals
- manages short raw-frame capture sessions
- stores saved sessions in-app and exports them as JSON text
- provides an ECU-style AWD tuning mode with per-mode editable maps
- displays the active `BMW E90 + TurboLamik` profile

The app currently boots into an explicit demo telemetry service because the ESP32
BLE firmware transport is not complete yet. Screens depend on a shared telemetry
service interface so the real ESP32 data source can replace demo mode cleanly.

## Main Screens

- `Live Dashboard`
- `Raw Frames`
- `Decoded Signals`
- `Capture Control`
- `Saved Sessions`
- `Tuning Mode`
- `Profile`

## Tuning Mode

Tuning mode is structured like a standalone ECU tuner. Each drive mode has its
own calibration set:

- `Street`
- `Rain`
- `Sport`
- `Drag / Launch`
- `Drift`
- `Dyno / Service`

Each mode exposes compact editable maps for preload/load, slip response, shift
behavior, driveline coupling, clutch/shaft slip, steering limits, launch/low
speed behavior, and gearbox mode/program influence. Drag / Launch includes a
brake-staging launch timer so users can hold AWD during launch and ramp back to
RWD after a configured time.

## Run

```bash
flutter run
```

## Verify

```bash
flutter test
flutter analyze --no-pub
```
