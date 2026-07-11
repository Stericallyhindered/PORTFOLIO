#pragma once

#include <Arduino.h>
#include <map>
#include <vector>

#include "../include/types.h"
#include "climate.h"
#include "config_store.h"

namespace growmie {

class LocalTuya;

// C++ port of the Dart `_BurstState` / `_setBurstDesired` / `_publishBurstChange`
// trio in lib/state/grow_room_controller.dart. Same defaults (30 s pulse,
// 2:30 cool-down) and same desired-vs-relay split so the learning model in
// climate.cpp sees one steady ON window per climate decision.
class BurstController {
 public:
  void begin(const HubConfig& cfg);

  uint32_t onDurationMs()  const { return _onMs; }
  uint32_t offDurationMs() const { return _offMs; }
  void setDurations(uint32_t onMs, uint32_t offMs) {
    _onMs = onMs;
    _offMs = offMs;
  }

  // Drives each commanded outlet through a pulse cycle if it should be on,
  // or off immediately if it shouldn't. Newly-published transitions are
  // appended to [outEvents] for the Supabase pipeline. The full `devices`
  // list is needed so we can resolve LAN keys / ips when publishing.
  void apply(const std::vector<OutletCommand>& commands,
             const std::vector<Device>& devices,
             LocalTuya& tuya,
             std::vector<OutletEvent>& outEvents,
             ControllerStateSnapshot& outSnapshot);

  // Per-device cycle state. Public so the anonymous-namespace helper in
  // burst.cpp can take a reference to it; it's not part of the stable API.
  struct State {
    String role;
    String supabaseId;   // devices.id for outlet_events (FK)
    bool   desired = false;
    bool   relayOn = false;
    uint32_t phaseStartedMs = 0;
    enum class Phase { Idle, On, Cooldown } phase = Phase::Idle;
    bool   manualHeld = false;
  };

  // Phone-side manual override -- pins the relay to [on] until [release].
  void hold(const String& tuyaDeviceId, bool on,
            const String& supabaseDeviceId = "");
  void release(const String& tuyaDeviceId);

 private:
  uint32_t _onMs  = 30 * 1000;
  uint32_t _offMs = 150 * 1000;
  std::map<String, State> _byDevice;  // key = tuya_device_id
};

}  // namespace growmie
