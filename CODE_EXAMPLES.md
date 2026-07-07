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

### ESP32 Mouse Controller

- `projects/esp32-mouse-controller/esp32_mouse_controller.ino`  
  ESP32 USB HID firmware for turning hardware input into mouse control behavior.

- `projects/esp32-mouse-controller/mouse_controller_gui.py`  
  Python desktop GUI for controlling and testing the device.

### JB4Pro C# Interface

- `projects/jb4pro-csharp-interface/BGLib.cs`  
  Bluetooth/BLE support library code used by the legacy Windows interface.

- `projects/jb4pro-csharp-interface/SerialPortWatcher.cs`  
  Serial port detection and monitoring for connected hardware.

- `projects/jb4pro-csharp-interface/Form1.Designer.cs`  
  WinForms tuning-tool UI surface for a hardware-connected desktop app.

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

### Stealth Machine Backend

- `projects/stealth-machine-backend/src/lib/ai.ts`  
  Anthropic-backed AI support orchestration.

- `projects/stealth-machine-backend/src/lib/auth.ts`  
  JWT/cookie auth helpers and password hashing.

- `projects/stealth-machine-backend/prisma/schema.prisma`  
  Data model for users, machines, tickets, AI config, training materials, and activity.

- `projects/stealth-machine-backend/src/app/admin/tickets/page.tsx`  
  Admin ticket-management workflow.

### Stealth Machine Flutter App

- `projects/stealth-machine-tools-flutter/lib/`  
  Flutter app source for machine support/training workflows, local storage, API calls, auth helpers, and field-service UI.

- `projects/stealth-machine-tools-flutter/pubspec.yaml`  
  Cross-platform mobile stack: Riverpod/Provider, Dio/http, SQLite/shared preferences, camera, speech, PDF viewing, QR, charts, and routing.

### LaserConsumables Commerce

- `projects/laserconsumables-commerce/components/admin/ShippingDashboard.tsx`  
  Shipping/admin workflow UI.

- `projects/laserconsumables-commerce/components/admin/ManualOrderForm.tsx`  
  Manual order creation workflow.

- `projects/laserconsumables-commerce/lib/services/inventory-advanced.ts`  
  Inventory service logic.

- `projects/laserconsumables-commerce/prisma/schema.prisma`  
  Commerce data model.

### StrainCollector Commerce

- `projects/straincollector-commerce/src/`  
  Next.js/Supabase application source.

- `projects/straincollector-commerce/create-checkout-session.php`  
  Checkout session workflow.

- `projects/straincollector-commerce/stripe-webhook.php`  
  Payment webhook and downstream workflow handling.

- `projects/straincollector-commerce/create-shipping-label.php`  
  Shipping label workflow.

### Bass Clown Ecommerce

- `projects/bassclown-ecommerce/app/`  
  Next.js route structure and product/customer workflows.

- `projects/bassclown-ecommerce/components/`  
  Reusable UI and admin/customer components.

- `projects/bassclown-ecommerce/drizzle/` and `projects/bassclown-ecommerce/migrations/`  
  Database schema and migration work.
