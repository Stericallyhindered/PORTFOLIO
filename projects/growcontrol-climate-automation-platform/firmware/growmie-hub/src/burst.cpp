// C++ port of the duty-cycle / burst controller in
// lib/state/grow_room_controller.dart (_BurstState + _setBurstDesired +
// _onBurstPhaseEnd + _publishBurstChange).
//
// Difference from the Dart version: the phone uses dart:async Timers; on the
// MCU we drive everything off the main loop's wall-clock instead. Same state
// machine and same defaults (30 s ON pulse, 2:30 cool-down).

#include "burst.h"

#include <time.h>

#include "local_tuya.h"

namespace growmie {

namespace {

OutletEvent makeEvent(const String& deviceId, const String& role, bool on,
                      const String& reason, const String& source = "burst") {
  OutletEvent e;
  e.tsMs   = (uint64_t)time(nullptr) * 1000ULL;
  e.deviceId = deviceId;
  e.isOn   = on;
  e.reason = reason;
  e.source = source;
  e.role   = role;
  return e;
}

const Device* findByTuyaId(const std::vector<Device>& devices,
                           const String& tuyaId) {
  for (const auto& d : devices) {
    if (d.tuyaDeviceId == tuyaId) return &d;
  }
  return nullptr;
}

// Publish the relay change to the LAN device + emit an outlet event for the
// Supabase pipeline. Idempotent on the actual relay state.
void publishChange(BurstController::State& s, const String& tuyaDeviceId,
                   const std::vector<Device>& devices, LocalTuya& tuya,
                   bool on, const String& reason,
                   std::vector<OutletEvent>& outEvents) {
  if (s.relayOn == on) return;
  s.relayOn = on;
  const Device* d = findByTuyaId(devices, tuyaDeviceId);
  if (d) tuya.publishSwitch(*d, on);
  const String pk =
      s.supabaseId.length() > 0 ? s.supabaseId : tuyaDeviceId;
  outEvents.push_back(makeEvent(pk, s.role, on, reason));
}

}  // namespace

void BurstController::begin(const HubConfig& cfg) {
  _onMs  = cfg.burstOnSec  * 1000;
  _offMs = cfg.burstOffSec * 1000;
}

void BurstController::apply(const std::vector<OutletCommand>& commands,
                            const std::vector<Device>& devices,
                            LocalTuya& tuya,
                            std::vector<OutletEvent>& outEvents,
                            ControllerStateSnapshot& outSnapshot) {
  const uint32_t now = millis();

  // 1. Update desired state from the latest evaluator output. Manual-held
  //    entries still record intent but don't fire pulses.
  for (const auto& cmd : commands) {
    auto& s = _byDevice[cmd.tuyaDeviceId];
    s.role        = cmd.role;
    s.supabaseId  = cmd.supabaseId;
    s.desired = cmd.desiredOn;
    if (s.manualHeld) {
      // user has the wheel; remember intent for resume
      continue;
    }
    if (!cmd.desiredOn) {
      if (s.phase != State::Phase::Idle) {
        s.phase = State::Phase::Idle;
        s.phaseStartedMs = 0;
      }
      if (s.relayOn) {
        publishChange(s, cmd.tuyaDeviceId, devices, tuya, false,
                      cmd.reason + " - burst end (climate satisfied)", outEvents);
      }
      continue;
    }
    // Wants ON. If we're not already cycling, start a new ON pulse.
    if (s.phase == State::Phase::Idle && !s.relayOn) {
      publishChange(s, cmd.tuyaDeviceId, devices, tuya, true,
                    cmd.reason + " - pulse ON", outEvents);
      s.phase = State::Phase::On;
      s.phaseStartedMs = now;
    } else if (s.phase == State::Phase::Idle && s.relayOn) {
      // Already on (e.g. carry-over from manual). Schedule the cool-down so
      // we don't run forever.
      s.phase = State::Phase::On;
      s.phaseStartedMs = now;
    }
  }

  // 2. Advance phase timers.
  for (auto& [tuyaId, s] : _byDevice) {
    if (s.manualHeld) continue;
    if (s.phase == State::Phase::On) {
      if (now - s.phaseStartedMs >= _onMs) {
        // ON phase ended → cool-down.
        publishChange(s, tuyaId, devices, tuya, false,
                      "burst - cool-down", outEvents);
        s.phase = State::Phase::Cooldown;
        s.phaseStartedMs = now;
      }
    } else if (s.phase == State::Phase::Cooldown) {
      if (now - s.phaseStartedMs >= _offMs) {
        if (s.desired) {
          publishChange(s, tuyaId, devices, tuya, true,
                        "burst - pulse ON", outEvents);
          s.phase = State::Phase::On;
          s.phaseStartedMs = now;
        } else {
          s.phase = State::Phase::Idle;
          s.phaseStartedMs = 0;
        }
      }
    }
  }

  // 3. Reflect into the snapshot for Supabase.
  for (const auto& [tuyaId, s] : _byDevice) {
    const uint32_t remaining = (s.phase == State::Phase::On)
        ? (_onMs - (now - s.phaseStartedMs))
        : (s.phase == State::Phase::Cooldown)
            ? (_offMs - (now - s.phaseStartedMs))
            : 0;
    const char* phaseName = (s.phase == State::Phase::On)
        ? "on"
        : (s.phase == State::Phase::Cooldown) ? "cooldown" : "idle";
    if (s.role == "humidifier") {
      outSnapshot.humRelayOn          = s.relayOn;
      outSnapshot.humBurstPhase       = phaseName;
      outSnapshot.humBurstRemainingMs = remaining;
    } else if (s.role == "dehumidifier") {
      outSnapshot.dehuRelayOn          = s.relayOn;
      outSnapshot.dehuBurstPhase       = phaseName;
      outSnapshot.dehuBurstRemainingMs = remaining;
    }
  }
}

void BurstController::hold(const String& tuyaDeviceId, bool on,
                           const String& supabaseDeviceId) {
  auto& s = _byDevice[tuyaDeviceId];
  s.manualHeld = true;
  s.relayOn    = on;
  s.phase      = State::Phase::Idle;
  s.phaseStartedMs = 0;
  if (supabaseDeviceId.length() > 0) s.supabaseId = supabaseDeviceId;
}

void BurstController::release(const String& tuyaDeviceId) {
  auto it = _byDevice.find(tuyaDeviceId);
  if (it == _byDevice.end()) return;
  it->second.manualHeld = false;
}

}  // namespace growmie
