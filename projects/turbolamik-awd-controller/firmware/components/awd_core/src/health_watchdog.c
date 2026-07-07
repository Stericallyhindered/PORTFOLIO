#include "health_watchdog.h"

#include "signal_store.h"

#include <string.h>

static bool is_signal_stale(const signal_value_t *value, uint32_t now_ms) {
  if(!value->valid) {
    return true;
  }

  if(value->timeout_ms == 0U) {
    return false;
  }

  return (now_ms - value->timestamp_ms) > value->timeout_ms;
}

void health_watchdog_init(health_watchdog_t *watchdog) {
  memset(watchdog, 0, sizeof(*watchdog));
}

void health_watchdog_record_frame(health_watchdog_t *watchdog, uint32_t id, bool decoded, uint32_t timestamp_ms) {
  watchdog->status.total_frames += 1U;
  watchdog->status.last_can_rx_ms = timestamp_ms;

  if(id >= 0x720U && id <= 0x723U) {
    watchdog->status.turbolamik_frames += 1U;
  }

  if(id == 0x0AAU || id == 0x0CEU || id == 0x0C8U || id == 0x19EU || id == 0x1A6U || id == 0x1B4U ||
     id == 0x34FU || id == 0x130U || id == 0x24AU || id == 0x3B0U) {
    watchdog->status.e90_frames += 1U;
  }

  if(!decoded) {
    watchdog->status.decoder_errors += 1U;
  }
}

void health_watchdog_set_capture(health_watchdog_t *watchdog, bool enabled) {
  watchdog->status.capture_enabled = enabled;
}

void health_watchdog_set_ble(health_watchdog_t *watchdog, bool connected) {
  watchdog->status.ble_connected = connected;
}

void health_watchdog_refresh(health_watchdog_t *watchdog, const live_snapshot_t *snapshot, uint32_t now_ms) {
  watchdog->status.uptime_ms = now_ms;
  watchdog->status.stale_turbolamik =
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_GEAR_CURRENT), now_ms) ||
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_LOCKUP_PCT), now_ms) ||
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_INPUT_SHAFT_RPM), now_ms);
  watchdog->status.stale_wheel_speeds =
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_FL), now_ms) ||
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_FR), now_ms) ||
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_RL), now_ms) ||
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_RR), now_ms);
  watchdog->status.stale_steering =
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_STEERING_ANGLE), now_ms);
  watchdog->status.stale_vehicle_rpm =
    is_signal_stale(signal_store_get(snapshot, AWD_SIGNAL_ENGINE_RPM), now_ms);
}

const health_status_t *health_watchdog_status(const health_watchdog_t *watchdog) {
  return &watchdog->status;
}
