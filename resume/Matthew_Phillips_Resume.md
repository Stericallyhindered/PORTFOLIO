# Matthew Phillips

**Vehicle Software + Full-Stack Product Engineer | Embedded-Adjacent Systems | AI Workflows | Operations Tools**  
bajaracer415@gmail.com | 415-504-5897

## Summary

Senior product engineer with a full-stack, vehicle-software, and hardware-connected background. I build real systems for real users: vehicle telemetry tools, BLE hardware apps, CAN bus decoding, firmware update workflows, AI support systems, ecommerce/admin platforms, CRM/order workflows, warranty and claims tools, dealer portals, dashboards, and internal automation.

My strongest work sits at the intersection of software and the physical world. I have built around JB4 tuning hardware, CANFlex fuel/sensor controllers, TurboLamik AWD/transmission telemetry, Stealth Batteries commerce/admin operations, Stealth Machine support tooling, customer tracking systems, AI agents, onboarding, warranties, shipping, and support workflows. I am comfortable taking an unclear problem, learning the domain, finding the real constraints, shipping a useful system, and improving it from feedback.

## Core Strengths

- Vehicle and hardware-connected software: CAN bus workflows, BLE device communication, ECU/tuning workflows, telemetry parsing, firmware update flows, bootloader/erase/write/checksum patterns, diagnostics, datalogging, live gauges, and configuration tooling.
- Embedded-adjacent systems: ESP-IDF-oriented C scaffolding, CAN RX integration points, signal decoding, health/watchdog state, raw frame capture, derived metrics, shadow-mode control logic, and validation-first hardware integration.
- Full-stack product engineering: Node.js, Express, React, Next.js, TypeScript, JavaScript, Python, SQL/Postgres, SQLite, MongoDB/Mongoose, Supabase, Payload CMS, REST APIs, WebSockets, JWT auth, role permissions, and audit/logging patterns.
- AI and automation: Claude/Anthropic integrations, AI support agents, knowledge-base context, document ingestion, ticket triage, claims/warranty handling, onboarding workflows, internal workflow assistance, analytics, and human handoff paths.
- Operations software: CRM tools, order management, customer portals, dealer workflows, affiliate/sales-rep workflows, approval systems, shipping workflows, payment/webhook flows, dashboards, notifications, and support tooling.
- Working style: scope the problem, understand the user, keep changes readable, document decisions, communicate early, and own production behavior.

## Professional Experience

### Freelance Full-Stack Product Engineer / Integration Developer
**Stealth Batteries, Stealth Machine, AI Support Systems, Commerce/Admin, CRM, Operations Tools**  
Current

- Built full-stack applications and integrations for Stealth Batteries, Stealth Machine, and related businesses, owning ambiguous product problems from discovery through data modeling, frontend/backend development, debugging, deployment, and follow-up iteration.
- Built Stealth Batteries commerce/admin platform using Next.js, React, TypeScript, Payload CMS, Postgres, Stripe, webhooks, Resend/Nodemailer, Vercel Blob, UPS/shipping APIs, dealer portals, affiliate workflows, sales-rep workflows, order management, warranty/support workflows, and admin dashboards.
- Built Stealth Machine / Stealth Batteries AI support tooling with customer chat, onboarding, claim/warranty intake, internal workflow assistance, knowledge-base context, logging, analytics, ticketing, and human handoff paths.
- Built AI agent workflows that support customer service and internal operations across onboarding, warranties, shipping, support triage, product questions, document/context lookup, and repeatable employee-level workflows.
- Built CRM/order/customer tracking systems with Node/Express, SQLite, JWT auth, role permissions, admin approval workflows, customer portals, OCR/document scanning, real-time updates, Twilio/Nodemailer notifications, audit trails, and deployment documentation.
- Built automation and dashboards that connected customer-facing portals, admin work, order state, approvals, document uploads, notifications, reporting, and support history into usable business workflows.
- Used AI development tools daily for implementation, code review, documentation, refactoring, and debugging while retaining responsibility for correctness, security, and production behavior.

### Burger Motorsports
**Automotive Tuning, JB4Pro, CANFlex, Firmware-Adjacent Integration, Vehicle Software, BLE, CAN Bus**  
2019 onward

- Helped build and launch software around the JB4 tuning device ecosystem, including mobile application features, device-facing workflows, firmware-related flows, customer tools, diagnostics, support systems, and platform-specific behavior across many vehicle platforms and firmware combinations.
- Built JB4Pro mobile/device software using Flutter/Dart with BLE scan/connect behavior, connection recovery, notification parsing, ASCII/byte-level command handling, live gauges, datalogging, settings screens, user-adjustment interfaces, and developer diagnostics.
- Implemented firmware update workflows for JB4Pro-style hardware, including firmware download/manual HEX loading, bootloader entry, erase/write commands, block flashing, checksum validation, bootloader exit, progress state, and user-facing safety warnings.
- Built and maintained command/protocol logic for JB4 hardware, including settings retrieval, settings save, logging start/pause, map selection, E85/flex fuel configuration, WMI/meth settings, boost/fuel tables, AFR/meth/fuel pressure telemetry, and developer packet inspection.
- Developed CANFlex-style hardware software for fuel and sensor control: BLE device communication, ethanol content, fuel temperature, fuel pressure, CANbus output configuration, analog output modes, pressure sensor modes, calibration controls, firmware/version display, live gauges, logs, and race-car tuning workflows.
- Built CRM-backed support tooling that replaced manual email-based log review with structured customer submissions, vehicle log intake, AI-assisted parsing, diagnostic/tuning guidance, support history, and escalation paths.
- Worked close to embedded systems, firmware, custom hardware, and vehicle communication protocols, translating raw device/vehicle data into reliable UI state and supportable diagnostic workflows.
- Operated in a domain where incorrect parsing, settings, or firmware/version assumptions can affect real vehicles, requiring careful validation, documentation, and ownership of edge cases.

### Independent Vehicle / Hardware Software Projects
**TurboLamik AWD Controller, CANFlex, JB4Pro, Vehicle Telemetry and Integration Tools**

- Built a TurboLamik AWD controller project with ESP-IDF-oriented firmware scaffolding for BMW E90 + TurboLamik integration, including passive CAN listening on a shared 500 kbps bus, selected E90 CAN ID decoding, TurboLamik TCU frame decoding, normalized drivetrain/chassis signals, derived metrics, health/watchdog state, raw CAN capture, and shadow-mode AWD request computation.
- Reverse engineered TurboLamik ADX protocol behavior into a client-device spec, including 921600 baud serial assumptions, LOG1/LOG2 polling sequence, fixed 100-byte packet maps, gearbox torque, engine torque, input/output RPM, slip/clutch data, linear pressure, lockup, analog inputs, CAN torque fields, AWD activation, PWM output, steering angle, and error/safe-mode data.
- Built BMW E90 PT-CAN-style signal maps for throttle, engine RPM, wheel speeds, coolant/oil temperature, steering angle, brake proxy, handbrake, reverse, and validation notes separating confirmed decodes from provisional in-car validation items.
- Documented MaxxECU default CAN output integration for 11-bit IDs 0x520-0x542 at 500 kbit/s, including RPM, throttle, MAP, lambda, ignition, fuel duty, vehicle speed, slip, traction flags, brake/clutch flags, accelerations, oil pressure/temp, boost target, transmission temp, differential temp, and firmware-version-gated protocol differences.
- Designed the Flutter telemetry/logging app shell for vehicle-side diagnostics, including device status, live dashboard, raw frame monitor, decoded signal monitor, capture control, saved sessions/export, and vehicle profile display.

### Bayer
**Technical / Analytical Testing Software Background**  
2015-2018

- Worked in analytical/scientific environments after studying biochemistry and software engineering.
- Built and supported custom code and analytical workflows for regulated testing and scientific/technical operations.
- Gained experience with careful documentation, data integrity, regulated processes, quality expectations, and technical troubleshooting.

## Selected Project Highlights

### Stealth Batteries Commerce/Admin Platform

Built a production business platform connecting ecommerce, products, dealers, affiliates, sales reps, orders, shipping, support, warranty, dashboards, and Payload/Postgres admin tooling. The system tied customer-facing workflows to internal operations so the business could move faster without relying on manual email/status tracking.

### Stealth Machine / Stealth Batteries AI Support Tools

Built AI-assisted customer and internal support systems with chat, onboarding, knowledge-base context, warranty/claims handling, ticketing, analytics, logging, escalation, and human handoff. These were practical workflow tools designed to reduce manual support load, not demo chatbots.

### JB4Pro Vehicle Tuning Platform

Built mobile and hardware-connected software for JB4Pro tuning hardware, including BLE device discovery/connection, command handling, live telemetry, logging, firmware update flows, settings save/retrieval, map/user adjustment screens, E85/flex fuel workflows, WMI/meth configuration, boost/fuel tables, AFR/fuel pressure telemetry, and developer diagnostics.

### CANFlex Fuel and Sensor Controller

Built CANFlex software for a fuel injector / E85 sensor / fuel pressure control ecosystem with BLE communication, ethanol/fuel-temperature/fuel-pressure gauges, CANbus and analog output configuration, pressure sensor modes, calibration, logs, firmware/version handling, and ECU/JB4 integration paths for race-car tuning.

### TurboLamik AWD / Transmission Telemetry

Built an AWD controller and telemetry foundation around BMW E90 + TurboLamik, including CAN RX scaffolding, E90 decoder, TurboLamik decoder, raw CAN capture, health/watchdog state, derived metrics, shadow-mode AWD request logic, BLE service stub, Flutter live dashboard, raw frame monitor, decoded signal monitor, and saved log/export workflows.

### Customer Tracking CRM

Built CRM/order workflow software with admin approvals, customer portal views, uploaded documents, OCR-style intake, audit trails, real-time updates, notifications, and role-aware workflows for messy business operations.

### GEO Command Center

Built AI/search visibility tooling with multi-tenant dashboards, Supabase/Postgres, Drizzle, Redis/BullMQ-style workers, FastAPI services, Claude/Perplexity-style connectors, content audits, citation tracking, report generation, and analytics workflows.

## Technologies

**Vehicle / Embedded / Hardware:** C, ESP-IDF-oriented scaffolding, CAN bus, CAN-system workflows, BLE, OBD2-connected hardware, ECU/tuning workflows, BMW E90 signal decoding, TurboLamik TCU frame decoding, MaxxECU CAN output docs, raw CAN capture, health/watchdog state, derived metrics, shadow-mode control logic, diagnostics, datalogging, gauges, firmware update flows, bootloader workflows, HEX parsing, checksums.  
**Full Stack:** Node.js, Express, React, Next.js, TypeScript, JavaScript, REST APIs, WebSockets, JWT, role permissions, Payload CMS, Postgres, SQLite, MongoDB/Mongoose, Supabase, Drizzle, Redis/BullMQ-style queues.  
**Mobile / UI:** Flutter, Dart, Android concepts, live dashboards, charts/gauges, configuration UI, raw frame monitors, decoded signal monitors, settings screens, customer portals, admin dashboards.  
**AI / Integrations:** Claude/Anthropic, AI support agents, prompt/context workflows, document ingestion, OCR/document processing, Stripe, shipping APIs, UPS workflows, email/SMS providers, Resend/Nodemailer, Twilio, webhooks, logging, analytics.  
**Automation / Ops:** Python, PowerShell, Docker Compose, FastAPI, Git, deployment notes, support tooling, internal scripts, technical documentation.

## Education

Biochemistry and Software Engineering coursework, 2012-2015  
Studied biochemistry with a software engineering focus while preparing to build analytical testing and technical workflow software.

## How I Work

I am comfortable with “here is the problem, go figure it out” work. I ask scope questions early, especially around users, safety, diagnostics, edge cases, ownership, and production risk. I prefer simple architecture, clear data flow, validation before control output, and code that another engineer can safely change. I communicate before going dark and leave notes/change logs so the system is easier to understand later.
