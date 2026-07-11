// Supabase PostgREST client. Auth modes:
//   1) anon + hub JWT (RLS policies with jwt_hub_id())
//   2) service_role only (bypasses RLS — dev / trusted device only)

#include "supabase_client.h"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>

// PlatformIO injects GROW_HUB_FW_VERSION via platformio.ini build_flags; the
// Arduino IDE copy includes "hub_build_config.h" here instead (no build flags
// available there).

namespace growmie {

namespace {

bool httpPostJson(const String& url,
                  const std::vector<std::pair<String, String>>& headers,
                  const String& body,
                  String& outResp,
                  int expectMin = 200,
                  int expectMax = 299) {
  WiFiClientSecure tls;
  tls.setInsecure();
  HTTPClient http;
  if (!http.begin(tls, url)) return false;
  http.addHeader("Content-Type", "application/json");
  for (const auto& kv : headers) http.addHeader(kv.first, kv.second);
  const int code = http.POST(body);
  outResp = http.getString();
  http.end();
  if (code < expectMin || code > expectMax) {
    Serial.printf("[supabase] POST %s -> %d  body=%s\n",
                  url.c_str(), code, outResp.c_str());
    return false;
  }
  return true;
}

bool httpPatchJson(const String& url,
                   const std::vector<std::pair<String, String>>& headers,
                   const String& body,
                   String& outResp) {
  WiFiClientSecure tls;
  tls.setInsecure();
  HTTPClient http;
  if (!http.begin(tls, url)) return false;
  http.addHeader("Content-Type", "application/json");
  for (const auto& kv : headers) http.addHeader(kv.first, kv.second);
  const int code = http.PATCH(body);
  outResp = http.getString();
  http.end();
  if (code < 200 || code >= 300) {
    Serial.printf("[supabase] PATCH %s -> %d  body=%s\n",
                  url.c_str(), code, outResp.c_str());
    return false;
  }
  return true;
}

bool httpGet(const String& url,
             const std::vector<std::pair<String, String>>& headers,
             String& outResp) {
  WiFiClientSecure tls;
  tls.setInsecure();
  HTTPClient http;
  if (!http.begin(tls, url)) return false;
  for (const auto& kv : headers) http.addHeader(kv.first, kv.second);
  const int code = http.GET();
  outResp = http.getString();
  http.end();
  if (code < 200 || code >= 300) return false;
  return true;
}

String isoFromMs(uint64_t ms) {
  time_t tsec = ms / 1000;
  struct tm tm;
  gmtime_r(&tsec, &tm);
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tm);
  return String(buf);
}

}  // namespace

void SupabaseClient::begin(const HubConfig& cfg) {
  _baseUrl = cfg.supabaseUrl;
  if (_baseUrl.endsWith("/")) _baseUrl.remove(_baseUrl.length() - 1);
  _hubId = cfg.hubId;

  if (cfg.supabaseServiceRole.length() > 0) {
    _apiKey     = cfg.supabaseServiceRole;
    _authBearer = cfg.supabaseServiceRole;
    Serial.println("[supabase] mode: service_role (RLS bypass)");
  } else {
    _apiKey     = cfg.supabaseAnon;
    _authBearer = cfg.supabaseHubJwt;
    Serial.println("[supabase] mode: anon + hub JWT");
  }

  _ready = !_baseUrl.isEmpty() && !_hubId.isEmpty() &&
           !_apiKey.isEmpty() && !_authBearer.isEmpty();

  Serial.printf("[supabase] base=%s hub=%s ready=%d\n",
                _baseUrl.c_str(), _hubId.c_str(), _ready);
}

void SupabaseClient::pump() {}

bool SupabaseClient::listDevices(std::vector<Device>& out) {
  if (!_ready) return false;
  const String url = _baseUrl +
      "/rest/v1/devices?hub_id=eq." + _hubId + "&order=created_at.asc";
  auto h = authHeaders();
  String resp;
  if (!httpGet(url, h, resp)) return false;
  JsonDocument doc;
  if (deserializeJson(doc, resp)) return false;
  out.clear();
  for (JsonObject row : doc.as<JsonArray>()) {
    Device d;
    d.supabaseId    = row["id"].as<String>();
    d.tuyaDeviceId  = row["tuya_device_id"].as<String>();
    d.name          = row["name"].as<String>();
    d.role          = row["role"].as<String>();
    d.kind          = row["kind"].as<String>();
    d.online        = row["online"].as<bool>();
    d.localKey      = row["local_key"].as<String>();
    d.ip            = row["ip"].as<String>();
    String ver      = row["protocol_version"].as<String>();
    if (!ver.isEmpty()) d.protocolVersion = ver;
    if (row["dp_map"].is<JsonObject>()) {
      for (JsonPair kv : row["dp_map"].as<JsonObject>()) {
        d.dpMap[String(kv.key().c_str())] = kv.value().as<String>();
      }
    }
    out.push_back(d);
  }
  return true;
}

bool SupabaseClient::listScenes(std::vector<Scene>& out) {
  if (!_ready) return false;
  const String url = _baseUrl +
      "/rest/v1/scenes?hub_id=eq." + _hubId + "&order=created_at.asc";
  auto h = authHeaders();
  String resp;
  if (!httpGet(url, h, resp)) return false;
  JsonDocument doc;
  if (deserializeJson(doc, resp)) return false;
  out.clear();
  for (JsonObject row : doc.as<JsonArray>()) {
    Scene s;
    s.id                  = row["id"].as<String>();
    s.name                = row["name"].as<String>();
    s.stageOverride       = row["stage_override"].as<String>();
    s.photoperiodOverride = row["photoperiod_override"].as<String>();
    s.active              = row["active"].as<bool>();
    s.activeOrder         = row["active_order"].as<int>();
    if (!row["member_device_ids"].isNull()) {
      for (JsonVariant v : row["member_device_ids"].as<JsonArray>()) {
        s.memberDeviceIds.push_back(v.as<String>());
      }
    }
    if (!row["automation_rules"].isNull()) {
      for (JsonObject r : row["automation_rules"].as<JsonArray>()) {
        SceneRule sr;
        sr.metric     = r["metric"].as<String>();
        if (sr.metric.isEmpty()) sr.metric = r["Metric"].as<String>();
        sr.comparator = r["comparator"].as<String>();
        if (sr.comparator.isEmpty()) sr.comparator = r["Comparator"].as<String>();
        sr.value1     = r["value1"].as<float>();
        sr.value2     = r["value2"].as<float>();
        sr.deviceId   = r["device_id"].as<String>();
        if (sr.deviceId.isEmpty()) sr.deviceId = r["deviceId"].as<String>();
        sr.desiredOn  = r["desired_on"].as<bool>() || r["desiredOn"].as<bool>();
        s.rules.push_back(sr);
      }
    }
    out.push_back(s);
  }
  return true;
}

bool SupabaseClient::touchHubHeartbeat() {
  if (!_ready) return false;
  const String url = _baseUrl + "/rest/v1/hubs?id=eq." + _hubId;
  JsonDocument doc;
  doc["last_seen_at"] = isoFromMs((uint64_t)time(nullptr) * 1000ULL);
  doc["fw_version"]   = GROW_HUB_FW_VERSION;
  String body;
  serializeJson(doc, body);
  auto h = authHeaders();
  h.push_back({"Prefer", "return=minimal"});
  String resp;
  return httpPatchJson(url, h, body, resp);
}

bool SupabaseClient::insertSample(const SensorSample& s) {
  if (!_ready) return false;
  JsonDocument doc;
  doc["hub_id"]  = _hubId;
  doc["ts"]      = isoFromMs(s.tsMs);
  if (!s.deviceId.isEmpty()) doc["device_id"] = s.deviceId;
  if (!isnan(s.tempC))  doc["temp_c"]  = s.tempC;
  if (!isnan(s.rhPct))  doc["rh_pct"]  = s.rhPct;
  if (!isnan(s.vpdKpa)) doc["vpd_kpa"] = s.vpdKpa;
  String body;
  serializeJson(doc, body);
  auto h = authHeaders();
  h.push_back({"Prefer", "return=minimal"});
  String resp;
  return httpPostJson(_baseUrl + "/rest/v1/sensor_samples", h, body, resp);
}

bool SupabaseClient::insertOutletEvent(const OutletEvent& e) {
  if (!_ready) return false;
  JsonDocument doc;
  doc["hub_id"] = _hubId;
  doc["ts"]     = isoFromMs(e.tsMs);
  if (!e.deviceId.isEmpty()) doc["device_id"] = e.deviceId;
  doc["is_on"]  = e.isOn;
  doc["reason"] = e.reason;
  doc["source"] = e.source.isEmpty() ? "auto" : e.source;
  if (!e.role.isEmpty()) doc["role"] = e.role;
  String body;
  serializeJson(doc, body);
  auto h = authHeaders();
  h.push_back({"Prefer", "return=minimal"});
  String resp;
  return httpPostJson(_baseUrl + "/rest/v1/outlet_events", h, body, resp);
}

bool SupabaseClient::insertDecision(const AutomationDecision& d) {
  if (!_ready) return false;
  JsonDocument doc;
  doc["hub_id"] = _hubId;
  doc["ts"]     = isoFromMs(d.tsMs);
  if (!d.zone.isEmpty())  doc["zone"]  = d.zone;
  if (!d.notes.isEmpty()) doc["notes"] = d.notes;
  JsonDocument inner;
  if (!d.decisionJson.isEmpty() &&
      deserializeJson(inner, d.decisionJson) == DeserializationError::Ok) {
    doc["decision"] = inner;
  } else {
    doc["decision"].to<JsonObject>();
  }
  String body;
  serializeJson(doc, body);
  auto h = authHeaders();
  h.push_back({"Prefer", "return=minimal"});
  String resp;
  return httpPostJson(_baseUrl + "/rest/v1/automation_decisions", h, body, resp);
}

bool SupabaseClient::upsertControllerState(const String& hubId,
                                           const ControllerStateSnapshot& snap) {
  if (!_ready) return false;
  JsonDocument doc;
  doc["hub_id"]                  = hubId;
  doc["hum_relay_on"]            = snap.humRelayOn;
  doc["dehu_relay_on"]           = snap.dehuRelayOn;
  doc["hum_burst_phase"]         = snap.humBurstPhase;
  doc["hum_burst_remaining_ms"]  = snap.humBurstRemainingMs;
  doc["dehu_burst_phase"]        = snap.dehuBurstPhase;
  doc["dehu_burst_remaining_ms"] = snap.dehuBurstRemainingMs;
  doc["hum_desired"]             = snap.humDesired;
  doc["dehu_desired"]            = snap.dehuDesired;
  if (!isnan(snap.lastTempC))  doc["last_temp_c"]  = snap.lastTempC;
  if (!isnan(snap.lastRhPct))  doc["last_rh_pct"]  = snap.lastRhPct;
  if (!isnan(snap.lastVpdKpa)) doc["last_vpd_kpa"] = snap.lastVpdKpa;
  if (snap.lastTickMs > 0) doc["last_tick_at"] = isoFromMs(snap.lastTickMs);
  if (!snap.lastError.isEmpty()) doc["last_error"] = snap.lastError;
  JsonArray ids = doc["active_scene_ids"].to<JsonArray>();
  for (const auto& id : snap.activeSceneIds) ids.add(id);
  JsonArray held = doc["manual_held_ids"].to<JsonArray>();
  for (const auto& id : snap.manualHeldIds) held.add(id);

  String body;
  serializeJson(doc, body);
  auto h = authHeaders();
  h.push_back({"Prefer", "resolution=merge-duplicates,return=minimal"});
  String resp;
  return httpPostJson(_baseUrl + "/rest/v1/controller_state?on_conflict=hub_id",
                      h, body, resp);
}

bool SupabaseClient::ackCommand(const String& commandId, bool ok,
                                const String& err) {
  if (!_ready || commandId.isEmpty()) return false;
  JsonDocument doc;
  doc["status"]   = ok ? "acked" : "failed";
  doc["acked_at"] = isoFromMs((uint64_t)time(nullptr) * 1000ULL);
  if (!err.isEmpty()) doc["error"] = err;
  String body;
  serializeJson(doc, body);
  auto h = authHeaders();
  h.push_back({"Prefer", "return=minimal"});
  String resp;
  return httpPatchJson(_baseUrl + "/rest/v1/commands?id=eq." + commandId, h,
                       body, resp);
}

void SupabaseClient::subscribeCommands() {}

void SupabaseClient::drainCommands(const CommandHandler& cb) {
  if (!_ready) return;
  const String url = _baseUrl +
      "/rest/v1/commands?hub_id=eq." + _hubId +
      "&status=eq.pending&order=requested_at.asc&limit=20";
  auto h = authHeaders();
  String resp;
  if (!httpGet(url, h, resp)) return;
  JsonDocument doc;
  if (deserializeJson(doc, resp)) return;
  for (JsonObject row : doc.as<JsonArray>()) {
    Command c;
    c.id     = row["id"].as<String>();
    c.kind   = row["kind"].as<String>();
    c.status = row["status"].as<String>();
    JsonVariant payload = row["payload"];
    String pj;
    serializeJson(payload, pj);
    c.payloadJson = pj;
    cb(c);
  }
}

}  // namespace growmie
