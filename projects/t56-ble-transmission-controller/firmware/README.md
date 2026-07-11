# Grannas T56 Firmware

M5Stamp C3 (ESP32-C3) firmware for T56 PWM gear detection and BMW PWM output.

## Build

Requires [PlatformIO](https://platformio.org/):

```bash
pio run
pio run -t upload
pio device monitor
```

## GPIO (edit `include/pins.h`)

| Signal | Default pin |
|--------|-------------|
| PWM IN 0 | GPIO 0 |
| PWM IN 1 | GPIO 1 |
| PWM IN 2 | GPIO 2 |
| PWM OUT 0 | GPIO 3 |
| PWM OUT 1 | GPIO 4 |

## BLE

Implements [docs/ble_protocol.md](../docs/ble_protocol.md). Advertises as **Grannas-T56**.

## OTA

Dual-slot partition table in `partitions.csv`. Flash `.bin` from app OTA screen or:

```bash
pio run -t upload --upload-port COMx
```

Output binary: `.pio/build/m5stamp_c3/firmware.bin`
