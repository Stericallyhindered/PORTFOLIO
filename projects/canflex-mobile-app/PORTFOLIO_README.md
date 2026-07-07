# canflex-mobile-app

Current CANFlex/NewCANFlex Flutter hardware app work: BLE/device communication, firmware screens, logs, gauges, E85 calculator, settings, Android/iOS platform structure, and the mobile support tooling around an automotive hardware product.

## Portfolio Notes

This is a sanitized source snapshot for portfolio review. Build artifacts, dependency folders, local environment files, databases, credentials, large binary assets, archives, and generated outputs were intentionally excluded.

## Why It Matters

- Shows mobile software talking to hardware, not just a normal app screen.
- Demonstrates Flutter/Dart UI, BLE communication, firmware-related workflows, logs, settings, fuel/ethanol telemetry, CANbus output configuration, analog output modes, pressure sensor modes, and automotive support tooling.
- Included because hardware-connected software forces careful thinking around state, timing, errors, and user trust.

## Vehicle / Embedded Signals

- BLE-connected fuel and sensor controller workflows.
- Ethanol content, fuel temperature, fuel pressure, RPM, speed, water temp, oil temp, gear, and torque surfaces.
- CANbus output, analog output, pressure sensor, and calibration settings.
- Firmware/version handling and logs for race-car tuning support.
