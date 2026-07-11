// growmie-hub  --  ESP32-S3 always-on grow-room controller.
//
// Boot sequence:
//   1. Load HubConfig from NVS.
//   2. Connect WiFi (or run captive portal on first boot / bad creds).
//   3. Bring up the LAN-only LocalTuya client (UDP discovery listener).
//   4. Bring up Supabase REST + Realtime clients.
//   5. Enter main loop: poll devices on LAN, run climate evaluator, publish
//      DPs, stream telemetry + state + events into Supabase, drain commands.
//
// Operational invariants:
//   - Internet outages do not stop control. The climate loop keeps running
//     and Supabase writes accumulate in a small RAM ring buffer until
//     connectivity returns.
//   - LAN outages do not stop telemetry: devices remember their pending
//     state and resume on the next discovery broadcast.
//   - No local persistence beyond NVS config.

#include <Arduino.h>
#include <time.h>
#include <WiFi.h>

#include "../include/hub_build_config.h"

#include "burst.h"
#include "climate.h"
#include "config_store.h"
#include "local_tuya.h"
#include "ring_buffer.h"
#include "supabase_client.h"
#include "wifi_provision.h"

namespace growmie {

ConfigStore        gStore;
HubConfig          gCfg;
LocalTuya          gTuya;
SupabaseClient     gSupabase;
ClimateController  gClimate;
BurstController    gBurst;
RingBuffer         gRetry;

constexpr uint32_t kTickIntervalMs    = 5 * 1000;           // 5 s sensor/outlet poll
constexpr uint32_t kRefreshIntervalMs = 30 * 1000;          // 30 s devices/scenes refresh
constexpr uint32_t kHeartbeatIntervalMs = 60 * 1000;        // 1 min hub heartbeat
uint32_t           gLastTickMs        = 0;
uint32_t           gLastRefreshMs     = 0;
uint32_t           gLastHeartbeatMs   = 0;

// Serial console parser. Currently only `reset` is recognised; useful when
// the user needs to wipe creds without holding the BOOT button.
void pollSerial() {
  static String buf;
  while (Serial.available()) {
    const int c = Serial.read();
    if (c == '\n' || c == '\r') {
      buf.trim();
      if (buf.equalsIgnoreCase("reset") || buf.equalsIgnoreCase("growmie-hub reset")) {
        resetProvisioning(gStore);
      } else if (buf.equalsIgnoreCase("status")) {
        Serial.printf("wifi=%s ip=%s ltuya=%s supabase=%s hub=%s\n",
                      WiFi.isConnected() ? "up" : "down",
                      WiFi.localIP().toString().c_str(),
                      gTuya.isReady() ? "ready" : "init",
                      gSupabase.isReady() ? "ready" : "init",
                      gCfg.hubId.c_str());
      }
      buf = "";
    } else if (c >= 0) {
      buf += static_cast<char>(c);
    }
  }
}

void runTick() {
  std::vector<SensorSample> freshSamples;
  std::vector<OutletEvent>  freshEvents;
  AutomationDecision         freshDecision;
  ControllerStateSnapshot    snapshot;

  if (gClimate.knownDevices().empty()) {
    gSupabase.drainCommands([&](const Command& c) {
      gClimate.handleCommand(c, gTuya, gBurst);
      gSupabase.ackCommand(c.id, /*ok=*/true, /*err=*/"");
    });
    return;
  }

  // 1. Pull live status from each device on the LAN (sensor + outlets).
  if (!gTuya.pollAll(gClimate.knownDevices(), freshSamples, snapshot)) {
    gClimate.recordError("local tuya poll failed");
  }

  // 2. Push the most recent reading into the climate evaluator.
  gClimate.applyFreshSamples(freshSamples);

  // 3. Run the evaluator + burst cycler -> outlet commands.
  const auto cmds = gClimate.evaluate(freshDecision);
  gBurst.apply(cmds, gClimate.knownDevices(), gTuya, freshEvents, snapshot);

  // 4. Update the snapshot with whatever the climate evaluator just decided.
  gClimate.fillSnapshot(snapshot);

  // 5. Stream everything into Supabase. Failures get retried via gRetry.
  for (const auto& s : freshSamples) {
    if (!gSupabase.insertSample(s)) gRetry.pushSample(s);
  }
  for (const auto& e : freshEvents) {
    if (!gSupabase.insertOutletEvent(e)) gRetry.pushEvent(e);
  }
  if (!freshDecision.decisionJson.isEmpty()) {
    if (!gSupabase.insertDecision(freshDecision)) gRetry.pushDecision(freshDecision);
  }
  gSupabase.upsertControllerState(gCfg.hubId, snapshot);

  // 6. Drain anything that was waiting on a flaky connection.
  gRetry.flushInto(gSupabase);

  // 7. Process any commands the phone wrote since last tick.
  gSupabase.drainCommands([&](const Command& c) {
    gClimate.handleCommand(c, gTuya, gBurst);
    gSupabase.ackCommand(c.id, /*ok=*/true, /*err=*/"");
  });
}

}  // namespace growmie

void setup() {
  Serial.begin(115200);
  delay(250);
  Serial.println("\n[hub] growmie-hub fw " GROW_HUB_FW_VERSION);

  growmie::gStore.load(growmie::gCfg);
  growmie::applyWifiCompileDefaults(growmie::gCfg);
  growmie::applyHubCompileDefaults(growmie::gCfg);

  if (!growmie::ensureWifiAndConfig(growmie::gCfg, growmie::gStore)) {
    return;  // ensure*() will reboot if it returns false
  }

  configTime(0, 0, "pool.ntp.org", "time.google.com");
  // SNTP is no longer required for protocol signing (Local Tuya has no
  // wall-clock dependency), but Supabase rows want sane timestamps. Wait up
  // to ~5 s for SNTP to land — best-effort, not blocking.
  {
    const uint32_t deadline = millis() + 5000;
    while (time(nullptr) < 1700000000 && millis() < deadline) {
      delay(200);
    }
    Serial.printf("[time] epoch=%ld\n", (long)time(nullptr));
  }

  Serial.println("[setup] init local tuya");
  growmie::gTuya.begin(growmie::gCfg);
  Serial.println("[setup] init supabase");
  growmie::gSupabase.begin(growmie::gCfg);
  Serial.println("[setup] first heartbeat");
  const bool hb = growmie::gSupabase.touchHubHeartbeat();
  Serial.printf("[setup] heartbeat=%d\n", hb);
  Serial.println("[setup] init climate");
  growmie::gClimate.begin(growmie::gCfg, growmie::gSupabase);
  Serial.println("[setup] init burst");
  growmie::gBurst.begin(growmie::gCfg);
  growmie::gSupabase.subscribeCommands();
  Serial.println("[setup] entering loop");

  growmie::gLastTickMs = millis() - growmie::kTickIntervalMs;  // first tick now
  growmie::gLastHeartbeatMs =
      millis() - growmie::kHeartbeatIntervalMs;  // first heartbeat now too
  growmie::gLastRefreshMs =
      millis() - growmie::kRefreshIntervalMs;    // refresh devices/scenes now
}

void loop() {
  growmie::pollSerial();
  growmie::gSupabase.pump();   // service WS + retry queue
  growmie::gTuya.pumpDiscovery();  // refresh LAN gwId -> ip cache

  const uint32_t now = millis();
  if (now - growmie::gLastTickMs >= growmie::kTickIntervalMs) {
    growmie::gLastTickMs = now;
    growmie::runTick();
  }
  if (now - growmie::gLastRefreshMs >= growmie::kRefreshIntervalMs) {
    growmie::gLastRefreshMs = now;
    growmie::gClimate.refreshFromSupabase(growmie::gSupabase);
  }
  if (now - growmie::gLastHeartbeatMs >= growmie::kHeartbeatIntervalMs) {
    growmie::gLastHeartbeatMs = now;
    growmie::gSupabase.touchHubHeartbeat();
  }
  delay(50);
}
