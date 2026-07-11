#pragma once

#include <Arduino.h>
#include <map>
#include <vector>

#include "../include/types.h"
#include "config_store.h"

namespace growmie {

class SupabaseClient;
class LocalTuya;
class BurstController;

// Per-device outlet command emitted by the climate evaluator each tick.
struct OutletCommand {
  String role;          // humidifier / dehumidifier / ...
  String supabaseId;    // devices.id
  String tuyaDeviceId;
  bool   desiredOn = false;
  String reason;
};

// Port of GrowRoomController / SceneRulesEvaluator from the Flutter app.
// Fills out in Phase 3d; the header surface is enough for main.cpp to
// compile today.
class ClimateController {
 public:
  void begin(const HubConfig& cfg, SupabaseClient& sb);

  // Refresh devices + scenes from Supabase. Called once after begin() and
  // again periodically (every ~5 min) from main.cpp so role / membership
  // edits made on the phone propagate to the hub even though we don't have
  // Realtime wired up yet.
  void refreshFromSupabase(SupabaseClient& sb);

  const std::vector<Device>& knownDevices() const { return _devices; }

  void applyFreshSamples(const std::vector<SensorSample>& samples);

  // Returns the per-device outlet desire for this tick.
  std::vector<OutletCommand> evaluate(AutomationDecision& outDecision);

  void fillSnapshot(ControllerStateSnapshot& snap) const;

  void recordError(const String& msg);

  // Drives in-room responses to phone commands (manual override, scene
  // toggling, role assignment, ...).
  void handleCommand(const Command& cmd, LocalTuya& tuya,
                     BurstController& burst);

 private:
  std::vector<Device>           _devices;
  std::vector<Scene>            _scenes;
  std::vector<String>           _activeSceneIds;
  std::map<String, bool>        _manualHeld;      // device_id -> desired
  float                         _liveTempC = NAN;
  float                         _liveRhPct = NAN;
  float                         _liveVpdKpa = NAN;
  uint64_t                      _lastTickMs = 0;
  String                        _lastError;
  bool                          _humWantPrev = false;
  bool                          _dehuWantPrev = false;
};

}  // namespace growmie
