# TurboLamik AWD Controller

Phase 1 of the project is now split into two parallel tracks:

- `firmware/`
  - ESP-IDF-oriented passive CAN listener scaffold for `BMW E90 + TurboLamik`
  - decodes selected E90 IDs and TurboLamik `TCU V2 TX` frames
  - computes normalized signals, derived metrics, health state, and shadow AWD output
  - keeps raw CAN captures in a ring buffer for later export
- `app/`
  - Flutter telemetry and logging shell
  - live dashboard, raw frame monitor, decoded signal view, capture control, saved sessions, and profile view
  - currently driven by a mock telemetry source that mirrors the Phase 1 firmware contract

## Phase 1 Scope

This milestone is intentionally passive.

- listen to E90 and TurboLamik traffic on a shared `500 kbps` bus
- normalize the required drivetrain and chassis signals
- compute derived metrics and a shadow-mode AWD request
- surface telemetry over BLE to the app
- log raw and decoded data for validation

What is intentionally out of scope for Phase 1:

- transfer-case command output
- tuning-map editing in the app
- production BLE protocol
- final vehicle-specific validation of every provisional E90 decode

## Key References

- [docs/e90_phase1_signal_map.md](./docs/e90_phase1_signal_map.md)
- [turbolamik_adx_protocol.md](./turbolamik_adx_protocol.md)

## Current Status

- firmware scaffolding is in place for:
  - signal store
  - raw log buffer
  - health/watchdog
  - E90 decoder
  - TurboLamik decoder
  - derived metrics
  - BLE service stub
  - CAN RX integration point
- Flutter app shell is in place for:
  - device status
  - live telemetry dashboard
  - raw frame monitor
  - decoded signal monitor
  - capture control
  - saved log browser/export
  - vehicle profile display

## Next Steps

1. Bench and in-car validate each provisional E90 field decode.
2. Replace the Flutter mock telemetry stream with the real BLE protocol.
3. Bring up ESP-IDF on target hardware and wire in the actual TWAI and BLE stacks.
4. Run AWD logic in shadow mode against recorded sessions.
5. Add transfer-case command output only after passive validation is stable.
