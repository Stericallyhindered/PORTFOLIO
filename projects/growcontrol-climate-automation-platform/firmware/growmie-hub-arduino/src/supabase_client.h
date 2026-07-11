#pragma once

#include <Arduino.h>
#include <functional>
#include <utility>
#include <vector>

#include "../include/types.h"
#include "config_store.h"

namespace growmie {

class SupabaseClient {
 public:
  void begin(const HubConfig& cfg);

  bool isReady() const { return _ready; }

  void pump();

  bool listDevices(std::vector<Device>& out);
  bool listScenes(std::vector<Scene>& out);

  bool insertSample(const SensorSample& s);
  bool insertOutletEvent(const OutletEvent& e);
  bool insertDecision(const AutomationDecision& d);
  bool upsertControllerState(const String& hubId,
                             const ControllerStateSnapshot& snap);
  bool ackCommand(const String& commandId, bool ok, const String& err);
  bool touchHubHeartbeat();

  using CommandHandler = std::function<void(const Command&)>;
  void subscribeCommands();
  void drainCommands(const CommandHandler& cb);

  using SceneHandler = std::function<void(const Scene&)>;
  void onSceneChange(const SceneHandler& cb) { _sceneCb = cb; }

 private:
  std::vector<std::pair<String, String>> authHeaders() const {
    return {
        {"apikey", _apiKey},
        {"Authorization", String("Bearer ") + _authBearer},
    };
  }

  String _baseUrl;
  /// PostgREST `apikey` header — anon key, or service_role when using that mode.
  String _apiKey;
  /// Raw JWT / service_role string (without `Bearer ` prefix).
  String _authBearer;
  String _hubId;
  bool   _ready = false;
  SceneHandler _sceneCb;
};

}  // namespace growmie
