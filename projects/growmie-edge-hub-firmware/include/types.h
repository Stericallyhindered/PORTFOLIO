#pragma once

// Shared data types used across the hub firmware. Field names mirror the
// Postgres columns 1:1 so JSON (de)serialisation is mechanical.

#include <Arduino.h>
#include <map>
#include <vector>

namespace growmie {

struct Device {
  String supabaseId;     // uuid in `devices.id`
  String tuyaDeviceId;   // gwId — Tuya's per-device id on the LAN
  String name;
  String role;           // humidifier / dehumidifier / canopySensor / ...
  String kind;           // smartOutlet / tempHumiditySensor
  bool   online = false;

  // Local Tuya bits. local_key is the AES-128 secret extracted via
  // `tinytuya wizard`; ip is a hint refreshed by the hub's UDP discovery
  // listener; protocolVersion is "3.3" (default) or "3.4"; dpMap is an
  // optional friendly-name -> DP id override (e.g. {"switch":"1"}).
  String localKey;
  String ip;
  String protocolVersion = "3.3";
  std::map<String, String> dpMap;
};

struct SensorSample {
  uint64_t tsMs;         // millis since boot when sample captured
  String   deviceId;     // Supabase uuid of the source device (may be empty)
  float    tempC = NAN;
  float    rhPct = NAN;
  float    vpdKpa = NAN;
};

struct OutletEvent {
  uint64_t tsMs;
  String   deviceId;
  bool     isOn = false;
  String   reason;
  String   source;       // auto / manual / burst / rule
  String   role;
};

struct AutomationDecision {
  uint64_t tsMs;
  String   zone;
  String   notes;
  // JSON payload representing the climate evaluator's full output.
  String   decisionJson;
};

struct ControllerStateSnapshot {
  bool     humRelayOn = false;
  bool     dehuRelayOn = false;
  String   humBurstPhase;     // on / cooldown / idle
  uint32_t humBurstRemainingMs = 0;
  String   dehuBurstPhase;
  uint32_t dehuBurstRemainingMs = 0;
  bool     humDesired = false;
  bool     dehuDesired = false;
  float    lastTempC = NAN;
  float    lastRhPct = NAN;
  float    lastVpdKpa = NAN;
  uint64_t lastTickMs = 0;
  String   lastError;
  std::vector<String> activeSceneIds;
  std::vector<String> manualHeldIds;
};

struct SceneRule {
  String  metric;        // temp / rh / vpd
  String  comparator;    // gt / lt / between
  float   value1 = NAN;
  float   value2 = NAN;
  String  deviceId;      // Supabase uuid the rule targets
  bool    desiredOn = false;
};

struct Scene {
  String  id;
  String  name;
  String  stageOverride;
  String  photoperiodOverride;
  std::vector<String> memberDeviceIds;
  std::vector<SceneRule> rules;
  bool    active = false;
  int     activeOrder = 0;
};

struct Command {
  String  id;
  String  kind;
  String  payloadJson;
  String  status;
  uint64_t requestedAtMs = 0;
};

}  // namespace growmie
