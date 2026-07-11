#include "wifi_provision.h"

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>

#include <cstring>

#include "../include/hub_defaults.h"
#include "../include/wifi_defaults.h"

namespace growmie {

void applyWifiCompileDefaults(HubConfig& cfg) {
  const char* ssid = GROWMIE_DEFAULT_WIFI_SSID;
  const char* pass = GROWMIE_DEFAULT_WIFI_PASSWORD;
  if (ssid == nullptr || ssid[0] == '\0') return;
  if (!cfg.wifiSsid.isEmpty()) return;
  cfg.wifiSsid = ssid;
  cfg.wifiPsk  = pass != nullptr ? pass : "";
  Serial.printf("[wifi] applied compile-time SSID: %s\n", ssid);
}

void applyHubCompileDefaults(HubConfig& cfg) {
#define GROWMIE_SET_IF_EMPTY(field, macro)           \
  do {                                               \
    if ((cfg.field).isEmpty() && strlen(macro) > 0) \
      (cfg.field) = (macro);                         \
  } while (0)

  GROWMIE_SET_IF_EMPTY(supabaseUrl, GROWMIE_SB_URL);
  GROWMIE_SET_IF_EMPTY(supabaseAnon, GROWMIE_SB_ANON);
  GROWMIE_SET_IF_EMPTY(supabaseHubJwt, GROWMIE_SB_JWT);
  GROWMIE_SET_IF_EMPTY(supabaseServiceRole, GROWMIE_SB_SERVICE_ROLE);
  GROWMIE_SET_IF_EMPTY(hubId, GROWMIE_HUB_ID);
  GROWMIE_SET_IF_EMPTY(hubName, GROWMIE_HUB_NAME);

#undef GROWMIE_SET_IF_EMPTY
}

namespace {
constexpr const char* kPortalSsidPrefix = "Growmie-Hub-";
constexpr const char* kPortalPsk        = "growmie123";

String _chipSuffix() {
  uint64_t mac = ESP.getEfuseMac();
  char buf[5];
  snprintf(buf, sizeof(buf), "%04X", (uint16_t)(mac & 0xFFFF));
  return String(buf);
}

// Wires up the captive portal with extra parameter fields (Supabase only —
// per-device Tuya local_keys live in the Supabase `devices` table). WiFiManager
// owns the lifecycle; we just collect the values when the user presses Save.
bool runPortal(HubConfig& cfg) {
  WiFiManager wm;
  wm.setConfigPortalBlocking(true);
  wm.setSaveConfigCallback([]() { Serial.println("[wifi] portal saved"); });

  WiFiManagerParameter pHubName("hubName", "Hub name", cfg.hubName.c_str(), 64);
  WiFiManagerParameter pSbUrl("sbUrl", "Supabase URL",
                              cfg.supabaseUrl.c_str(), 128);
  WiFiManagerParameter pSbAnon("sbAnon", "Supabase anon key",
                              cfg.supabaseAnon.c_str(), 512);
  WiFiManagerParameter pSbJwt("sbJwt", "Hub JWT (or leave blank if using service role)",
                              cfg.supabaseHubJwt.c_str(), 700);
  WiFiManagerParameter pSbSrv(
      "sbSrv",
      "Service role key (optional; dev only — blank if using anon+JWT)",
      cfg.supabaseServiceRole.c_str(), 512);
  WiFiManagerParameter pHubId("hubId", "Hub UUID (Supabase hubs.id)",
                              cfg.hubId.c_str(), 64);
  WiFiManagerParameter pTuyaCid(
      "tuyaCid", "Tuya OpenAPI client id (optional)", cfg.tuyaClientId.c_str(),
      40);
  WiFiManagerParameter pTuyaSecret(
      "tuyaSecret", "Tuya OpenAPI client secret (optional)",
      cfg.tuyaClientSecret.c_str(), 64);
  WiFiManagerParameter pTuyaHost(
      "tuyaHost", "Tuya API host e.g. https://openapi.tuyaus.com",
      cfg.tuyaRegionHost.c_str(), 96);

  wm.addParameter(&pHubName);
  wm.addParameter(&pSbUrl);
  wm.addParameter(&pSbAnon);
  wm.addParameter(&pSbJwt);
  wm.addParameter(&pSbSrv);
  wm.addParameter(&pHubId);
  wm.addParameter(&pTuyaCid);
  wm.addParameter(&pTuyaSecret);
  wm.addParameter(&pTuyaHost);

  const String portalSsid = String(kPortalSsidPrefix) + _chipSuffix();
  if (!wm.startConfigPortal(portalSsid.c_str(), kPortalPsk)) {
    Serial.println("[wifi] portal exited without WiFi connect");
    return false;
  }

  cfg.wifiSsid         = WiFi.SSID();
  cfg.wifiPsk          = WiFi.psk();
  cfg.hubName          = pHubName.getValue();
  cfg.supabaseUrl      = pSbUrl.getValue();
  cfg.supabaseAnon     = pSbAnon.getValue();
  cfg.supabaseHubJwt   = pSbJwt.getValue();
  cfg.supabaseServiceRole = pSbSrv.getValue();
  cfg.hubId            = pHubId.getValue();
  cfg.tuyaClientId     = pTuyaCid.getValue();
  cfg.tuyaClientSecret = pTuyaSecret.getValue();
  cfg.tuyaRegionHost   = pTuyaHost.getValue();
  return true;
}

bool connectStation(const HubConfig& cfg, uint32_t timeoutMs) {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(("growmie-" + _chipSuffix()).c_str());
  WiFi.begin(cfg.wifiSsid.c_str(), cfg.wifiPsk.c_str());
  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > timeoutMs) return false;
    delay(250);
  }
  return true;
}
}  // namespace

bool ensureWifiAndConfig(HubConfig& cfg, ConfigStore& store) {
  // Still missing Supabase config but we now have Wi-Fi from defaults or NVS:
  // try connecting first so the portal can run in STA mode if supported.
  if (!cfg.isProvisioned()) {
    if (cfg.hasWifi()) {
      Serial.printf("[wifi] partial config — trying STA to %s ...\n",
                    cfg.wifiSsid.c_str());
      if (connectStation(cfg, /*timeoutMs=*/45000)) {
        Serial.printf("[wifi] connected, ip=%s (finish hub setup via portal)\n",
                      WiFi.localIP().toString().c_str());
      } else {
        Serial.println("[wifi] STA failed — will open captive portal AP");
      }
    }
    Serial.println("[wifi] not fully provisioned -- launching captive portal");
    if (!runPortal(cfg)) {
      Serial.println("[wifi] portal failed; restarting");
      delay(1000);
      ESP.restart();
      return false;
    }
    store.save(cfg);
    Serial.println("[wifi] config saved; rebooting");
    delay(500);
    ESP.restart();
    return false;  // unreachable
  }

  Serial.printf("[wifi] connecting to %s ...\n", cfg.wifiSsid.c_str());
  if (connectStation(cfg, /*timeoutMs=*/30000)) {
    Serial.printf("[wifi] connected, ip=%s\n",
                  WiFi.localIP().toString().c_str());
    return true;
  }

  // Reconnect failed -- relaunch portal so the user can update creds.
  Serial.println("[wifi] cached creds rejected -- launching portal");
  if (!runPortal(cfg)) {
    delay(1000);
    ESP.restart();
    return false;
  }
  store.save(cfg);
  delay(500);
  ESP.restart();
  return false;  // unreachable
}

void resetProvisioning(ConfigStore& store) {
  Serial.println("[wifi] factory reset requested");
  store.clear();
  WiFi.disconnect(true, true);
  delay(500);
  ESP.restart();
}

}  // namespace growmie
