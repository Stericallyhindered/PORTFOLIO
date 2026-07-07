# E90 Phase 1 Signal Map

This document captures the current decode assumptions used by the Phase 1 ESP32 firmware.

**Scope:** a **Phase 1 subset** of BMW PT-CAN–style traffic needed for AWD monitoring — **not** a full OEM CAN matrix for the E90. IDs marked **provisional** require confirmation from live bus captures before any control output.

## Confirmed From BMW BN2000 References

- `0x0AA`
  - Byte `3`: throttle / accelerator position, scale `0.39063%`
  - Bytes `4-5`: engine RPM, little-endian, scale `0.25 rpm`
- `0x0CE`
  - Bytes `0-1`: front-left wheel speed
  - Bytes `2-3`: front-right wheel speed
  - Bytes `4-5`: rear-left wheel speed
  - Bytes `6-7`: rear-right wheel speed
  - All wheel speeds are little-endian with scale `0.0625 km/h`
- `0x1D0`
  - Byte `0`: coolant temp, `raw - 48`
  - Byte `1`: oil temp, `raw - 48`

References:
- MS4X BN2000 `TORQUE_3 0x0AA`
- MS4X BN2000 `CAN Bus ID 0x0CE`
- MS4X BN2000 `ENGINE_1 0x1D0`

## Provisional Decodes Requiring In-Car Validation

- `0x0C8`
  - Steering angle currently decoded as signed little-endian bytes `0-1` with `0.1 deg` scale.
- `0x19E`
  - Brake proxy currently uses bytes `1` and `2` as a simple activity estimate.
- `0x1B4`
  - Handbrake currently uses a fixed example-status match on byte `7`.
- `0x34F`
  - Handbrake currently uses byte `0 == 0xFE`.
- `0x24A`
  - Reverse currently uses byte `0 == 0x06`.
- `0x3B0`
  - Reverse currently uses byte `0 == 0xFD`.

These are sufficient for Phase 1 monitoring, but they must be validated from live captures before
any control output is enabled.

## Alternative engine ECU (MaxxECU)

If the vehicle uses **MaxxECU** instead of stock DME for engine management, default CAN output frames (**500 kbit/s**, 11-bit IDs **`0x520`–`0x542`**) carry RPM, throttle, MAP, slip, gear, and related channels. Full decode tables and version **1.2 vs 1.3** differences are in [maxxecu_can_output_default.md](maxxecu_can_output_default.md). BMW chassis IDs above still apply for SZL/DSC wheel speeds unless the harness architecture differs.
