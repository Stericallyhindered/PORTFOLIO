// C++ port of lib/services/climate_control_service.dart +
// lib/state/grow_room_controller.dart (climate tick path).
//
// What lives here:
//   - VPD band table per growth stage / photoperiod (mirrors VpdReferenceTable)
//   - Target RH computation from temp + target VPD (leaf-air model, dT=2 C)
//   - Hysteresis + dehu-priority-over-hum conflict resolution
//   - Active scene merging (rules + member device list)
//   - Command dispatch (setOutlet / activateScene / setBurst / setStage / ...)
//
// What does NOT live here:
//   - Learning model (DehumidifierPullDownRecord / HumidifierRampRecord). The
//     phone keeps owning those for now; the hub re-emits the underlying
//     events into Supabase and a future commit can port the model too.
//   - Tuya I/O. We hand BurstController the desired states and let it deal
//     with the relays. That's what burst.cpp does.

#include "climate.h"

#include <ArduinoJson.h>
#include <algorithm>
#include <math.h>
#include <time.h>

#include "burst.h"
#include "../include/hub_trace.h"
#include "local_tuya.h"
#include "supabase_client.h"

namespace growmie {

namespace {

// Saturated vapour pressure (kPa) via Tetens.
float svpKpa(float tempC) {
  return 0.6108f * expf(17.27f * tempC / (tempC + 237.3f));
}

// Leaf-air VPD with leaf temperature = air - delta.
float leafAirVpdKpa(float tempC, float rhPct, float leafDeltaC = 2.0f) {
  const float svpLeaf = svpKpa(tempC - leafDeltaC);
  const float svpAir  = svpKpa(tempC);
  const float vp      = svpAir * (rhPct / 100.0f);
  return svpLeaf - vp;
}

// RH that produces the target leaf-air VPD at the current air temperature.
float rhForTargetVpd(float tempC, float targetVpdKpa,
                     float leafDeltaC = 2.0f) {
  const float svpLeaf = svpKpa(tempC - leafDeltaC);
  const float svpAir  = svpKpa(tempC);
  const float vp      = svpLeaf - targetVpdKpa;
  float rh = (vp / svpAir) * 100.0f;
  if (rh < 0) rh = 0;
  if (rh > 100) rh = 100;
  return rh;
}

struct VpdBand {
  float minKpa;
  float maxKpa;
  float midKpa() const { return (minKpa + maxKpa) * 0.5f; }
};

// (stage, photoperiod) -> band. Mirrors lib/domain/vpd/vpd_tables.dart.
VpdBand bandFor(const String& stage, const String& photoperiod) {
  const bool day = (photoperiod != "lightsOff");
  if (stage == "seedlingClone") return day ? VpdBand{0.40, 0.80} : VpdBand{0.40, 0.75};
  if (stage == "earlyVeg")      return day ? VpdBand{0.45, 0.80} : VpdBand{0.40, 0.75};
  if (stage == "lateVeg")       return day ? VpdBand{0.80, 1.20} : VpdBand{0.75, 1.10};
  if (stage == "transition")    return day ? VpdBand{0.80, 1.20} : VpdBand{0.75, 1.10};
  if (stage == "earlyFlower")   return day ? VpdBand{0.80, 1.20} : VpdBand{0.75, 1.10};
  if (stage == "midFlower")     return day ? VpdBand{1.20, 1.60} : VpdBand{1.10, 1.50};
  if (stage == "lateFlower")    return day ? VpdBand{1.20, 1.60} : VpdBand{1.10, 1.50};
  if (stage == "ripening")      return day ? VpdBand{1.20, 1.60} : VpdBand{1.10, 1.45};
  // Sensible default = midFlower day.
  return VpdBand{1.20, 1.60};
}

constexpr float kRhHalfWidth     = 3.0f;
constexpr float kStickyHum       = 1.5f;
constexpr float kStickyDehu      = 1.5f;
constexpr bool  kDehuPriority    = true;

}  // namespace

void ClimateController::recordError(const String& msg) {
  _lastError = msg;
  HUB_TRACE_ERR("%s", msg.c_str());
}

void ClimateController::refreshFromSupabase(SupabaseClient& sb) {
  std::vector<Device> devices;
  if (sb.listDevices(devices)) {
    _devices = std::move(devices);
    HUB_TRACE_CLIMATE("Supabase devices refreshed count=%u",
                      (unsigned)_devices.size());
  } else {
    HUB_TRACE_ERR("listDevices failed (HTTP or JSON)");
  }
  std::vector<Scene> scenes;
  if (sb.listScenes(scenes)) {
    _scenes = std::move(scenes);
    _activeSceneIds.clear();
    for (const auto& s : _scenes) {
      if (s.active) _activeSceneIds.push_back(s.id);
    }
    HUB_TRACE_CLIMATE("Supabase scenes refreshed count=%u active_scene_ids=%u",
                      (unsigned)_scenes.size(), (unsigned)_activeSceneIds.size());
  } else {
    HUB_TRACE_ERR("listScenes failed (HTTP or JSON)");
  }
}

void ClimateController::begin(const HubConfig& /*cfg*/, SupabaseClient& sb) {
  refreshFromSupabase(sb);
  sb.onSceneChange([this](const Scene& s) {
    for (auto& existing : _scenes) {
      if (existing.id == s.id) {
        existing = s;
        // Mirror the active flag into our active-id list.
        const bool wasActive = std::any_of(
            _activeSceneIds.begin(), _activeSceneIds.end(),
            [&](const String& id) { return id == s.id; });
        if (s.active && !wasActive) _activeSceneIds.push_back(s.id);
        if (!s.active && wasActive) {
          _activeSceneIds.erase(
              std::remove(_activeSceneIds.begin(), _activeSceneIds.end(), s.id),
              _activeSceneIds.end());
        }
        return;
      }
    }
    _scenes.push_back(s);
    if (s.active) _activeSceneIds.push_back(s.id);
  });
}

void ClimateController::applyFreshSamples(
    const std::vector<SensorSample>& samples) {
  for (const auto& s : samples) {
    if (!isnan(s.tempC)) _liveTempC = s.tempC;
    if (!isnan(s.rhPct)) _liveRhPct = s.rhPct;
    if (!isnan(_liveTempC) && !isnan(_liveRhPct)) {
      _liveVpdKpa = leafAirVpdKpa(_liveTempC, _liveRhPct);
    }
  }
  if (!samples.empty()) {
    HUB_TRACE_CLIMATE("climate inputs updated (samples=%u) live T=%.1fC RH=%.0f%% "
                      "VPD=%.2fkPa",
                      (unsigned)samples.size(), _liveTempC, _liveRhPct,
                      _liveVpdKpa);
  }
}

namespace {

const Device* findDeviceByRole(const std::vector<Device>& devices,
                               const String& role) {
  for (const auto& d : devices) {
    if (d.role == role) return &d;
  }
  return nullptr;
}

const Device* findDeviceBySupabaseOrTuya(const std::vector<Device>& devices,
                                         const String& id) {
  if (id.isEmpty()) return nullptr;
  for (const auto& d : devices) {
    if (d.supabaseId == id || d.tuyaDeviceId == id) return &d;
  }
  return nullptr;
}

}  // namespace

std::vector<OutletCommand> ClimateController::evaluate(
    AutomationDecision& outDecision) {
  _lastTickMs = (uint64_t)time(nullptr) * 1000ULL;
  if (isnan(_liveTempC) || isnan(_liveRhPct)) {
    outDecision.decisionJson = "";
    return {};
  }

  // Active stage / photoperiod come from the most recent active scene's
  // overrides, falling back to mid-flower day. Day/night could come from a
  // real clock; we use the scene override exclusively for now.
  String stage      = "midFlower";
  String photo      = "lightsOn";
  for (const auto& s : _scenes) {
    if (!s.active) continue;
    if (s.stageOverride.length() > 0)        stage = s.stageOverride;
    if (s.photoperiodOverride.length() > 0)  photo = s.photoperiodOverride;
  }

  const VpdBand band      = bandFor(stage, photo);
  const float   targetVpd = band.midKpa();
  const float   targetRh  = rhForTargetVpd(_liveTempC, targetVpd);
  const float   low       = targetRh - kRhHalfWidth;
  const float   high      = targetRh + kRhHalfWidth;

  const Device* humDev  = findDeviceByRole(_devices, "humidifier");
  const Device* dehuDev = findDeviceByRole(_devices, "dehumidifier");

  bool humWant  = false;
  bool dehuWant = false;

  if (_liveRhPct > high && dehuDev) dehuWant = true;
  if (_liveRhPct < low  && humDev)  humWant  = true;

  // Sticky hysteresis: hold direction inside the deadband.
  if (_humWantPrev  && humDev  && _liveRhPct < targetRh + kStickyHum)  humWant  = true;
  if (_dehuWantPrev && dehuDev && _liveRhPct > targetRh - kStickyDehu) dehuWant = true;

  // Dehu wins on conflict.
  if (kDehuPriority && humWant && dehuWant) humWant = false;

  // Apply scene rule overrides per device.
  for (const auto& scene : _scenes) {
    if (!scene.active) continue;
    for (const auto& rule : scene.rules) {
      bool match = false;
      const float v = (rule.metric == "temp") ? _liveTempC
                    : (rule.metric == "vpd")  ? _liveVpdKpa
                                              : _liveRhPct;
      if (rule.comparator == "gt") {
        match = v > rule.value1;
      } else if (rule.comparator == "lt") {
        match = v < rule.value1;
      } else if (rule.comparator == "between") {
        match = v >= rule.value1 && v <= rule.value2;
      }
      if (!match) continue;
      // Find the targeted device and inject a command.
      const Device* d = findDeviceBySupabaseOrTuya(_devices, rule.deviceId);
      if (!d) continue;
      if (d->role == "humidifier")  humWant  = rule.desiredOn;
      if (d->role == "dehumidifier") dehuWant = rule.desiredOn;
    }
  }

  // Manual hold (from `setOutlet` commands) trumps everything.
  for (const auto& [devId, want] : _manualHeld) {
    const Device* d = findDeviceBySupabaseOrTuya(_devices, devId);
    if (!d) continue;
    if (d->role == "humidifier")  humWant  = want;
    if (d->role == "dehumidifier") dehuWant = want;
  }

  _humWantPrev  = humWant;
  _dehuWantPrev = dehuWant;

  std::vector<OutletCommand> out;
  if (humDev) {
    out.push_back({"humidifier", humDev->supabaseId, humDev->tuyaDeviceId,
                   humWant, "climate.evaluate"});
  }
  if (dehuDev) {
    out.push_back({"dehumidifier", dehuDev->supabaseId, dehuDev->tuyaDeviceId,
                   dehuWant, "climate.evaluate"});
  }

  // Build the JSON decision payload that gets streamed to Supabase.
  JsonDocument d;
  d["stage"]      = stage;
  d["photo"]      = photo;
  d["targetVpd"]  = targetVpd;
  d["targetRh"]   = targetRh;
  d["liveTempC"]  = _liveTempC;
  d["liveRh"]     = _liveRhPct;
  d["liveVpd"]    = _liveVpdKpa;
  d["humWant"]    = humWant;
  d["dehuWant"]   = dehuWant;
  d["band"]["min"] = band.minKpa;
  d["band"]["max"] = band.maxKpa;
  String s;
  serializeJson(d, s);
  outDecision.decisionJson = s;
  outDecision.tsMs         = _lastTickMs;
  outDecision.zone         = "climate";

  return out;
}

void ClimateController::fillSnapshot(ControllerStateSnapshot& snap) const {
  snap.lastTempC      = _liveTempC;
  snap.lastRhPct      = _liveRhPct;
  snap.lastVpdKpa     = _liveVpdKpa;
  snap.lastTickMs     = _lastTickMs;
  snap.lastError      = _lastError;
  snap.humDesired     = _humWantPrev;
  snap.dehuDesired    = _dehuWantPrev;
  snap.activeSceneIds = _activeSceneIds;
  for (const auto& [id, _] : _manualHeld) snap.manualHeldIds.push_back(id);
}

void ClimateController::handleCommand(const Command& cmd, LocalTuya& tuya,
                                      BurstController& burst) {
  HUB_TRACE_CMD("recv id=%s kind=%s", cmd.id.c_str(), cmd.kind.c_str());
  JsonDocument doc;
  if (!cmd.payloadJson.isEmpty()) {
    deserializeJson(doc, cmd.payloadJson);
  }
  if (cmd.kind == "setOutlet") {
    const String devId = doc["device_id"].as<String>();
    const bool   on    = doc["on"].as<bool>();
    const Device* d = findDeviceBySupabaseOrTuya(_devices, devId);
    if (!d) {
      HUB_TRACE_ERR("setOutlet unknown device_id=%s", devId.c_str());
      return;
    }
    HUB_TRACE_CMD("setOutlet tuya=%s supabase=%s -> %s", d->tuyaDeviceId.c_str(),
                  d->supabaseId.c_str(), on ? "ON" : "OFF");
    _manualHeld[d->supabaseId] = on;
    burst.hold(d->tuyaDeviceId, on, d->supabaseId);
    tuya.publishSwitch(*d, on);
  } else if (cmd.kind == "activateScene") {
    const String id = doc["scene_id"].as<String>();
    _activeSceneIds.erase(
        std::remove(_activeSceneIds.begin(), _activeSceneIds.end(), id),
        _activeSceneIds.end());
    _activeSceneIds.push_back(id);
    for (auto& s : _scenes) {
      if (s.id == id) { s.active = true; break; }
    }
  } else if (cmd.kind == "deactivateScene") {
    const String id = doc["scene_id"].as<String>();
    HUB_TRACE_CMD("deactivateScene %s", id.c_str());
    _activeSceneIds.erase(
        std::remove(_activeSceneIds.begin(), _activeSceneIds.end(), id),
        _activeSceneIds.end());
    for (auto& s : _scenes) {
      if (s.id == id) { s.active = false; break; }
    }
  } else if (cmd.kind == "setBurst") {
    const uint32_t onSec  = doc["on_seconds"].as<uint32_t>();
    const uint32_t offSec = doc["off_seconds"].as<uint32_t>();
    HUB_TRACE_CMD("setBurst on=%lus off=%lus", (unsigned long)onSec,
                  (unsigned long)offSec);
    if (onSec > 0 && offSec > 0) burst.setDurations(onSec * 1000, offSec * 1000);
  } else if (cmd.kind == "refresh") {
    HUB_TRACE_CMD("refresh (no-op; next tick polls LAN)");
  } else if (cmd.kind == "renameDevice") {
    const String devId = doc["device_id"].as<String>();
    const String name  = doc["name"].as<String>();
    HUB_TRACE_CMD("renameDevice id=%s name=%s", devId.c_str(), name.c_str());
    for (auto& d : _devices) {
      if (d.supabaseId == devId || d.tuyaDeviceId == devId) {
        d.name = name;
        break;
      }
    }
  } else if (cmd.kind == "assignRole") {
    const String devId = doc["device_id"].as<String>();
    const String role  = doc["role"].as<String>();
    HUB_TRACE_CMD("assignRole id=%s role=%s", devId.c_str(), role.c_str());
    for (auto& d : _devices) {
      if (d.supabaseId == devId || d.tuyaDeviceId == devId) {
        d.role = role;
        break;
      }
    }
  }
  // setStage / setPhotoperiod are scene-scoped and currently ignored here --
  // the phone edits the scene row in Supabase, which Realtime mirrors to us
  // via onSceneChange.
}

}  // namespace growmie
