# turbolamik-awd-controller

Vehicle/embedded software project for a BMW E90 + TurboLamik AWD/transmission integration.

This project shows the part of my work that sits closest to firmware and vehicle networks: passive CAN capture, signal decoding, health/watchdog state, derived drivetrain metrics, shadow-mode AWD logic, BLE telemetry surfaces, and a Flutter dashboard for raw/decoded vehicle data.

## What It Shows

- ESP-IDF-oriented firmware scaffold in C.
- Passive CAN listener architecture for a shared 500 kbps vehicle bus.
- BMW E90 PT-CAN-style signal mapping for throttle, RPM, wheel speeds, temperatures, steering, brake proxy, handbrake, and reverse state.
- TurboLamik TCU frame decoding for gear, torque reduction, shift state, lockup, oil temperature, vehicle speed, clutch/converter slip, input shaft RPM, and output shaft RPM.
- Raw CAN capture and ring-buffer logging for later validation.
- Health/watchdog state and signal validity handling.
- Derived metrics for axle speed deltas, slip ratios, drivetrain state, and shadow AWD request percentage.
- BLE service stub and Flutter telemetry/logging app shell.
- ADX protocol reverse-engineering notes for TurboLamik log packets and serial-style client behavior.
- MaxxECU default CAN output documentation for integration with alternate engine ECU setups.

## Key Files

- `firmware/components/awd_core/src/can_rx.c` - CAN frame intake, capture, decode dispatch, metrics, and health refresh.
- `firmware/components/awd_core/src/e90_profile_decoder.c` - BMW E90 signal decoding.
- `firmware/components/awd_core/src/turbolamik_decoder.c` - TurboLamik TCU CAN frame decoding.
- `firmware/components/awd_core/src/derived_metrics.c` - derived drivetrain metrics and shadow AWD request logic.
- `docs/e90_phase1_signal_map.md` - confirmed and provisional E90 signal map.
- `docs/maxxecu_can_output_default.md` - MaxxECU CAN output reference.
- `turbolamik_adx_protocol.md` - reverse-engineered ADX/TunerPro protocol notes.
- `app/lib/screens/dashboard_screen.dart` - Flutter telemetry dashboard.
- `app/lib/screens/raw_frames_screen.dart` - raw CAN frame monitor.
- `app/lib/screens/decoded_signals_screen.dart` - decoded signal monitor.

## Portfolio Notes

This is a sanitized source snapshot. Generated builds, caches, local files, and binary calibration files were excluded. Control output is intentionally treated as a later phase; this snapshot emphasizes passive validation, observability, and safe integration before commanding hardware.
