# Code Examples To Review

This file points reviewers to the highest-signal examples in the portfolio, especially for vehicle software, firmware-adjacent integration, CAN/BLE hardware workflows, and full-stack systems.

## Vehicle / Embedded / Firmware-Adjacent

### TurboLamik AWD Controller

- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/can_rx.c`  
  CAN frame intake, raw capture, decode dispatch, derived metric refresh, and health/watchdog update.

- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/e90_profile_decoder.c`  
  BMW E90 CAN signal decoding for throttle, RPM, wheel speeds, steering, brake proxy, handbrake, and reverse state.

- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/turbolamik_decoder.c`  
  TurboLamik TCU CAN frame decoding for torque reduction, shift state, gear, wheel torque, lockup, oil temp, speed, clutch/converter slip, and shaft RPM.

- `projects/turbolamik-awd-controller/firmware/components/awd_core/src/derived_metrics.c`  
  Derived drivetrain metrics and shadow AWD request logic with clamps for steering, brake, oil temperature, handbrake, reverse, and degraded signal state.

- `projects/turbolamik-awd-controller/turbolamik_adx_protocol.md`  
  Reverse-engineered ADX/TunerPro protocol notes for TurboLamik log packets and serial-style polling behavior.

- `projects/turbolamik-awd-controller/docs/maxxecu_can_output_default.md`  
  MaxxECU default CAN output reference for 11-bit IDs, signal scaling, frame groups, bus load, and firmware-version differences.

### JB4Pro Mobile Device Tools

- `projects/jb4pro-mobile-device-tools/lib/providers/ble_provider.dart`  
  BLE scan/connect, notification parsing, command handling, connection recovery, live gauge state, and firmware-update support hooks.

- `projects/jb4pro-mobile-device-tools/lib/screens/firmware_screen.dart`  
  Firmware update workflow including HEX loading/download, bootloader entry, erase/write commands, block flashing, checksum validation, and bootloader exit.

- `projects/jb4pro-mobile-device-tools/lib/user_adjustment_screen.dart`  
  Tuning/settings UI for boost/fuel tables, WMI/meth, flex fuel/E85 behavior, AFR/fuel pressure telemetry, and advanced JB4 configuration.

- `projects/jb4pro-mobile-device-tools/lib/command list.md`  
  JB4 command and packet notes for logging, settings retrieval/save, firmware commands, E85/N2O config, and incoming telemetry.

### CANFlex Mobile App

- `projects/canflex-mobile-app/lib/ble_provider.dart`  
  BLE/device communication for a fuel/sensor controller with telemetry parsing, settings commands, gauge state, and logging.

- `projects/canflex-mobile-app/lib/screens/settings_page.dart`  
  CANbus output, analog output, pressure mode, calibration, logs, and firmware/version UI.

- `projects/canflex-mobile-app/lib/screens/main_screen.dart`  
  Live telemetry UI for ethanol content, fuel temperature, fuel pressure, RPM, speed, water temp, oil temp, gear, and torque.

## Full-Stack / AI / Operations

### Tech Support AI Backend

- `projects/techsupport-ai-backend/src/services/aiService.js`  
  Claude-backed support flow and AI service orchestration.

- `projects/techsupport-ai-backend/src/routes/tickets.js`  
  Ticket workflow routes for practical support operations.

- `projects/techsupport-ai-backend/src/routes/documents.js`  
  Document ingestion and support context workflows.

### Stealth Batteries Commerce/Admin

- `projects/stealth-batteries-commerce-admin/src/app/api/shipping/create/route.ts`  
  Shipping workflow integration.

- `projects/stealth-batteries-commerce-admin/src/app/api/stripe/webhook/route.ts`  
  Payment/webhook handling.

- `projects/stealth-batteries-commerce-admin/src/app/(customAdmin)/admin/orders/[orderId]/OrderDetailClient.tsx`  
  Admin order workflow UI.

### Customer Tracking CRM

- `projects/customer-tracking-crm/server.js`  
  Backend entry point for CRM/order/customer workflow system.

- `projects/customer-tracking-crm/frontend/src/pages/CustomerPortalPage.tsx`  
  Customer-facing portal workflow.

- `projects/customer-tracking-crm/frontend/src/context/SocketContext.tsx`  
  Real-time update plumbing.
