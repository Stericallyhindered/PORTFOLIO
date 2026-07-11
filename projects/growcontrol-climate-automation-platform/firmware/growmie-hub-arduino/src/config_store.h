#pragma once

#include <Arduino.h>
#include <Preferences.h>

namespace growmie {

// Persistent configuration for the hub. Lives in NVS (ESP32 flash) under the
// namespace "growmie". Read once at boot, updated through the captive portal
// or the serial console.
struct HubConfig {
  // -- WiFi (set by the captive portal) ---------------------------------------
  String wifiSsid;
  String wifiPsk;

  // -- Identity ---------------------------------------------------------------
  String hubId;          // matches Supabase `hubs.id`
  String hubName;        // human label, mirrored in `hubs.name`

  // -- Supabase ---------------------------------------------------------------
  String supabaseUrl;    // https://<ref>.supabase.co
  String supabaseAnon;   // anon (publishable) key — used with hub JWT
  String supabaseHubJwt; // optional: JWT with `hub_id` claim (RLS)
  // Optional: service_role key bypasses RLS. Use only on a trusted LAN device;
  // if set, anon+JWT are not required for API calls. Never commit.
  String supabaseServiceRole;

  // -- Burst defaults (overridable via Supabase `setBurst` commands) ----------
  uint32_t burstOnSec  = 30;
  uint32_t burstOffSec = 150;

  bool hasWifi()     const { return wifiSsid.length() > 0; }
  /// URL + hub UUID + either (anon + hub JWT) OR service_role key.
  bool hasSupabase() const {
    if (supabaseUrl.isEmpty() || hubId.isEmpty()) return false;
    if (supabaseServiceRole.length() > 0) return true;
    return supabaseAnon.length() > 0 && supabaseHubJwt.length() > 0;
  }
  bool isProvisioned() const { return hasWifi() && hasSupabase(); }
};

class ConfigStore {
 public:
  // Load every field from NVS. Missing keys leave defaults in place.
  bool load(HubConfig& out);

  // Persist the entire HubConfig. Returns false on NVS failure.
  bool save(const HubConfig& cfg);

  // Wipe the namespace (used by `growmie-hub reset` and the BOOT-hold-on-boot
  // factory-reset gesture).
  void clear();

 private:
  static constexpr const char* kNamespace = "growmie";
  Preferences _prefs;
};

}  // namespace growmie
