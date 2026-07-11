# Matthew Phillips - Code Portfolio

I'm a Southern California vehicle-software and full-stack product engineer who likes building software that touches the real world: vehicle hardware, CAN bus telemetry, BLE devices, firmware update workflows, logs, diagnostics, customer support tools, admin dashboards, API integrations, AI-assisted workflows, and the behind-the-scenes systems that keep a business from drowning in manual work.

Most of my work has been in places where the software has to understand both the machine and the user: vehicles, hardware, customer orders, warranty claims, support tickets, inventory, shipping, firmware, raw logs, diagnostics, and business operations. I care a lot about clean changes, readable code, safety-first validation, and not breaking parts of a system that were already working.

This repo is not every project I have ever written. It is a cleaned-up set of source snapshots that show the work most relevant to full-stack product engineering, frontend/backend application work, databases, API design, AI integrations, workflow automation, vehicle/embedded software, and hardware-connected mobile development.

## Current Resume

- [Matthew Phillips resume](./resume/Matthew_Phillips_Resume.pdf)

## The Short Version

- I build full-stack production software: Next.js/React frontends, Node/FastAPI backends, REST APIs, Postgres/Supabase/SQLite/Mongo data models, dashboards, admin tools, background workflows, AI integrations, and hardware-connected apps.
- I have real experience with Node, Express, React, Next.js, TypeScript, Python, Flutter/Dart, SQL, Postgres, SQLite, MongoDB, Supabase, and API integrations.
- I have vehicle/embedded experience around CAN bus, BLE device communication, firmware update workflows, ECU/tuning workflows, telemetry parsing, logs, diagnostics, raw frame capture, and validation-first hardware integration.
- I have built AI support systems using Claude/Anthropic-style workflows, including chat, ticketing, warranty/claims handling, document/context ingestion, and escalation paths.
- I have built automotive/mobile hardware software around JB4Pro, CANFlex, TurboLamik, BLE/device communication, CAN bus/CAN-system workflows, logs, gauges, diagnostics, settings, and firmware-related flows.
- I am comfortable taking an unclear business problem, asking the right questions, and turning it into something shipped.

## Start Here

If you are reviewing this for an interview, these are the projects I would start with:

1. [`turbolamik-awd-controller`](./projects/turbolamik-awd-controller)  
   Vehicle/embedded integration project: ESP-IDF-oriented C scaffold, BMW E90 CAN signal decoding, TurboLamik TCU frame decoding, raw CAN capture, health/watchdog state, derived drivetrain metrics, shadow AWD logic, BLE telemetry, and Flutter dashboard.

2. [`jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools)  
   Final JB4Pro mobile/hardware work: Flutter app, vehicle data, BLE/device communication, gauges, logs, settings, mapping, diagnostics, and firmware update workflows.

3. [`canflex-mobile-app`](./projects/canflex-mobile-app)  
   Current CANFlex/NewCANFlex mobile hardware project with BLE/device communication, firmware screens, E85/fuel telemetry, CANbus output settings, pressure/calibration settings, logging, and automotive support tooling.

4. [`techsupport-ai-backend`](./projects/techsupport-ai-backend)  
   Backend AI support system: Claude integration, auth, tickets, document ingestion, notifications, analytics, and support workflows.

5. [`stealth-batteries-commerce-admin`](./projects/stealth-batteries-commerce-admin)  
   Full-stack commerce/admin platform: products, dealers, affiliates, orders, warranty/support flows, dashboards, and operational tooling.

6. [`customer-tracking-crm`](./projects/customer-tracking-crm)  
   CRM/order workflow system: admin approvals, customer portal, documents/OCR, real-time updates, email/SMS-style notifications, and audit trails.

7. [`stealth-machine-backend`](./projects/stealth-machine-backend) and [`stealth-machine-tools-flutter`](./projects/stealth-machine-tools-flutter)  
   Stealth Machine Tools support ecosystem: Next.js/Prisma backend, AI support workflows, admin tooling, and a Flutter field/support app.

8. [`geo-command-center-platform`](./projects/geo-command-center-platform)  
   Full-stack GEO SaaS/product system: Next.js frontend, FastAPI backend, REST/API routes, Supabase/Postgres/Drizzle database modeling, worker/background jobs, AI provider integrations, citation tracking, reporting, analytics dashboards, and tests.

## Projects

| Project | What it shows |
| --- | --- |
| [`techsupport-ai-backend`](./projects/techsupport-ai-backend) | The backend for an AI support system: Claude integration, machine/customer records, tickets, auth, document ingestion, analytics, and the plumbing that turns chat into a real support workflow instead of a toy bot. |
| [`stealth-ai-support-system`](./projects/stealth-ai-support-system) | A Stealth Batteries support prototype built to take pressure off manual inbox work: customer chat, admin review, conversation history, escalation, tickets, and support analytics. |
| [`stealth-batteries-commerce-admin`](./projects/stealth-batteries-commerce-admin) | A serious full-stack operations platform: commerce, products, dealers, affiliates, sales reps, orders, shipping logic, support/warranty flows, dashboards, and Payload/Postgres admin tooling. |
| [`customer-tracking-crm`](./projects/customer-tracking-crm) | CRM/order ops software for the messy middle of a business: customers, companies, contacts, admin approvals, customer portal views, uploaded docs, OCR-style flows, audit trails, realtime updates, and notifications. |
| [`geo-command-center`](./projects/geo-command-center) | AI/search visibility command center with multi-tenant structure, prompt/report pipelines, provider adapters, audits, citation tracking, background-worker style flows, and dashboards built for decision making. |
| [`geo-command-center-platform`](./projects/geo-command-center-platform) | Larger full-stack GEO platform snapshot: Next.js frontend, app/API routes, Supabase/Postgres/Drizzle database modeling, FastAPI backend services, worker/background pipelines, AI provider integrations, tests, report workflows, citation tracking, and analytics dashboards. |
| [`turbolamik-awd-controller`](./projects/turbolamik-awd-controller) | Vehicle/embedded integration: ESP-IDF-oriented C scaffold, BMW E90 CAN signal decoding, TurboLamik TCU frames, raw CAN capture, health/watchdog state, derived drivetrain metrics, shadow AWD request logic, BLE telemetry, and Flutter dashboard. |
| [`jb4pro-mobile-device-tools`](./projects/jb4pro-mobile-device-tools) | Final JB4Pro mobile app source: Flutter, BLE/device communication, gauges, logs, vehicle diagnostics, mapping/protocol notes, firmware update flows, WMI lookup, settings, and customer-facing tuning hardware workflows. |
| [`canflex-mobile-app`](./projects/canflex-mobile-app) | Current CANFlex/NewCANFlex hardware app work: Flutter/Dart, BLE communication, firmware screens, E85/fuel telemetry, CANbus output settings, pressure/calibration settings, logs, gauges, and the mobile side of automotive hardware support. |
| [`t56-ble-transmission-controller`](./projects/t56-ble-transmission-controller) | BLE transmission/controller project with PlatformIO firmware, Flutter app logic, BLE protocol docs, mapping schema, presets, PWM capture/output, and gear/control logic. |
| [`awd-transfer-case-tuner`](./projects/awd-transfer-case-tuner) | Flutter vehicle AWD/transfer-case tuning app snapshot focused on mobile configuration and drivetrain-control workflows. |
| [`growcontrol-climate-automation-platform`](./projects/growcontrol-climate-automation-platform) | Flutter + firmware + Supabase grow room automation system with climate math, telemetry, scene rules, device gateways, local Tuya integration, firmware, and migrations. |
| [`growmie-edge-hub-firmware`](./projects/growmie-edge-hub-firmware) | Arduino/ESP-style edge hub firmware for climate/device automation, provisioning, config storage, buffering, local Tuya control, and Supabase sync. |
| [`vehicle-touch-input-controller`](./projects/vehicle-touch-input-controller) | Arduino/CST816S touch-input controller showing hardware input handling, driver integration, and compact embedded UI/control code. |
| [`str8tune-binforge-calibration-editor`](./projects/str8tune-binforge-calibration-editor) | Next.js/TypeScript ECU/BIN calibration editor shell with tuning-oriented UI structure, Supabase project assets, app/components/lib organization, and domain-specific product flow. |
| [`str8tune-ecu-calibration-editor`](./projects/str8tune-ecu-calibration-editor) | ECU calibration tooling with React/TypeScript, XDF/BIN parsing concepts, editable maps, hex/table views, tuning assistant flows, 2D/3D visualization, and export-style calibration workflows. |
| [`ampgen-configurator`](./projects/ampgen-configurator) | A clean Next.js/React configurator for power/electrical product planning, with draggable layout zones and UI logic for turning a physical product setup into an interactive tool. |
| [`hotspot-control-api`](./projects/hotspot-control-api) | Small but useful Windows/network automation: Python plus PowerShell control around local hotspot workflows, showing the kind of practical scripting that keeps ops moving. |
| [`stealth-machine-backend`](./projects/stealth-machine-backend) | Next.js/TypeScript/Prisma backend for Stealth Machine Tools operations: auth, customers, machines, tickets, training/support materials, AI config, analytics, and admin workflows. |
| [`stealth-machine-tools-flutter`](./projects/stealth-machine-tools-flutter) | Cross-platform Flutter app for machine support/training workflows with API integration, local storage, auth helpers, camera/speech/PDF support, QR, charts, and field-service style UX. |
| [`esp32-mouse-controller`](./projects/esp32-mouse-controller) | Compact embedded + desktop project: ESP32 USB HID mouse firmware, test sketch, and Python GUI/control scripts for configuring and testing a physical device. |
| [`laserconsumables-commerce`](./projects/laserconsumables-commerce) | Industrial commerce/admin system: Next.js, TypeScript, Prisma, inventory services, manual order flows, shipping dashboards, and admin workflow components. |
| [`straincollector-commerce`](./projects/straincollector-commerce) | Specialty commerce/order workflow project: Next.js/Supabase structure plus PHP checkout, webhook, shipping-label, and tracking workflows. |
| [`bassclown-ecommerce`](./projects/bassclown-ecommerce) | Polished client ecommerce build with Next.js, Drizzle, migrations, reusable components, admin/customer workflows, API docs, and handoff documentation. |
| [`jb4pro-csharp-interface`](./projects/jb4pro-csharp-interface) | Legacy C# WinForms JB4Pro interface showing desktop-era hardware communication, serial port monitoring, Bluetooth/BLE support code, and tuning-tool UI structure. |

## Interview Walkthrough

If you only have ten minutes, I would walk through these in this order:

1. **TurboLamik AWD Controller** - shows C/firmware-adjacent vehicle integration, CAN decoding, raw frame capture, health state, derived metrics, and safe shadow-mode control thinking.
2. **JB4Pro** - shows mobile + hardware + vehicle systems, firmware update workflows, BLE, diagnostics, tuning settings, and logs.
3. **CANFlex** - shows BLE-connected fuel/sensor hardware, E85/fuel telemetry, CANbus output settings, calibration, and firmware/version handling.
4. **Tech Support AI Backend** - shows Claude/API integration wrapped in real backend workflows.
5. **GEO Command Center Platform** - shows a major AI/search visibility product: multi-tenant data model, provider pipelines, citations, reports, workers, backend services, and dashboards.
6. **Stealth Batteries Admin** - shows full-stack business operations: orders, dealers, shipping, warranty, dashboards.
7. **Stealth Machine Tools** - shows AI support workflows, Flutter field-service UX, machine/customer records, and admin tooling.

## What These Projects Have In Common

I like building the "connective tissue" of a business. That usually means taking messy inputs and turning them into a clean workflow:

- A customer message becomes a support ticket, warranty flow, or onboarding step.
- A vehicle log becomes something a tuner or support person can actually act on.
- A raw CAN frame becomes a decoded signal, health state, derived metric, or validation note.
- An order becomes approvals, customer status, shipping actions, admin visibility, and support history.
- A hardware device becomes a mobile interface with settings, logs, gauges, and diagnostics.
- An AI response becomes part of a controlled system instead of a random chatbot answer.

That is the work I am best at. I do not need a perfect spec to start. I need the problem, the constraints, and access to the people using the thing.

## Technical Range

**Frontend:** React, Next.js, TypeScript, JavaScript, HTML/CSS, Tailwind-style UI, Radix UI, Fabric.js  
**Backend:** Node.js, Express, FastAPI, REST APIs, auth, webhooks, background jobs, notifications  
**Databases:** Postgres, Supabase, Drizzle, SQLite, MongoDB/Mongoose, SQL workflow/data modeling  
**AI:** Claude/Anthropic API work, support automation, prompt behavior tuning, document/context ingestion, AI-assisted development  
**Vehicle/Embedded:** C, ESP-IDF-oriented firmware scaffolding, CAN bus, CAN-system workflows, BMW E90 signal decoding, TurboLamik TCU frame decoding, MaxxECU CAN output docs, raw CAN capture, health/watchdog state, derived metrics, shadow-mode control logic  
**Mobile/Hardware:** Flutter, Dart, BLE/device communication, diagnostics, firmware update flows, bootloader/erase/write/checksum patterns, gauges, datalogging, settings/configuration UI  
**Automation:** Python, PowerShell, Windows/server-oriented scripting, local operational tools  
**Desktop/Legacy Hardware UI:** C#, WinForms, serial port monitoring, Bluetooth/BLE support libraries  
**Working Style:** scoped changes, clean commits, useful comments, plain-language notes, careful review of AI-generated code

## A Note On The Code

These are public portfolio snapshots. I removed runtime secrets, `.env` files, dependency folders, generated builds, databases, archives, private customer data, firmware binaries, and large binary assets before publishing.

Some projects were built fast because the job was to solve a real business problem quickly. Some are more polished than others. What I want you to see is the range: full-stack systems, AI integrations, dashboards, workflow automation, hardware-connected mobile apps, and code that was written to make real work easier.

Contact: `bajaracer415@gmail.com`
