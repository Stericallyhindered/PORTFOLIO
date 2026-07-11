# T56 Grannas

T56 manual gearbox PWM translator — Flutter mobile app + M5Stamp C3 firmware.

Reads 3 PWM inputs from a T56 gear position sensor, maps to detected gear, outputs 2 PWM signals for BMW protocol. Configure presets and update firmware over BLE.

## Repository layout

```
t56-grannas/
  app/           Flutter mobile app (Android + iOS)
  firmware/      M5Stamp C3 firmware (PlatformIO)
  shared/        JSON schema and bundled presets
  docs/          BLE protocol specification
```

## Quick start — App

```bash
cd app
flutter pub get
flutter run
```

## Quick start — Firmware

```bash
cd firmware
pio run -t upload
```

Target board: M5Stamp C3 (ESP32-C3). Adjust GPIO pins in `firmware/include/pins.h` for your wiring.

## BLE

See [docs/ble_protocol.md](docs/ble_protocol.md). Device advertises as **Grannas-T56**.

## Presets

Bundled presets in `shared/presets/`:

- `t56_stock.json` — measured T56 input signatures
- `blank_bmw_outputs.json` — editable BMW output table
- `bmw_e46_t56.json` — platform stub

## Hardware test checklist

See [docs/hardware_test.md](docs/hardware_test.md).
