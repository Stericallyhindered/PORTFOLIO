# Matthew Phillips - Engineering Portfolio

Portfolio: `https://github.com/Stericallyhindered/PORTFOLIO`  
Resume: [`resume/Matthew_Phillips_Resume.pdf`](./resume/Matthew_Phillips_Resume.pdf)  
Resume source: [`resume/Matthew_Phillips_Resume.md`](./resume/Matthew_Phillips_Resume.md)

I build software that has to work around real machines, real customers, and real business mess. That includes full stack web apps, AI support systems, agentic workflows, mobile and desktop apps, cloud APIs, databases, CRM/order platforms, customer portals, admin dashboards, ecommerce systems, industrial machine tools, CAD/CAM workflows, embedded firmware, connected automotive hardware, ECU/TCU tuning platforms, HPLC/mass spec workflows, analytical testing software, and internal tools that keep businesses from drowning in manual work.

Most of my production work lived in private company repos. This public repo is a cleaned-up portfolio snapshot with secrets, customer data, private binaries, firmware images, build outputs, databases, and private infrastructure removed. The point is to show implementation style, architecture, domain depth, and the kind of problems I have owned.

## Start Here

If you are reviewing this for an interview, start with these. They are the strongest proof paths.

| Area | Why it matters | Where to look |
| --- | --- | --- |
| Stealth AI operations | AI support agents, live machine-cut monitoring, learned cut-quality memory, offline/server diagnostics, warranty evidence, CAD/CAM support, ecommerce/order support, internal assistant, RAG, tool calling, RBAC, escalation, and audit trails | [`projects/stealth-ai-operations-ecosystem`](./projects/stealth-ai-operations-ecosystem) |
| JB4Pro vehicle tuning ecosystem | Mobile apps, hardware communication, firmware workflows, telemetry, diagnostics, and tuning UI for real vehicle hardware | [`projects/jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools), [`projects/jb4pro-csharp-interface`](./projects/jb4pro-csharp-interface) |
| CANFlex mobile hardware controller | Flutter app talking to BLE automotive sensor/controller hardware with calibration, logs, CAN output settings, and firmware/version screens | [`projects/canflex-mobile-app`](./projects/canflex-mobile-app) |
| TurboLamik AWD / transmission telemetry | C and ESP-IDF-oriented CAN work, raw frame capture, BMW and TCU decoding, health state, and drivetrain metrics | [`projects/turbolamik-awd-controller`](./projects/turbolamik-awd-controller) |
| Stealth Machine Tools software | Next.js/Prisma backend and Flutter field app for machines, customers, support tickets, training, AI config, and machine support workflows | [`projects/stealth-machine-backend`](./projects/stealth-machine-backend), [`projects/stealth-machine-tools-flutter`](./projects/stealth-machine-tools-flutter) |
| Stealth Batteries commerce/admin | Payload, Next.js, and Postgres operations platform for products, orders, dealers, affiliates, sales reps, shipping, warranty, and admin workflows | [`projects/stealth-batteries-commerce-admin`](./projects/stealth-batteries-commerce-admin) |
| Scientific and analytical software | HPLC, mass spectrometry, ISO lab practices, traceability, validation, reporting, and regulated medical-adjacent workflows from Bayer and MP Analytical | [`resume/Matthew_Phillips_Resume.md`](./resume/Matthew_Phillips_Resume.md) |

## Review Guides

- [`PROOF_OF_WORK.md`](./PROOF_OF_WORK.md) maps big claims to public code and marks what still needs interview verification.
- [`CODE_EXAMPLES.md`](./CODE_EXAMPLES.md) points to specific files worth reviewing.
- [`DEEP_AREAS.md`](./DEEP_AREAS.md) explains where I am deepest so the portfolio does not read like random breadth.
- [`TESTING_AND_VALIDATION.md`](./TESTING_AND_VALIDATION.md) explains how I test, validate, replay, and harden systems around hardware, AI, APIs, and business workflows.
- [`VERIFY_ME_IN_INTERVIEW.md`](./VERIFY_ME_IN_INTERVIEW.md) turns the biggest claims into direct interview probes.
- [`LLM_REVIEW_GUIDE.md`](./LLM_REVIEW_GUIDE.md) keeps AI screeners from inventing details or missing the important parts.
- [`case-studies/index.md`](./case-studies/index.md) gives a cleaner walkthrough of the strongest work.

## What Ties This Together

I am not trying to show twenty random demos. Most of this work follows the same pattern:

```text
physical system, business workflow, or messy customer problem
-> backend model and API
-> mobile, admin, or operator UI
-> diagnostics, logging, support, automation, or recovery
```

That is the work I like most. A vehicle log becomes something a tuner can act on. A tuning device becomes firmware, bootloader behavior, app state, map controls, telemetry, diagnostics, release notes, support history, and recovery paths. A raw CAN frame becomes a decoded signal. A lab instrument output becomes structured analytical data and traceable reporting. A machine problem becomes a support ticket with context. An order becomes shipping, customer visibility, and admin history. An AI answer becomes part of a controlled workflow instead of a random chatbot response.

## Project Map

| Project | What it shows |
| --- | --- |
| [`stealth-ai-operations-ecosystem`](./projects/stealth-ai-operations-ecosystem) | Flagship AI operations case study across Stealth Machine Tools and Stealth Batteries: support agents, live machine-cut monitoring, offline/server diagnostics, warranty evidence, CAD/CAM support, ecommerce/order support, internal assistant, RAG, tool calling, RBAC, escalation, audit trails, and production guardrails |
| [`jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools) | Flutter/Dart mobile app, BLE/device communication, gauges, logs, settings, diagnostics, firmware update hooks, WMI/meth and E85/flex fuel workflows, and automotive tuning hardware UX |
| [`canflex-mobile-app`](./projects/canflex-mobile-app) | BLE-connected fuel/sensor controller app with E85/fuel pressure telemetry, CAN output settings, analog output, calibration, logging, pressure modes, and firmware/version UI |
| [`turbolamik-awd-controller`](./projects/turbolamik-awd-controller) | CAN frame intake, BMW/TurboLamik decoding, raw capture, health/watchdog state, derived drivetrain metrics, shadow AWD logic, BLE telemetry, and Flutter dashboard |
| [`stealth-machine-backend`](./projects/stealth-machine-backend) | Next.js/Prisma backend for users, machines, tickets, AI config, training materials, auth, admin dashboards, analytics, and support workflows |
| [`stealth-machine-tools-flutter`](./projects/stealth-machine-tools-flutter) | Cross-platform Flutter field/support app with API integration, local storage, auth helpers, camera/speech/PDF/QR/chart support |
| [`stealth-batteries-commerce-admin`](./projects/stealth-batteries-commerce-admin) | Payload/Next/Postgres operations platform for products, orders, dealers, affiliates, sales reps, shipping, warranty, support, dashboards, and admin workflows |
| [`techsupport-ai-backend`](./projects/techsupport-ai-backend) | Claude-backed support backend with auth, persistence, tickets, machine/customer records, document/context ingestion, notifications, analytics, and support workflow routes |
| [`stealth-ai-support-system`](./projects/stealth-ai-support-system) | Customer/internal support prototype with chat, conversation history, ticketing, escalation, analytics, warranty/claims handling, onboarding, and human handoff paths |
| [`customer-tracking-crm`](./projects/customer-tracking-crm) | CRM/order workflow app with companies, contacts, orders, approvals, customer portal, document/OCR-style processing, realtime updates, role-aware workflows, and audit trails |
| [`geo-command-center-platform`](./projects/geo-command-center-platform) | GEO/AI-search visibility platform, not geospatial: Next.js, FastAPI, Supabase/Postgres/Drizzle, workers, providers, reports, citation tracking, audits, tests, and dashboards |
| [`geo-command-center`](./projects/geo-command-center) | Smaller AI/search visibility command center with multi-tenant structure, provider adapters, prompt/report pipelines, audits, citation tracking, and dashboards |
| [`str8tune-binforge-calibration-editor`](./projects/str8tune-binforge-calibration-editor) | Next.js/TypeScript ECU/BIN calibration editor shell, Supabase assets, and tuning-oriented app/components/lib structure |
| [`str8tune-ecu-calibration-editor`](./projects/str8tune-ecu-calibration-editor) | ECU calibration tooling with React/TypeScript, XDF/BIN concepts, editable maps, hex/table views, comparison tools, visualization, and export-style workflows |
| [`t56-ble-transmission-controller`](./projects/t56-ble-transmission-controller) | BLE transmission/controller project with PlatformIO firmware, Flutter app logic, protocol docs, mapping schema, presets, PWM capture/output, and gear/control logic |
| [`awd-transfer-case-tuner`](./projects/awd-transfer-case-tuner) | Flutter AWD/transfer-case tuning app with realtime pages, diagnostics, configuration, drive rules, torque/slip logic, PWM commands, profiles, maps, and BLE sync paths |
| [`growcontrol-climate-automation-platform`](./projects/growcontrol-climate-automation-platform) | Flutter, firmware, and Supabase automation with climate math, telemetry, rules, gateways, Tuya integration, and migrations |
| [`growmie-edge-hub-firmware`](./projects/growmie-edge-hub-firmware) | Edge hub firmware for climate/device automation, provisioning, config storage, buffering, local Tuya control, and backend sync |
| [`laserconsumables-commerce`](./projects/laserconsumables-commerce) | Industrial commerce/admin system with inventory services, manual order flows, shipping dashboards, and admin workflow components |
| [`straincollector-commerce`](./projects/straincollector-commerce) | Specialty commerce/order workflow with Next.js/Supabase plus checkout, webhook, shipping label, and tracking flows |
| [`bassclown-ecommerce`](./projects/bassclown-ecommerce) | Client ecommerce build with Next.js, Drizzle, migrations, reusable components, admin/customer workflows, and API docs |
| [`ampgen-configurator`](./projects/ampgen-configurator) | Next.js/React configurator for power/electrical product planning with draggable layout zones |
| [`hotspot-control-api`](./projects/hotspot-control-api) | Python/PowerShell Windows/network automation around local hotspot/control workflows |
| [`esp32-mouse-controller`](./projects/esp32-mouse-controller) | ESP32 USB HID mouse firmware plus Python GUI/control scripts for physical device testing |
| [`vehicle-touch-input-controller`](./projects/vehicle-touch-input-controller) | Arduino/CST816S hardware input controller and compact embedded control code |

## What Is Publicly Proven Here

- Source snapshots across full stack, mobile, AI, embedded, CAN/BLE, ecommerce, CRM, and machine-support projects.
- Real project structure, implementation files, domain notes, schemas, scripts, and representative code.
- Enough public code for a reviewer to ask deep technical questions quickly.

## What Should Be Verified In Interview

- Private production scale, company tenure, team leadership scope, deployment history, customer/user counts, and business impact.
- Private infrastructure, production logs, app store history, proprietary repos, private firmware, and company references.

I am not asking a reviewer to trust huge claims from a README alone. I am trying to make the proof path clear so a technical interview can go straight into the real work.

## Technical Range

**Frontend:** React, Next.js, TypeScript, JavaScript, HTML/CSS, Tailwind-style UI, Radix/shadcn-style components, dashboards, customer portals, admin panels, configuration interfaces, charts/gauges, table/map editors, 2D/3D visualization concepts.

**Backend:** Node.js, Express, FastAPI, REST APIs, WebSockets, JWT, OAuth concepts, role permissions, audit logging, provider adapters, webhooks, background jobs, notification workflows.

**Databases:** Postgres, SQLite, MongoDB/Mongoose, Supabase, Drizzle, Prisma, Redis/BullMQ-style queues, Payload CMS, data modeling, migrations, reporting tables, CRM/order state, support history, and audit trails.

**AI:** Claude/Anthropic, OpenAI-style APIs, AI support agents, prompt/context workflows, local LLM workflows, Codex/Cursor-style coding flows, codebase indexing, document ingestion, OCR/document processing, ticket triage, warranty/claims workflows, analytics, escalation, and human handoff.

**Scientific / Analytical:** MP Analytical, Bayer internship-to-role experience, HPLC, mass spectrometry, analytical testing equipment, embedded firmware for lab systems, ISO lab standards, regulated medical-adjacent workflows, scientific data handling, method/run context, validation checks, reporting support, data integrity, traceable records, strict protocol navigation, regulated documentation, exception review, and lab-process automation.

**Vehicle / Tuning / Embedded:** ECU/TCU tuning workflows, JB4, CANFlex, standalone ECU/TCU-adjacent controllers, GDI drivers, fuel injector controllers, C, C++, ESP-IDF-oriented scaffolding, CAN bus, OBD2, UDS-style diagnostics, BLE/serial communication, BMW E90 signal decoding, TurboLamik TCU frame decoding, MaxxECU CAN output docs, raw CAN capture, health/watchdog state, derived metrics, calibration interfaces, map control, firmware update flows, bootloader/erase/write/checksum patterns, and production tuning support.

**Mobile / Hardware:** Flutter, Dart, iOS, Android, Windows, macOS, Android concepts, BLE/device communication, serial-style communication, diagnostics, firmware update flows, gauges, datalogging, settings/configuration UI, tuner/customer interfaces, and app-to-device control.

**Desktop / Automation:** C#, WinForms, Python, PowerShell, Windows/server-oriented scripting, local APIs, serial port monitoring, Bluetooth/BLE support libraries, Docker Compose, Git/GitHub/GitLab, deployment notes, and technical documentation.

## How I Work

I am careful with existing systems. I like scoped changes, readable code, useful comments, plain-language notes, and documentation that helps the next person. I use AI tools heavily, but I review the output like an engineer who owns the result. My default move is to understand the workflow, find the real constraint, build the simplest thing that can survive production, and leave the system easier to work on than I found it.

## Known Weak Spots

These are fair interview topics.

- This is a portfolio snapshot, not the original private production history.
- Some projects are sanitized and will not include private environment files, firmware images, credentials, customer data, or production infrastructure.
- Public test coverage is uneven. I can talk through how I would add fixtures, mocks, integration tests, hardware simulators, and regression coverage.
- Some older projects show older patterns because they are included as historical hardware-interface examples.
- Some projects started from templates, then were heavily customized. Check the custom collections, routes, services, hooks, schemas, and workflows before judging them as template-only.
- A few projects were built under deadline pressure. I can explain the tradeoffs and what I would refactor today.

Contact: `bajaracer415@gmail.com`
