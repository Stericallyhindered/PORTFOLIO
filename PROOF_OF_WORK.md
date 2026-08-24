# Proof Of Work

This file exists because the repo is broad. A reviewer should not have to guess which claims are backed by public code and which ones need to be verified in an interview.

## Context

Most production work lived in private company repos. This public repo contains sanitized source snapshots, rebuilt examples, architecture notes, and project READMEs. Secrets, customer data, private binaries, firmware images, generated builds, databases, and infrastructure details were removed.

That is why the public commit history should be read as a portfolio-publishing timeline, not the original work timeline.

## What The Repo Proves

| Claim | Public evidence | Status |
| --- | --- | --- |
| Full stack application work | `stealth-machine-backend`, `stealth-batteries-commerce-admin`, `customer-tracking-crm`, `geo-command-center-platform`, `laserconsumables-commerce` | Source-backed |
| Mobile apps connected to hardware | `jb4pro-mobile-device-tools`, `canflex-mobile-app`, `stealth-machine-tools-flutter`, `t56-ble-transmission-controller` | Source-backed |
| BLE/device communication | Flutter BLE providers, protocol docs, and device client code listed in `CODE_EXAMPLES.md` | Source-backed |
| CAN bus / vehicle telemetry | `turbolamik-awd-controller`, `canflex-mobile-app`, `jb4pro-mobile-device-tools` | Source-backed |
| Embedded and firmware-adjacent work | `turbolamik-awd-controller/firmware`, `growmie-edge-hub-firmware`, `esp32-mouse-controller`, `vehicle-touch-input-controller` | Source-backed |
| AI support workflows | `techsupport-ai-backend`, `stealth-ai-support-system`, `stealth-machine-backend/src/lib/ai.ts` | Source-backed |
| Commerce, CRM, and admin systems | `stealth-batteries-commerce-admin`, `customer-tracking-crm`, `laserconsumables-commerce`, `straincollector-commerce`, `bassclown-ecommerce` | Source-backed |
| Automotive tuning ecosystem experience | `jb4pro-mobile-device-tools`, `jb4pro-csharp-interface`, `canflex-mobile-app`, `turbolamik-awd-controller`, `str8tune-*` | Source-backed, production scale interview-verifiable |
| Industrial machine support software | `stealth-machine-backend`, `stealth-machine-tools-flutter`, `techsupport-ai-backend` | Source-backed, private production scope interview-verifiable |
| Leadership, mentoring, team ownership | Resume and project context | Interview/reference-verifiable |

## Strongest Code Review Path

If you want to verify that I know this work deeply, use these files.

1. `projects/jb4pro-mobile-device-tools/lib/providers/ble_provider.dart`
   - Ask how a UI command becomes a device command and how the app handles response parsing, timeouts, retries, and connection loss.

2. `projects/jb4pro-mobile-device-tools/lib/screens/firmware_screen.dart`
   - Ask about bootloader entry, erase/write/checksum flow, partial update failure, and recovery.

3. `projects/turbolamik-awd-controller/firmware/components/awd_core/src/can_rx.c`
   - Ask how raw frames are captured, decoded, validated, and turned into health state.

4. `projects/turbolamik-awd-controller/firmware/components/awd_core/src/derived_metrics.c`
   - Ask what would need to change before moving from shadow-mode logic to production control.

5. `projects/canflex-mobile-app/lib/ble_provider.dart`
   - Ask how BLE telemetry becomes app state and how calibration/settings commands are handled.

6. `projects/stealth-machine-backend/prisma/schema.prisma`
   - Ask how machines, customers, tickets, users, AI config, and training materials relate.

7. `projects/stealth-machine-backend/src/lib/ai.ts`
   - Ask how AI is bounded by context, records, tooling, and escalation.

8. `projects/stealth-batteries-commerce-admin/src/collections`
   - Ask how commerce entities, dealers, affiliates, orders, shipping, and admin operations fit together.

9. `projects/customer-tracking-crm/server.js`
   - Ask where this intentionally favors practical deployment over framework purity.

10. `projects/geo-command-center-platform`
   - Ask about GEO/AI-search visibility workflows, provider pipelines, citations, audits, workers, and reports. This is not geospatial.

## Questions That Verify Ownership

- Walk through one BLE command from button tap to device response.
- What happens if two BLE commands collide?
- What is the ugliest intermittent hardware communication bug you personally debugged?
- How do you know a telemetry value is fresh, stale, malformed, or invalid?
- What would you not trust in the TurboLamik shadow AWD logic if this were going on a real car tomorrow?
- How would you test a firmware update flow without real hardware connected?
- How do you keep AI support from making unsupported warranty or diagnostic claims?
- Where is authorization enforced for admin/customer workflows?
- What schema or API design would you change today and why?
- What code in this repo are you least proud of, and what would you refactor first?
- Which parts were built under deadline pressure, and what tradeoffs did you accept?

## Known Weak Spots

These are real and fair to ask about.

- Public test coverage is uneven.
- Some projects are sanitized snapshots and may not run without private environment details.
- Some older hardware-interface projects show older coding styles.
- Some projects started from templates, then were heavily customized. Check the custom collections, routes, services, hooks, schemas, and workflows before judging them as template-only.
- The public repo was assembled for hiring, so it does not prove the original private development timeline.

## Good Signs To Look For

- Domain-specific code around BLE, CAN, firmware workflows, telemetry, calibration, warranty/support, shipping/admin operations, and machine records.
- Cross-layer ownership: UI, backend, database, device communication, support workflow, and customer/operator experience.
- Practical tradeoffs where deployment constraints or business urgency mattered.
- The ability to explain what should be improved today.

