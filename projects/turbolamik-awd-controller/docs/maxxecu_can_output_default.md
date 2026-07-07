# MaxxECU default CAN output protocol

Reference for **MaxxECU “default CAN output”** frames on the vehicle bus. Used when the engine is controlled by **MaxxECU** instead of (or alongside) stock BMW DME frames — Layer 1 pilot inputs can prefer these signals when present.

**Completeness:** this is the **full published default CAN output** definition for IDs **`0x520`–`0x542`** per vendor spec **v1.2 / v1.3** (RX on our side). It does **not** describe MaxxECU **inputs**, tuning CAN, or custom user buses unless vendor documents those separately.

**Vendor:** MaxxECU documentation (versions **1.2** 2014-12-05, **1.3** 2020-09-29). Official **DBC** files may exist on MaxxECU’s download section — prefer DBC for tooling; this file mirrors the published specification for firmware.

## Transport

| Item | Value |
|------|--------|
| Bit rate | **500 kbit/s** |
| IDs | **11-bit standard** |
| Byte order | **Little-endian** (LSB first) |
| Typical layout | Many frames: **8 bytes** = **four int16** values at offsets **0, 2, 4, 6** |
| Bus load | **~7%** extra with v1.2 output enabled; **~13%** with v1.3 (per vendor notes) |

**Hardware:** MaxxECU **CAN 1** often has **built-in termination**. Vendor recommends **external 120 Ω** for bus lengths **> 1 m**. **CAN 2** (PRO secondary bus): **no** built-in terminator per spec.

**Wiring (loom):** twisted **pink / grey** — **Pink = CAN L**, **Grey = CAN H**.

## Version summary

| Topic | v1.2 | v1.3 |
|-------|------|------|
| Extra load | ~7% | ~13% (includes v1.2 content) |
| `0x536` bytes **4–6** | SPARE / unused in older spec | **Oil pressure** (kPa), **Oil temp** (°C) — firmware **1.135+** |
| New / expanded IDs | — | `0x537`–`0x542`, extended `0x525`–`0x528`, bitfield frame `0x526`, etc. |

Implementations should select **`MAXXECU_CAN_PROTOCOL_MINOR = 2 | 3`** (or decode union/guards when firmware version is unknown).

---

## FAST group (~50 Hz) — four int16 per message unless noted

Scale uses European decimal comma in original docs (`0,1` → **0.1**).

### 0x520 FAST1 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | RPM | rpm | 1 |
| 2 | Throttle position / pedal | % | 0.1 |
| 4 | MAP | kPa | 0.1 |
| 6 | Lambda | — | 0.001 (average lambda) |

### 0x521 FAST2 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Lambda A | — | 0.001 |
| 2 | Lambda B | — | 0.001 |
| 4 | Ignition angle | BTDC | 0.1 |
| 6 | Ignition cut | % | 1 |

### 0x522 FAST3 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Fuel pulsewidth primary | ms | 0.01 |
| 2 | Fuel duty primary | % | 0.1 (may exceed 100%) |
| 4 | Fuel cut | % | 1 |
| 6 | Vehicle speed | km/h | 0.1 (display) |

### 0x523 FAST4 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Undriven wheels avg speed | km/h | 0.1 |
| 2 | Driven wheels avg speed | km/h | 0.1 |
| 4 | Wheel slip | % | 0.1 |
| 6 | Target slip | % | 0.1 |

*Zeros when traction control not used (per vendor).*

### 0x524 FAST5 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Traction ctrl power limit | % | 0.1 |
| 2 | Lambda corr A | % | 0.1 |
| 4 | Lambda corr B | % | 0.1 |
| 6 | Firmware version | — | 0.001 |

### 0x525 FAST6 — v1.3+ (firmware 1.135+)

Four **user channels** at 50 Hz:

| Offset | Signal | Scale |
|--------|--------|-------|
| 0 | User channel 9 | 0.1 |
| 2 | User channel 10 | 0.1 |
| 4 | User channel 11 | 0.1 |
| 6 | User channel 12 | 0.1 |

### 0x526 FAST7 — v1.3+ (firmware 1.135+)

| Bytes | Content |
|-------|---------|
| **0** | Bitfield — see below |
| **1** | Bitfield — see below |
| **2–3** | SPARE (int16), reserved |
| **4–5** | Rev-limit RPM (int16), scale 1 |
| **6–7** | SPARE (int16), reserved |

**Byte 0 bits (name → meaning):**

| Bit | Signal |
|-----|--------|
| 0 | Shiftcut active |
| 1 | Rev-limit active |
| 2 | Anti-lag active |
| 3 | Launch control active |
| 4 | Traction power limiter active |
| 5 | Throttle blip active |
| 6 | AC / idle up active |
| 7 | Knock detected (visible ~250 ms after knock) |

**Byte 1 bits:**

| Bit | Signal |
|-----|--------|
| 0 | Brake pedal active |
| 1 | Clutch pedal active |
| 2 | Speed limit active |
| 3 | GP limiter active |
| 4 | User cut active |
| 5 | ECU is logging |
| 6 | Nitrous active |
| 7 | SPARE (reserved) |

### 0x527 FAST8 — v1.3+ (firmware 1.135+)

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Acceleration forward | G | 0.01 |
| 2 | Acceleration right | G | 0.01 |
| 4 | Acceleration up | G | 0.01 |
| 6 | Lambda target | — | 0.001 |

*Layer 1 / Layer 2:* longitudinal & lateral acceleration proxies for pilot/regulator math when BMW IMU CAN is unavailable.

### 0x528 FAST9 — v1.3+ (firmware 1.135+)

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Knock level all peak | — | 1 |
| 2 | Knock correction | deg | 0.1 |
| 4 | Knock count | — | 1 |
| 6 | Last knock cylinder | — | 1 |

---

## SLOW group (~10 Hz) — four int16 per message unless noted

### 0x530 SLOW1 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Battery voltage | V | 0.01 |
| 2 | Baro pressure | kPa | 0.1 |
| 4 | Intake air temp | °C | 0.1 |
| 6 | Coolant temp | °C | 0.1 |

### 0x531 SLOW2 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Total fuel trim | % | 0.1 |
| 2 | Ethanol concentration | % | 0.1 (85% when no sensor / error) |
| 4 | Total ignition comp | deg | 0.1 |
| 6 | EGT 1 | °C | 1 |

### 0x532 SLOW3 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | EGT 2 | °C | 1 |
| 2 | EGT 3 | °C | 1 |
| 4 | EGT 4 | °C | 1 |
| 6 | EGT 5 | °C | 1 |

### 0x533 SLOW4 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | EGT 6 | °C | 1 |
| 2 | EGT 7 | °C | 1 |
| 4 | EGT 8 | °C | 1 |
| 6 | EGT highest | °C | 1 |

### 0x534 SLOW5 — v1.2+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | EGT difference | °C | 1 |
| 2 | CPU temp | °C | 1 |
| 4 | Error code count | — | 1 |
| 6 | Lost sync count | — | 1 |

### 0x535 SLOW6 — v1.2+ (firmware 1.79+)

User analog inputs 1–4 — scale 0.1, unit “user”.

### 0x536 SLOW7 — v1.2+

| Offset | Signal | Unit | Scale | Notes |
|--------|--------|------|-------|-------|
| 0 | Gear | — | 1 | Manual calc or commanded gear |
| 2 | Boost solenoid duty | % | 0.1 | |
| 4 | Oil pressure | kPa | 0.1 | **v1.3 payload** on CAN (fw **1.135+**); v1.2 SPARE |
| 6 | Oil temp | °C | 0.1 | **v1.3 payload** on CAN (fw **1.135+**); v1.2 SPARE |

### 0x537 SLOW8 — v1.3+ (firmware 1.135+)

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | Fuel pressure 1 | kPa | 0.1 |
| 2 | Wastegate pressure | kPa | 0.1 |
| 4 | Coolant pressure | kPa | 0.1 |
| 6 | Boost target | kPa | 0.1 |

### 0x538 SLOW9 — v1.3+

User channels 1–4 — scale 0.1.

### 0x539 SLOW10 — v1.3+

User channels 5–8 — scale 0.1.

### 0x540 SLOW11 — v1.3+ (firmware 1.135+)

| Offset | Signal | Type | Unit | Scale |
|--------|--------|------|------|-------|
| 0 | Active boost table | uint8 | — | 1 |
| 1 | Active tune selector | uint8 | — | 1 |
| 2 | Virtual fuel tank | int16 | L | 0.1 |
| 4 | Transmission temp | int16 | °C | 0.1 |
| 6 | Differential temp | int16 | °C | 0.1 |

### 0x541 SLOW12 — v1.3+

| Offset | Signal | Unit | Scale |
|--------|--------|------|-------|
| 0 | VVT intake cam 1 position | deg | 0.1 |
| 2 | VVT exhaust cam 1 position | deg | 0.1 |
| 4 | VVT intake cam 2 position | deg | 0.1 |
| 6 | VVT exhaust cam 2 position | deg | 0.1 |

### 0x542 SLOW13 — v1.3+

| Offset | Signal | Type | Notes |
|--------|--------|------|-------|
| 0 | VVT intake cam target | int16 | deg, scale 0.1 |
| 2 | VVT exhaust cam target | int16 | deg, scale 0.1 |
| 4 | ECU error code(s) | **uint16** | Rotating stored codes; **0x0000** if none — fw **1.149+** |
| 6 | SPARE | int16 | Reserved |

---

## AWD integration notes (TurboLamik project)

- **Layer 1 pilot:** Prefer **`0x520`** RPM, throttle, MAP; **`0x536`** gear (and oil pressure/temp when v1.3); use **`0x527`** accelerations if BMW DSC IMU not decoded.
- **Layer 2 regulator:** **`0x523`** slip / target slip / driven vs undriven speeds complement chassis wheel-speed deltas; **`0x526`** brake/clutch/traction bits align with BMW brake/handbrake signals — pick **one authoritative source** per signal to avoid fighting duplicate estimates (policy in firmware).
- **Coexistence:** MaxxECU IDs (**`0x520`–`0x542`**) do not overlap TurboLamik **`0x720`–`0x723`** or typical **E90** IDs listed in `e90_phase1_signal_map.md`; still validate **bus termination** and total load when merging ECUs.

---

## Firmware version field

**Firmware version** is carried as int16 at **`0x524` offset 6** with scale **0.001** (v1.2+). Use it at runtime to enable **v1.3-only** frames if needed.
