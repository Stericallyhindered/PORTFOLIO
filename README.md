# Matthew Phillips

Software engineer and technical lead building business applications, mobile and desktop software, and systems connected to industrial and automotive hardware.

[Resume](./resume/Matthew_Phillips_Resume.pdf) · [Experience](./resume/Matthew_Phillips_Resume.md) · [Projects](./projects) · [Code examples](./CODE_EXAMPLES.md)

## Experience

**Stealth Machine Tools / Stealth Batteries | Technical Lead | 2025–present**

Lead and mentor three developers. Build customer and warranty applications, machine support tools, commerce systems, mobile apps, and internal automation. Work with production, sales, support, shipping, and engineering on requirements, releases, and ongoing support.

**Burger Motorsports | Lead Developer | 2019–2025**

Led five developers across the JB4 software ecosystem. Built mobile and desktop applications, device communications, firmware update tools, telemetry, and customer support systems. Work included Oracle APEX operational applications and C# desktop interfaces.

**MP Analytical / Bayer**

Scientific software and analytical laboratory work involving HPLC, mass spectrometry, instrument integration, validation, and traceable reporting.

## Selected projects

### JB4Pro

Vehicle tuning applications with live telemetry, data logging, device settings, diagnostics, and firmware updates. Mobile applications use Flutter and BLE; the Windows interface uses C# and WinForms. Related business systems included Oracle APEX customer and support records.

[Mobile application](./projects/jb4pro-mobile-device-tools) · [C# desktop interface](./projects/jb4pro-csharp-interface)

### Stealth Machine Tools

Machine and customer records, service tickets, training materials, diagnostics, and field support. Includes a Next.js/Prisma backend, a Flutter field application, and AI-assisted support tools. Oracle APEX applications supported customer, warranty, and operational records across the business.

[Backend](./projects/stealth-machine-backend) · [Field application](./projects/stealth-machine-tools-flutter) · [Support systems](./projects/stealth-ai-operations-ecosystem)

### Stealth Batteries

Commerce and administration software for products, orders, dealers, affiliates, shipping, and warranty support. Built with Next.js, Payload CMS, and PostgreSQL.

[Project](./projects/stealth-batteries-commerce-admin)

### Customer Tracking CRM

Customer and order management with approvals, a customer portal, document intake, notifications, and audit history.

[Project](./projects/customer-tracking-crm)

### Redline GCAL

.NET 8 WPF calibration workspace for BMW G-chassis vehicles. Includes BIN editing, XDF parsing, calibration maps, log review, revision tracking, and diagnostic workflow tools.

[Project](./projects/redline-gcal-bmw-g-chassis-calibration-studio)

### CANFlex

Mobile application for automotive fuel and sensor hardware. Includes BLE communications, live sensor readings, calibration, CAN configuration, and device settings.

[Project](./projects/canflex-mobile-app)

### TurboLamik Telemetry

CAN data capture and decoding for vehicle and transmission telemetry, with signal health checks, drivetrain metrics, and a Flutter dashboard.

[Project](./projects/turbolamik-awd-controller)

### Additional work

[Calibration editors](./projects/str8tune-ecu-calibration-editor) · [Climate automation](./projects/growcontrol-climate-automation-platform) · [AI search analytics](./projects/geo-command-center-platform) · [Industrial commerce](./projects/laserconsumables-commerce) · [All projects](./projects)

## Scope of work

- Lead and mentor developers, review architecture and code, define requirements, and coordinate releases with business and engineering teams.
- Build customer portals, administrative applications, order and warranty systems, reporting, and integrations between operational tools.
- Maintain production applications through troubleshooting, release validation, monitoring, documentation, and support.
- Develop mobile and desktop interfaces, firmware update tools, and diagnostic software for automotive and industrial equipment.
- Connect analytical instruments and laboratory workflows with data handling, validation, and reporting software.

## Oracle applications

At Burger Motorsports and Stealth, Oracle APEX applications supported customer records, warranty claims, support history, and operational automation. This work connected business records with customer-facing applications, internal tools, and support processes.

## Project directory

| Project | What it shows |
| --- | --- |
| [`stealth-ai-operations-ecosystem`](./projects/stealth-ai-operations-ecosystem) | Flagship AI operations case study across Stealth Machine Tools and Stealth Batteries: support agents, live machine-cut monitoring, offline/server diagnostics, warranty evidence, CAD/CAM support, ecommerce/order support, internal assistant, RAG, tool calling, RBAC, escalation, audit trails, and production guardrails |
| [`jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools) | Flutter/Dart mobile app, BLE/device communication, gauges, logs, settings, diagnostics, firmware update hooks, WMI/meth and E85/flex fuel workflows, and automotive tuning hardware UX |
| [`redline-gcal-bmw-g-chassis-calibration-studio`](./projects/redline-gcal-bmw-g-chassis-calibration-studio) | .NET 8 WPF BMW G-chassis/B58/S58 calibration studio with DME BIN document safety, XDF parsing, map editing, MHD log parsing, profile persistence, ENET/HSFZ/UDS-oriented diagnostics, flash workflow modeling, and tests |
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

## Technical experience

**Frontend:** React, Next.js, TypeScript, JavaScript, HTML/CSS, Tailwind-style UI, Radix/shadcn-style components, dashboards, customer portals, admin panels, configuration interfaces, charts/gauges, table/map editors, 2D/3D visualization concepts.

**Backend:** Node.js, Express, FastAPI, REST APIs, WebSockets, JWT, OAuth concepts, role permissions, audit logging, provider adapters, webhooks, background jobs, notification workflows.

**Databases:** Postgres, SQLite, MongoDB/Mongoose, Supabase, Drizzle, Prisma, Redis/BullMQ-style queues, Payload CMS, data modeling, migrations, reporting tables, CRM/order state, support history, and audit trails.

**AI:** Claude/Anthropic, OpenAI-style APIs, AI support agents, prompt/context workflows, local LLM workflows, Codex/Cursor-style coding flows, codebase indexing, document ingestion, OCR/document processing, ticket triage, warranty/claims workflows, analytics, escalation, and human handoff.

**Scientific / Analytical:** MP Analytical, Bayer internship-to-role experience, HPLC, mass spectrometry, analytical testing equipment, embedded firmware for lab systems, ISO lab standards, regulated medical-adjacent workflows, scientific data handling, method/run context, validation checks, reporting support, data integrity, traceable records, strict protocol navigation, regulated documentation, exception review, and lab-process automation.

**Vehicle / Tuning / Embedded:** ECU/TCU tuning workflows, BMW G-chassis/B58/S58 DME calibration, XDF/BIN parsing, map editing, flash workflow modeling, JB4, CANFlex, standalone ECU/TCU-adjacent controllers, GDI drivers, fuel injector controllers, C, C++, ESP-IDF-oriented scaffolding, CAN bus, OBD2, UDS-style diagnostics, ENET/HSFZ concepts, BLE/serial communication, BMW E90 signal decoding, TurboLamik TCU frame decoding, MaxxECU CAN output docs, raw CAN capture, health/watchdog state, derived metrics, calibration interfaces, map control, firmware update flows, bootloader/erase/write/checksum patterns, and production tuning support.

**Mobile / Hardware:** Flutter, Dart, iOS, Android, Windows, macOS, Android concepts, BLE/device communication, serial-style communication, diagnostics, firmware update flows, gauges, datalogging, settings/configuration UI, tuner/customer interfaces, and app-to-device control.

**Desktop / Automation:** C#, WinForms, Python, PowerShell, Windows/server-oriented scripting, local APIs, serial port monitoring, Bluetooth/BLE support libraries, Docker Compose, Git/GitHub/GitLab, deployment notes, and technical documentation.

Selected source and documentation are included here. Customer data, credentials, proprietary binaries, and private production infrastructure are excluded.

## Contact

[bajaracer415@gmail.com](mailto:bajaracer415@gmail.com)