# Grannas T56 BLE Protocol

Source of truth for the Flutter app and M5Stamp C3 firmware. Both sides must implement this spec byte-for-byte.

## Device identity

| Field | Value |
|-------|-------|
| Advertised name | `Grannas-T56` |
| Service UUID | `4faf2012-1fb5-459e-8fcc-c5c9c331914b` |

## GATT characteristics

| Name | UUID | Properties | Max size |
|------|------|------------|----------|
| deviceInfo | `4faf2012-1fb5-459e-8fcc-c5c9c331914c` | Read | 256 B |
| liveStatus | `4faf2012-1fb5-459e-8fcc-c5c9c331914d` | Read, Notify | 32 B |
| activePreset | `4faf2012-1fb5-459e-8fcc-c5c9c331914e` | Read, Write | 64 B |
| configControl | `4faf2012-1fb5-459e-8fcc-c5c9c331914f` | Write | 8 B |
| configData | `4faf2012-1fb5-459e-8fcc-c5c9c3319150` | Read, Write | 512 B |
| otaControl | `4faf2012-1fb5-459e-8fcc-c5c9c3319151` | Write | 37 B |
| otaData | `4faf2012-1fb5-459e-8fcc-c5c9c3319152` | Write Without Response | 512 B |

Recommended MTU: 517 (negotiate after connect).

---

## deviceInfo (Read)

UTF-8 JSON object:

```json
{
  "fwVersion": "1.0.0",
  "hwRev": "M5Stamp-C3",
  "presetId": "t56_stock",
  "inputCount": 3,
  "outputCount": 2
}
```

---

## liveStatus (Read / Notify)

Binary layout, little-endian:

| Offset | Size | Field |
|--------|------|-------|
| 0 | 1 | `gearIndex` — 0=Neutral, 1=1st … 7=6th, 8=Reverse, 255=Unknown |
| 1 | 1 | `flags` — bit0: outputsDisabled, bit1: configDirty |
| 2 | 2 | Input 0 duty ×100 (uint16, e.g. 2900 = 29.00%) |
| 4 | 2 | Input 0 period ×100 (uint16, e.g. 400 = 4.00 ms) |
| 6 | 2 | Input 1 duty ×100 |
| 8 | 2 | Input 1 period ×100 |
| 10 | 2 | Input 2 duty ×100 |
| 12 | 2 | Input 2 period ×100 |
| 14 | 2 | Output 0 duty ×100 |
| 16 | 2 | Output 0 period ×100 |
| 18 | 2 | Output 1 duty ×100 |
| 20 | 2 | Output 1 period ×100 |

Total: 22 bytes. Notify at 10–20 Hz while connected.

---

## activePreset (Read / Write)

UTF-8 preset ID string (e.g. `t56_stock`). Write updates active preset metadata; full table still transferred via config sync.

---

## Config sync

### configControl opcodes

| Opcode | Value | Payload |
|--------|-------|---------|
| START_WRITE | `0x01` | `[0x01][totalLen u32 LE]` |
| COMMIT | `0x02` | `[0x02]` |
| READ_BACK | `0x03` | `[0x03]` |
| RESET_DEFAULT | `0x04` | `[0x04]` |

### configControl responses (Read on configData after write)

First byte is status: `0x00` = OK, non-zero = error code.

| Code | Meaning |
|------|---------|
| 0x01 | Invalid opcode |
| 0x02 | Length mismatch |
| 0x03 | CRC mismatch |
| 0x04 | NVS write failed |

### Chunked write sequence

1. App writes `START_WRITE` with total payload length (JSON UTF-8 bytes).
2. App writes chunks to `configData`: `[chunkIndex u16 LE][payload…]`. Chunk index starts at 0.
3. App writes `COMMIT`. Firmware validates CRC32 of full payload, parses JSON, stores to NVS.
4. On success, firmware responds via readable `configData`: `[0x00]`.

### READ_BACK sequence

1. App writes `READ_BACK` to `configControl`.
2. Firmware sets readable `configData` header: `[0x00][totalLen u32 LE][chunkCount u16 LE]`.
3. App reads chunks by writing chunk index to `configData` as `[chunkIndex u16 LE]`, then reading response `[chunkIndex u16 LE][payload…]`.

### Config payload format

UTF-8 JSON matching `shared/schema/mapping_schema.json` (GearMappingPreset).

CRC32 (IEEE polynomial) of full JSON appended internally by firmware on COMMIT — not sent over BLE.

---

## OTA firmware update

Uses ESP32-C3 dual OTA partitions. App sends compiled `.bin` from PlatformIO build.

### otaControl opcodes

| Opcode | Value | Payload |
|--------|-------|---------|
| BEGIN | `0x01` | `[0x01][size u32 LE][sha256 32 bytes]` |
| ABORT | `0x02` | `[0x02]` |
| FINALIZE | `0x03` | `[0x03]` |

### OTA sequence

1. App writes `BEGIN` with file size and SHA-256 hash.
2. Firmware calls `esp_ota_begin`, responds on `configData` read: `[0x00]` or error.
3. App streams raw bytes to `otaData` (write without response). Offset is implicit (sequential).
4. Every 4 KB firmware may update progress readable via `deviceInfo` field `"otaProgress": N` (optional JSON extension during OTA).
5. App writes `FINALIZE`. Firmware verifies SHA-256, calls `esp_ota_end`, responds `[0x00]`, reboots.
6. On error at any step, app writes `ABORT`.

### Chunk size

Use 480-byte payloads on `otaData` to stay within MTU after ATT overhead.

---

## Error handling

- All multi-byte integers: little-endian.
- If disconnected during config or OTA, firmware discards partial buffer.
- OTA ABORT or disconnect rolls back partial OTA write.

---

## Gear index reference

| Index | Gear |
|-------|------|
| 0 | Neutral |
| 1 | 1st |
| 2 | 2nd |
| 3 | 3rd |
| 4 | 4th |
| 5 | 5th |
| 6 | 6th |
| 7 | Reverse |
| 255 | Unknown |

Note: Reverse is index 7 in firmware (6th is index 6). JSON gear order in preset: Neutral, 1st–6th, Reverse (indices 0–7).
