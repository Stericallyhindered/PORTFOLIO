# Matthew Phillips

**Principal Vehicle Software Engineer | Vehicle Controls | CAN/LIN Signal Processing | Embedded + Full-Stack Systems**  
bajaracer415@gmail.com | 415-504-5897

## Summary

Senior product and vehicle-software engineer with hands-on experience building hardware-connected automotive systems across mobile apps, embedded-adjacent firmware workflows, CAN bus telemetry, BLE device communication, diagnostics, tuning tools, customer support systems, and full-stack operational software. I am strongest where software has to understand the machine: decoding vehicle signals, making real-time hardware state visible to users, building reliable controls/configuration flows, and connecting vehicle data to practical engineering and support workflows.

For Meyers Manx, the fit is direct: I have built vehicle-facing software around JB4 tuning hardware, CANFlex fuel and sensor hardware, and TurboLamik AWD/transmission telemetry. That work includes CAN signal mapping, BLE-connected mobile interfaces, firmware update flows, live gauges, datalogging, diagnostics, configuration screens, customer-facing support tools, and full-stack systems that help teams understand what happened on the vehicle.

## Core Strengths

- Vehicle software and hardware-connected systems: CAN bus signal decoding, CAN/LIN-oriented vehicle network workflows, BLE device communication, serial-style protocols, telemetry parsing, diagnostics, firmware update UX, live gauges, datalogging, and configuration tooling.
- Embedded and controls-adjacent work: ESP-IDF-oriented firmware scaffolding, CAN RX integration points, watchdog/health state, raw frame capture, derived metrics, shadow-mode AWD logic, signal validity, and safety-first validation before control output.
- Automotive domain depth: ECU/tuning workflows, OBD2-connected hardware, vehicle logging, firmware/version behavior, fuel/ethanol sensing, injector/fuel-system control, transmission/TCU telemetry, wheel speed, gear, torque, slip, boost, RPM, AFR, meth/WMI, and E85 workflows.
- Full-stack product engineering: Node.js, TypeScript, React, Next.js, Express, SQL/Postgres, SQLite, MongoDB, REST APIs, WebSockets, queues, admin dashboards, customer portals, CRM/order systems, authentication, and audit/logging patterns.
- Mobile and UI systems: Flutter/Dart, Android concepts, live dashboards, charts/gauges, settings/configuration UI, device connection state, saved sessions, raw frame monitors, decoded signal monitors, and consumer-facing interfaces.
- Practical engineering habits: scoped changes, readable code, careful documentation, testable paths, root-cause thinking, clear stakeholder updates, and ownership of production behavior.

## Professional Experience

### Burger Motorsports
**Automotive Tuning, Vehicle Software, Embedded/Hardware-Connected Systems, CAN Bus, BLE, Mobile Development**  
2019 onward

- Helped build and launch the JB4 tuning device ecosystem, including device-facing software, mobile application features, firmware-related workflows, customer tools, support workflows, diagnostics, and platform-specific behavior across many vehicle platforms and firmware combinations.
- Built JB4Pro mobile/device software using Flutter/Dart with BLE scan/connect behavior, connection recovery, notification parsing, ASCII/byte-level command handling, live gauges, datalogging, settings screens, user-adjustment interfaces, and developer diagnostics.
- Implemented firmware update workflows for JB4Pro-style hardware, including firmware download/manual HEX loading, bootloader entry, erase/write commands, block flashing, checksum validation, exit bootloader handling, progress state, and user-facing safety warnings.
- Built and maintained command/protocol logic for JB4 hardware, including settings retrieval, settings save, logging start/pause, map selection, E85/flex fuel configuration, N2O-related configuration, WMI/meth settings, boost/fuel tables, AFR/meth/fuel pressure telemetry, and developer packet inspection.
- Developed CANFlex-style hardware software for fuel and sensor control: BLE device communication, ethanol content, fuel temperature, fuel pressure, CANbus output configuration, analog output modes, pressure sensor modes, calibration controls, firmware/version display, live gauges, logs, and race-car tuning workflows.
- Worked close to embedded systems, firmware, custom hardware, and vehicle communication protocols, translating raw device/vehicle data into reliable UI state and supportable diagnostic workflows.
- Built CRM-backed support systems that replaced manual email-based log review with structured customer submissions, vehicle log intake, AI-assisted parsing, diagnostic/tuning guidance, support history, and escalation paths.
- Developed customer-facing and internal tools for a physical OBD2-connected tuning product used by thousands of customers across in-car, mobile, and web workflows.

### Independent Vehicle/Hardware Software Projects
**TurboLamik AWD Controller, CANFlex, JB4Pro, AI Support/Operations Systems**

- Built a TurboLamik AWD controller project with ESP-IDF-oriented firmware scaffolding for a BMW E90 + TurboLamik integration, including passive CAN listening on a shared 500 kbps bus, selected E90 CAN ID decoding, TurboLamik TCU frame decoding, normalized drivetrain/chassis signals, derived metrics, health/watchdog state, raw CAN capture, and shadow-mode AWD request computation.
- Reverse engineered TurboLamik ADX protocol behavior into a client-device spec, including 921600 baud serial assumptions, LOG1/LOG2 polling sequence, fixed 100-byte packet maps, gearbox torque, engine torque, input/output RPM, slip/clutch data, linear pressure, lockup, analog inputs, CAN torque fields, AWD activation, PWM output, steering angle, and error/safe-mode data.
- Built vehicle signal maps for BMW E90 PT-CAN-style traffic, including throttle, engine RPM, wheel speeds, coolant/oil temperature, steering angle, brake proxy, handbrake, reverse, and validation notes separating confirmed decodes from provisional in-car validation items.
- Documented MaxxECU default CAN output integration for 11-bit IDs 0x520-0x542 at 500 kbit/s, including RPM, throttle, MAP, lambda, ignition, fuel duty, vehicle speed, slip, traction flags, brake/clutch flags, accelerations, oil pressure/temp, boost target, transmission temp, differential temp, and firmware-version-gated protocol differences.
- Designed the Flutter telemetry/logging app shell for the vehicle side, including device status, live dashboard, raw frame monitor, decoded signal monitor, capture control, saved sessions/export, and vehicle profile display.
- Built full-stack AI/customer-support systems around hardware businesses, including chat, onboarding, claims/warranty handling, knowledge-base context, ticketing, analytics, logging, customer history, and human handoff paths.

### Freelance Full-Stack Product Engineer / Integration Developer
**Full-Stack Systems, AI Workflows, Operations Automation, Customer Portals**  
Current

- Build full-stack applications and integrations for Stealth Batteries and related businesses, owning ambiguous product problems from discovery through architecture, implementation, debugging, deployment, and follow-up iteration.
- Built Stealth Batteries commerce/admin systems using Next.js, React, TypeScript, Payload CMS, Postgres, Stripe, webhooks, Resend/Nodemailer, Vercel Blob, UPS/shipping APIs, dealer portals, affiliate workflows, order management, warranty/support workflows, and admin dashboards.
- Built AI-assisted support and autonomous workflow systems for customer support, onboarding, warranty/claims handling, internal workflow assistance, knowledge-base context, logging, analytics, and escalation paths.
- Built CRM/order/customer tracking systems with Node/Express, SQLite, JWT auth, role permissions, admin approval workflows, customer portals, OCR/document scanning, real-time updates, Twilio/Nodemailer notifications, audit trails, and deployment documentation.
- Use AI development tools daily for implementation, review, documentation, and debugging, while retaining responsibility for correctness, security, and production behavior.

### Bayer
**Technical / Analytical Testing Software Background**  
2015-2018

- Worked in analytical/scientific environments after studying biochemistry and software engineering.
- Built and supported custom code and analytical workflows for regulated testing and scientific/technical operations.
- Gained experience with careful documentation, data integrity, regulated processes, quality expectations, and technical troubleshooting.

## Selected Project Highlights

### JB4Pro Vehicle Tuning Platform

Built mobile and hardware-connected software for JB4Pro tuning hardware, including BLE device discovery/connection, command handling, live telemetry, logging, firmware update flows, settings save/retrieval, map/user adjustment screens, E85/flex fuel workflows, WMI/meth configuration, boost/fuel tables, AFR/fuel pressure telemetry, and developer diagnostics.

### CANFlex Fuel and Sensor Controller

Built CANFlex software for a fuel injector / E85 sensor / fuel pressure control ecosystem with BLE communication, ethanol/fuel-temperature/fuel-pressure gauges, CANbus and analog output configuration, pressure sensor modes, calibration, logs, firmware/version handling, and ECU/JB4 integration paths for race-car tuning.

### TurboLamik AWD / Transmission Telemetry

Built an AWD controller and telemetry foundation around BMW E90 + TurboLamik, including CAN RX scaffolding, E90 decoder, TurboLamik decoder, raw CAN capture, health/watchdog state, derived metrics, shadow-mode AWD request logic, BLE service stub, Flutter live dashboard, raw frame monitor, decoded signal monitor, and saved log/export workflows.

## Technologies

**Vehicle / Embedded / Protocols:** CAN bus, CAN/LIN-oriented vehicle network workflows, OBD2-connected hardware, BLE, serial-style protocols, ESP-IDF scaffolding, firmware update flows, bootloader workflows, HEX parsing, checksums, telemetry decoding, diagnostics, datalogging, live gauges, raw frame capture, watchdog/health state.  
**Languages / Frameworks:** C, C++, C#, Dart/Flutter, Java/Android concepts, Python, TypeScript, JavaScript, Node.js, Express, React, Next.js.  
**Backend / Data / Ops:** Postgres, SQLite, MongoDB/Mongoose, Payload CMS, Supabase, Drizzle, Redis/BullMQ-style queues, REST APIs, WebSockets, JWT, role permissions, Stripe, shipping APIs, email/SMS providers, logging, analytics, admin dashboards.  
**AI / Tooling:** Claude/Anthropic integrations, AI support workflows, code review/refactoring/documentation workflows, knowledge-base context, ticket triage, human handoff paths.

## Education

Biochemistry and Software Engineering coursework, 2012-2015  
Studied biochemistry with a software engineering focus while preparing to build analytical testing and technical workflow software.

## How I Work

I am comfortable with “here is the vehicle problem, go figure it out” work. I ask scope questions early, especially around safety, diagnostics, edge cases, ownership, and production risk. I prefer simple architecture, clear data flow, validation before control output, and code that another engineer can safely change. I communicate before going dark and leave notes/change logs so the system is easier to understand later.
