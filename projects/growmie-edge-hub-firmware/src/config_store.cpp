#include "config_store.h"

namespace growmie {

namespace {
constexpr const char* kWifiSsid       = "wifi.ssid";
constexpr const char* kWifiPsk        = "wifi.psk";
constexpr const char* kHubId          = "hub.id";
constexpr const char* kHubName        = "hub.name";
constexpr const char* kSupabaseUrl    = "sb.url";
constexpr const char* kSupabaseAnon   = "sb.anon";
constexpr const char* kSupabaseJwt    = "sb.jwt";
constexpr const char* kSupabaseSrv    = "sb.srv";
constexpr const char* kTuyaClientId   = "tuya.cid";
constexpr const char* kTuyaSecret     = "tuya.secret";
constexpr const char* kTuyaHost       = "tuya.host";
constexpr const char* kBurstOnSec     = "b.on";
constexpr const char* kBurstOffSec    = "b.off";
}  // namespace

bool ConfigStore::load(HubConfig& out) {
  if (!_prefs.begin(kNamespace, /*readOnly=*/true)) {
    return false;
  }
  out.wifiSsid         = _prefs.getString(kWifiSsid, "");
  out.wifiPsk          = _prefs.getString(kWifiPsk, "");
  out.hubId            = _prefs.getString(kHubId, "");
  out.hubName          = _prefs.getString(kHubName, "");
  out.supabaseUrl      = _prefs.getString(kSupabaseUrl, "");
  out.supabaseAnon     = _prefs.getString(kSupabaseAnon, "");
  out.supabaseHubJwt   = _prefs.getString(kSupabaseJwt, "");
  out.supabaseServiceRole = _prefs.getString(kSupabaseSrv, "");
  out.tuyaClientId     = _prefs.getString(kTuyaClientId, "");
  out.tuyaClientSecret = _prefs.getString(kTuyaSecret, "");
  out.tuyaRegionHost   = _prefs.getString(kTuyaHost, "");
  out.burstOnSec       = _prefs.getUInt(kBurstOnSec, 30);
  out.burstOffSec      = _prefs.getUInt(kBurstOffSec, 150);
  _prefs.end();
  return true;
}

bool ConfigStore::save(const HubConfig& cfg) {
  if (!_prefs.begin(kNamespace, /*readOnly=*/false)) {
    return false;
  }
  _prefs.putString(kWifiSsid,     cfg.wifiSsid);
  _prefs.putString(kWifiPsk,      cfg.wifiPsk);
  _prefs.putString(kHubId,        cfg.hubId);
  _prefs.putString(kHubName,      cfg.hubName);
  _prefs.putString(kSupabaseUrl,  cfg.supabaseUrl);
  _prefs.putString(kSupabaseAnon, cfg.supabaseAnon);
  _prefs.putString(kSupabaseJwt,  cfg.supabaseHubJwt);
  _prefs.putString(kSupabaseSrv,  cfg.supabaseServiceRole);
  _prefs.putString(kTuyaClientId, cfg.tuyaClientId);
  _prefs.putString(kTuyaSecret,   cfg.tuyaClientSecret);
  _prefs.putString(kTuyaHost,     cfg.tuyaRegionHost);
  _prefs.putUInt(kBurstOnSec,     cfg.burstOnSec);
  _prefs.putUInt(kBurstOffSec,    cfg.burstOffSec);
  _prefs.end();
  return true;
}

void ConfigStore::clear() {
  if (_prefs.begin(kNamespace, /*readOnly=*/false)) {
    _prefs.clear();
    _prefs.end();
  }
}

}  // namespace growmie
