# Testing and validation

Validation depends on the system and its failure modes.

| System | Validation areas |
| --- | --- |
| APIs and business applications | Input validation, permissions, transactions, duplicate events, external service failures, and audit records. |
| Device communications | Packet parsing, timeouts, reconnects, stale data, and settings readback. |
| Firmware updates | File parsing, transfer order, checksums, interrupted transfers, and recovery. |
| CAN telemetry | Signal scaling, timestamps, invalid frames, freshness, and recorded-data replay. |
| Calibration tools | Binary boundaries, byte order, definitions, changed-byte tracking, export, and undo/redo. |
| AI support | Retrieval, tool permissions, structured responses, escalation, and regression cases. |

Project-specific tests and setup instructions are included with the relevant source.