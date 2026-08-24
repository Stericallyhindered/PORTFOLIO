# Matthew Phillips - Software Portfolio

Portfolio: `https://github.com/Stericallyhindered/PORTFOLIO`  
Resume: [`resume/Matthew_Phillips_Resume.pdf`](./resume/Matthew_Phillips_Resume.pdf)

I build software that has to work around real machines, real customers, and real business mess. That includes full stack web apps, mobile apps, backend services, databases, AI support workflows, embedded and firmware-adjacent code, CAN and BLE telemetry, diagnostics, ecommerce, customer portals, admin tools, and industrial machine software.

Most of my production work lived in private company repos. This public repo is a cleaned-up portfolio snapshot with secrets, customer data, private binaries, firmware images, build outputs, databases, and private infrastructure removed. The point is to show implementation style, architecture, domain depth, and the kind of problems I have owned.

## Start Here

If you are reviewing this for an interview, start with these. They are the strongest proof paths.

| Area | Why it matters | Where to look |
| --- | --- | --- |
| JB4Pro vehicle tuning ecosystem | Mobile apps, hardware communication, firmware workflows, telemetry, diagnostics, and tuning UI for real vehicle hardware | [`projects/jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools), [`projects/jb4pro-csharp-interface`](./projects/jb4pro-csharp-interface) |
| CANFlex mobile hardware controller | Flutter app talking to BLE automotive sensor/controller hardware with calibration, logs, CAN output settings, and firmware/version screens | [`projects/canflex-mobile-app`](./projects/canflex-mobile-app) |
| TurboLamik AWD / transmission telemetry | C and ESP-IDF-oriented CAN work, raw frame capture, BMW and TCU decoding, health state, and drivetrain metrics | [`projects/turbolamik-awd-controller`](./projects/turbolamik-awd-controller) |
| Stealth Machine Tools software | Next.js/Prisma backend and Flutter field app for machines, customers, support tickets, training, AI config, and machine support workflows | [`projects/stealth-machine-backend`](./projects/stealth-machine-backend), [`projects/stealth-machine-tools-flutter`](./projects/stealth-machine-tools-flutter) |
| Stealth Batteries commerce/admin | Payload, Next.js, and Postgres operations platform for products, orders, dealers, affiliates, sales reps, shipping, warranty, and admin workflows | [`projects/stealth-batteries-commerce-admin`](./projects/stealth-batteries-commerce-admin) |
| AI support systems | AI wrapped inside normal software: tickets, records, documents, permissions, escalation, audit trails, and human review | [`projects/techsupport-ai-backend`](./projects/techsupport-ai-backend), [`projects/stealth-ai-support-system`](./projects/stealth-ai-support-system) |

## Review Guides

- [`PROOF_OF_WORK.md`](./PROOF_OF_WORK.md) maps big claims to public code and marks what still needs interview verification.
- [`CODE_EXAMPLES.md`](./CODE_EXAMPLES.md) points to specific files worth reviewing.
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

That is the work I like most. A vehicle log becomes something a tuner can act on. A raw CAN frame becomes a decoded signal. A machine problem becomes a support ticket with context. An order becomes shipping, customer visibility, and admin history. An AI answer becomes part of a controlled workflow instead of a random chatbot response.

## Main Project Map

| Project | What it shows |
| --- | --- |
| [`jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools) | Flutter/Dart mobile app, BLE/device communication, gauges, logs, settings, diagnostics, firmware workflow hooks, and automotive tuning hardware UX |
| [`canflex-mobile-app`](./projects/canflex-mobile-app) | BLE-connected fuel/sensor controller app with E85/fuel pressure telemetry, CAN output settings, calibration, logging, and firmware/version UI |
| [`turbolamik-awd-controller`](./projects/turbolamik-awd-controller) | CAN frame intake, BMW/TurboLamik decoding, raw capture, health/watchdog state, derived drivetrain metrics, and Flutter telemetry dashboard |
| [`stealth-machine-backend`](./projects/stealth-machine-backend) | Next.js/Prisma backend for users, machines, tickets, AI config, training materials, auth, admin dashboards, and support workflows |
| [`stealth-machine-tools-flutter`](./projects/stealth-machine-tools-flutter) | Cross-platform Flutter field/support app with API integration, local storage, auth helpers, camera/speech/PDF/QR/chart support |
| [`stealth-batteries-commerce-admin`](./projects/stealth-batteries-commerce-admin) | Payload/Next/Postgres operations platform for products, orders, dealers, affiliates, sales reps, shipping, warranty, and support |
| [`techsupport-ai-backend`](./projects/techsupport-ai-backend) | Claude-backed support backend with tickets, machine/customer records, document ingestion, notifications, and analytics |
| [`stealth-ai-support-system`](./projects/stealth-ai-support-system) | Customer/internal support prototype with chat, conversation history, ticketing, escalation, analytics, and human handoff paths |
| [`customer-tracking-crm`](./projects/customer-tracking-crm) | CRM/order workflow app with companies, contacts, orders, approvals, customer portal, document/OCR-style processing, realtime updates, and audit trails |
| [`geo-command-center-platform`](./projects/geo-command-center-platform) | GEO/AI-search visibility platform, not geospatial: Next.js, FastAPI, Supabase/Postgres/Drizzle, providers, reports, citation tracking, dashboards |
| [`str8tune-binforge-calibration-editor`](./projects/str8tune-binforge-calibration-editor) | Next.js/TypeScript ECU/BIN calibration editor shell, Supabase assets, and tuning-oriented app/components/lib structure |
| [`str8tune-ecu-calibration-editor`](./projects/str8tune-ecu-calibration-editor) | ECU calibration tooling with React/TypeScript, XDF/BIN concepts, editable maps, hex/table views, visualization, and export-style workflows |
| [`t56-ble-transmission-controller`](./projects/t56-ble-transmission-controller) | BLE transmission/controller project with firmware, Flutter app logic, protocol docs, mapping schema, presets, and PWM capture/output |
| [`growcontrol-climate-automation-platform`](./projects/growcontrol-climate-automation-platform) | Flutter, firmware, and Supabase automation with climate math, telemetry, rules, gateways, Tuya integration, and migrations |
| [`growmie-edge-hub-firmware`](./projects/growmie-edge-hub-firmware) | Edge hub firmware for climate/device automation, provisioning, config storage, buffering, local Tuya control, and backend sync |
| [`laserconsumables-commerce`](./projects/laserconsumables-commerce) | Industrial commerce/admin system with inventory services, manual order flows, shipping dashboards, and admin workflow components |
| [`straincollector-commerce`](./projects/straincollector-commerce) | Specialty commerce/order workflow with Next.js/Supabase plus checkout, webhook, shipping label, and tracking flows |
| [`bassclown-ecommerce`](./projects/bassclown-ecommerce) | Client ecommerce build with Next.js, Drizzle, migrations, reusable components, admin/customer workflows, and API docs |
| [`ampgen-configurator`](./projects/ampgen-configurator) | Next.js/React configurator for power/electrical product planning with draggable layout zones |
| [`hotspot-control-api`](./projects/hotspot-control-api) | Python/PowerShell Windows/network automation around local hotspot/control workflows |
| [`esp32-mouse-controller`](./projects/esp32-mouse-controller) | ESP32 USB HID mouse firmware plus Python GUI/control scripts for physical device testing |
| [`vehicle-touch-input-controller`](./projects/vehicle-touch-input-controller) | Arduino/CST816S hardware input controller and compact embedded control code |
| [`awd-transfer-case-tuner`](./projects/awd-transfer-case-tuner) | Flutter vehicle AWD/transfer-case tuning app snapshot for drivetrain configuration workflows |

## What Is Publicly Proven Here

- Source snapshots across full stack, mobile, AI, embedded, CAN/BLE, ecommerce, CRM, and machine-support projects.
- Real project structure, implementation files, domain notes, schemas, scripts, and representative code.
- Enough public code for a reviewer to ask deep technical questions quickly.

## What Should Be Verified In Interview

- Private production scale, company tenure, team leadership scope, deployment history, customer/user counts, and business impact.
- Private infrastructure, production logs, app store history, proprietary repos, private firmware, and company references.

I am not asking a reviewer to trust huge claims from a README alone. I am trying to make the proof path clear so a technical interview can go straight into the real work.

## Technical Range

React, Next.js, TypeScript, Node.js, Express, Python, FastAPI, Flutter/Dart, C/C++, C#, Java, Rust, SQL, PostgreSQL, Supabase, Drizzle, SQLite, MongoDB/Mongoose, Prisma, Payload CMS, REST APIs, GraphQL-style API work, WebSockets, auth/JWT/cookies/RBAC, Stripe/webhooks, shipping/order flows, ecommerce, admin portals, dashboards, Claude/Anthropic, OpenAI-style APIs, local LLM workflows, RAG/context ingestion, AI support agents, tool-calling workflows, prompt engineering, Docker, GitHub/GitLab workflows, CI/CD, Linux, PowerShell, BLE, CAN bus, OBD-II/UDS-style diagnostics, UART/SPI/I2C, ESP32/PlatformIO/Arduino, firmware update flows, bootloaders, telemetry, datalogging, calibration tools, ECU/TCU workflows, CAD/CAM support software, laser/plasma/CNC tooling, and machine diagnostics.

## Known Weak Spots

These are fair interview topics.

- This is a portfolio snapshot, not the original private production history.
- Some projects are sanitized and will not include private environment files, firmware images, credentials, customer data, or production infrastructure.
- Public test coverage is uneven. I can talk through how I would add fixtures, mocks, integration tests, hardware simulators, and regression coverage.
- Some older projects show older patterns because they are included as historical hardware-interface examples.
- A few projects were built under deadline pressure. I can explain the tradeoffs and what I would refactor today.

Contact: `bajaracer415@gmail.com`
