#pragma once

#include "config_store.h"

namespace growmie {

// If NVS has no Wi-Fi saved yet, fill SSID/PSK from `wifi_defaults.h`
// (optional `wifi_secrets.h`). Safe no-op when macros are empty strings.
void applyWifiCompileDefaults(HubConfig& cfg);

// Fill Supabase / hub / Tuya fields from `hub_defaults.h` when NVS keys are
// empty (optional gitignored `hub_secrets.h`).
void applyHubCompileDefaults(HubConfig& cfg);

// Manages the boot-time WiFi connection. If [cfg] is already provisioned,
// connects directly. Otherwise opens a captive portal so the operator can
// enter WiFi + Supabase + Tuya credentials, persists the result via
// [store], and reboots.
//
// Returns true once the device is on WiFi. Blocks forever if provisioning
// is needed and never completes.
bool ensureWifiAndConfig(HubConfig& cfg, ConfigStore& store);

// Force-resets the device to the captive-portal state (used by serial
// command + BOOT-button factory reset).
void resetProvisioning(ConfigStore& store);

}  // namespace growmie
