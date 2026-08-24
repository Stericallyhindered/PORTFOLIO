# Verify Me In Interview

This file turns the biggest portfolio claims into direct interview probes.

If I wrote it or owned it, I should be able to explain it without hiding behind a README.

Unless a project README states otherwise, the code in this portfolio is my own work. These probes are meant to verify that directly: ask me to walk through the code, change it, debug it, or explain the tradeoffs.

## 1. Verify Hardware-Connected Mobile Work

Ask:

> Walk through one BLE command from a button tap to the device response.

Good files:

- `projects/jb4pro-mobile-device-tools/lib/providers/ble_provider.dart`
- `projects/canflex-mobile-app/lib/ble_provider.dart`
- `projects/t56-ble-transmission-controller/app/lib/services/ble_device_client.dart`

What I should be able to explain:

- command creation
- write path
- expected response
- notification parsing
- timeout
- retry
- connection loss
- stale UI state
- what should be logged

## 2. Verify Firmware Update Flow

Ask:

> Explain how the app handles bootloader entry, erase/write/checksum, and recovery from a failed firmware update.

Good files:

- `projects/jb4pro-mobile-device-tools/lib/screens/firmware_screen.dart`

What I should be able to explain:

- HEX/file handling
- chunking/block writes
- bootloader state
- partial failure
- checksum mismatch
- lost connection
- recovery strategy
- what I would test

## 3. Verify CAN / Telemetry Work

Ask:

> How does a raw CAN frame become a decoded value, health state, or derived drivetrain metric?

Good files:

- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/can_rx.c`
- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/e90_profile_decoder.c`
- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/turbolamik_decoder.c`
- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/derived_metrics.c`

What I should be able to explain:

- CAN IDs
- signal decoding
- scaling
- stale/missing data
- watchdog/health state
- derived metrics
- shadow-mode vs production control
- what would need validation before controlling anything real

## 4. Verify AI Support And Guardrails

Ask:

> How do you keep an AI support system from making unsupported warranty, diagnostic, or machine-operation claims?

Good files/projects:

- `projects/stealth-ai-operations-ecosystem`
- `projects/techsupport-ai-backend/src/services/aiService.js`
- `projects/stealth-machine-backend/src/lib/ai.ts`

What I should be able to explain:

- context selection
- document ingestion
- tool boundaries
- permissions
- structured outputs
- escalation
- audit trail
- human review
- fallback behavior
- why some decisions should never be left to the model

## 5. Verify BMW G-Chassis Calibration Tooling

Ask:

> Walk through how a DME BIN and XDF definition become an editable calibration table, then explain what has to be true before any output should be considered flash-ready.

Good files:

- `projects/redline-gcal-bmw-g-chassis-calibration-studio/src/Redline.Calibration.Binary/CalibrationBinaryDocument.cs`
- `projects/redline-gcal-bmw-g-chassis-calibration-studio/src/Redline.Calibration.Definitions.Xdf/XdfParser.cs`
- `projects/redline-gcal-bmw-g-chassis-calibration-studio/src/Redline.Calibration.Definitions.Xdf/AffineTransform.cs`
- `projects/redline-gcal-bmw-g-chassis-calibration-studio/src/Redline.Calibration.Logs/MhdLogParser.cs`
- `projects/redline-gcal-bmw-g-chassis-calibration-studio/tests/Redline.Calibration.Tests/UdsFlashTransferTests.cs`

What I should be able to explain:

- immutable source BIN handling
- address, signedness, byte order, dimensions, equations, and axis mapping
- changed-byte tracking
- draft export vs flash-ready output
- checksum-provider boundary
- log-channel normalization
- diagnostic session state
- why operator confirmation and recovery behavior matter

## 6. Verify Full-Stack Business Systems

Ask:

> Draw the data flow for an order, customer issue, warranty claim, or support ticket from UI to database to admin workflow.

Good projects:

- `projects/stealth-batteries-commerce-admin`
- `projects/customer-tracking-crm`
- `projects/stealth-machine-backend`
- `projects/laserconsumables-commerce`

What I should be able to explain:

- schema design
- route/API boundaries
- auth and roles
- admin/customer split
- status transitions
- audit logs
- webhook safety
- duplicate events
- what breaks at scale

## 7. Verify Template vs Custom Work

Ask:

> What came from the framework or template, and what did you actually build on top of it?

Good project:

- `projects/stealth-batteries-commerce-admin`

What I should be able to explain:

- Payload base
- custom collections
- custom order/customer/dealer/affiliate/sales rep structure
- shipping and Stripe routes
- admin UI
- migrations
- business logic
- what I would remove or refactor today

## 8. Verify Leadership Claims

Ask:

> Tell me about a junior engineer's proof of concept you had to turn into production code.

What I should be able to explain:

- what was wrong with the first version
- how I reviewed it
- what I changed
- how I taught the pattern
- what I let them keep
- what became a team standard

Reference-verifiable claims:

- leadership scope
- team size
- employment dates
- production ownership
- company impact

## 9. Verify Scientific / Regulated Workflow Experience

Ask:

> How did analytical testing and ISO lab practices shape the way you build software?

What I should be able to explain:

- HPLC and mass spec context
- method/run traceability
- validation checks
- reporting
- exception review
- regulated documentation
- data integrity
- why "good enough" software can be dangerous in lab/medical-adjacent workflows

## 10. Ask Me What I Would Improve

Ask:

> Pick one project in this portfolio and tell me what you dislike about it now.

A real answer should include tradeoffs, not defensiveness.

Things I might discuss:

- missing tests
- too much logic in one file
- old patterns from legacy hardware projects
- where I would add fixtures
- where auth should be tightened
- where observability should be better
- where a prototype should become a cleaner module boundary

## 11. Best Overall Interview Flow

If I were interviewing myself from this repo, I would do this:

1. Ask me to walk through JB4Pro or CANFlex BLE code.
2. Jump to Redline GCAL BIN/XDF calibration workflow.
3. Jump to TurboLamik CAN decoding.
4. Jump to Stealth Machine Backend schema and AI workflow.
5. Ask how I would test the weakest public areas.
6. Ask what production claim needs references.
7. Ask what I would refactor first.

That will show very quickly whether the portfolio is real depth or just polished writing.
