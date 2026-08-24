# Case Studies

This page gives reviewers a cleaner path through the strongest work without forcing them through every folder.

## 1. JB4Pro Vehicle Tuning Ecosystem

Project links:

- [`../projects/jb4pro-mobile-device-tools`](../projects/jb4pro-mobile-device-tools)
- [`../projects/jb4pro-csharp-interface`](../projects/jb4pro-csharp-interface)

What it shows:

- Mobile-to-hardware workflows
- BLE communication
- live telemetry and datalogging
- vehicle diagnostics
- firmware update and bootloader-style flows
- tuning settings and calibration-oriented UI
- legacy Windows hardware interface experience

Good interview probes:

- Walk through a BLE command lifecycle.
- Explain what happens when connection state changes mid-command.
- Explain firmware update failure recovery.
- Explain what you would redesign today.

## 2. CANFlex Mobile Hardware Controller

Project link:

- [`../projects/canflex-mobile-app`](../projects/canflex-mobile-app)

What it shows:

- Flutter/Dart mobile hardware app
- BLE telemetry parsing
- E85/fuel temperature/fuel pressure display
- CAN output and analog output configuration
- calibration and settings flows
- firmware/version awareness

Good interview probes:

- How does a sensor value become UI state?
- How do you protect calibration/settings commands?
- How do you test without the physical device?

## 3. TurboLamik AWD / Transmission Telemetry

Project link:

- [`../projects/turbolamik-awd-controller`](../projects/turbolamik-awd-controller)

What it shows:

- C/ESP-IDF-oriented vehicle integration
- raw CAN frame capture
- BMW signal decoding
- TurboLamik TCU frame decoding
- derived drivetrain metrics
- health/watchdog state
- shadow control logic thinking

Good interview probes:

- How do you identify stale or invalid vehicle signals?
- What would need validation before real control?
- How do you separate logging, decoding, derived metrics, and command logic?

## 4. Stealth Machine Tools Support Ecosystem

Project links:

- [`../projects/stealth-machine-backend`](../projects/stealth-machine-backend)
- [`../projects/stealth-machine-tools-flutter`](../projects/stealth-machine-tools-flutter)
- [`../projects/techsupport-ai-backend`](../projects/techsupport-ai-backend)

What it shows:

- Next.js/Prisma backend
- users, machines, customers, tickets, training materials
- AI support config and chat routes
- Flutter field/support app
- local storage and field UX helpers
- industrial machine support workflows

Good interview probes:

- How does a customer issue become a ticket and support workflow?
- What context is safe for AI to use?
- Where should human escalation happen?
- What tests or observability would you add first?

## 5. Stealth Batteries Commerce/Admin Platform

Project link:

- [`../projects/stealth-batteries-commerce-admin`](../projects/stealth-batteries-commerce-admin)

What it shows:

- Payload/Next/Postgres app structure
- business-specific collections
- dealers, affiliates, sales reps, customers
- products, pricing, discounts, shipping config
- orders and admin workflows
- email/hooks/migrations/providers/search/utilities

Good interview probes:

- How do orders, customers, dealers, affiliates, and sales reps relate?
- How would you handle webhook idempotency?
- What parts came from the template and what did you customize?
- How would you harden this for scale?

## 6. Customer Tracking CRM

Project link:

- [`../projects/customer-tracking-crm`](../projects/customer-tracking-crm)

What it shows:

- Practical business workflow software
- admin approvals
- customer portal views
- document uploads and OCR-style flows
- realtime updates
- notifications
- audit trails

Good interview probes:

- Why this shape instead of a heavier enterprise framework?
- Where are authorization and audit logs enforced?
- How would you modularize it if the team grew?

## 7. GEO Command Center Platform

Project link:

- [`../projects/geo-command-center-platform`](../projects/geo-command-center-platform)

Important note:

This is not geospatial. GEO means generative engine optimization / AI-search visibility.

What it shows:

- Next.js frontend
- FastAPI backend
- Supabase/Postgres/Drizzle modeling
- worker/background jobs
- provider/report pipelines
- audits, citations, reports, dashboards
- productized AI/search visibility workflow

Good interview probes:

- How do provider runs become reports?
- How are citations tracked?
- How would you isolate tenant data?
- What breaks first at high request volume?

