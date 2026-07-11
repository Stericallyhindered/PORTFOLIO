# Hardware End-to-End Test Checklist

Run on M5Stamp C3 with T56 PWM inputs wired and BMW outputs connected to scope/DMM.

## Prerequisites

- [ ] Firmware flashed (`pio run -t upload`)
- [ ] App installed on Android or iOS
- [ ] Device advertises as `Grannas-T56`

## Connection

- [ ] App scan finds device
- [ ] Connect succeeds; deviceInfo shows fwVersion and presetId
- [ ] Disconnect/reconnect stable

## Gear detection

- [ ] Live screen shows Unknown in neutral/no signal
- [ ] Row through Neutral → 1st → 2nd → 3rd → 4th → 5th → 6th → Reverse
- [ ] Detected gear matches for each position
- [ ] No flutter at gear boundaries (hysteresis working)

## Config sync

- [ ] Read-back preset matches bundled t56_stock
- [ ] Edit output duty in table editor, push to device
- [ ] BMW outputs on scope match edited values for each gear
- [ ] RESET_DEFAULT restores t56_stock

## OTA

- [ ] Build new firmware: `pio run`
- [ ] Pick `.pio/build/.../firmware.bin` in app OTA screen
- [ ] Transfer completes; device reboots
- [ ] deviceInfo fwVersion matches new build

## Failure notes

Record failures with serial log (`pio device monitor`) and app screenshot.
