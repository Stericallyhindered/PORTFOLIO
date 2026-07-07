#include "ble_service.h"
#include "can_rx.h"
#include "derived_metrics.h"
#include "health_watchdog.h"
#include "raw_log_buffer.h"
#include "signal_store.h"
#include "vehicle_profile.h"

#include <string.h>

/*
 * This is a minimal ESP-IDF entrypoint that wires together the Phase 1
 * decoder pipeline. Hardware-specific TWAI RX/TX and NimBLE integration are
 * intentionally left to the board bring-up layer once the toolchain and
 * hardware are available.
 */

void app_main(void) {
  live_snapshot_t snapshot;
  raw_log_buffer_t raw_log;
  health_watchdog_t health;
  capture_control_t capture;
  ble_service_t ble;
  can_rx_context_t can_rx;

  signal_store_init(&snapshot);
  raw_log_buffer_init(&raw_log);
  health_watchdog_init(&health);

  memset(&capture, 0, sizeof(capture));
  capture.max_frames = AWD_RAW_LOG_CAPACITY;
  capture.filter_mode = CAPTURE_FILTER_PHASE1_IDS;

  ble_service_init(&ble);
  can_rx_init(&can_rx, &snapshot, &raw_log, &health, &capture, &E90_TURBOLAMIK_PHASE1_PROFILE);

  /*
   * Runtime integration notes:
   * - Feed each TWAI frame into can_rx_process_frame().
   * - Call signal_store_refresh_validity(), derived_metrics_compute(), and
   *   ble_service_publish_snapshot() on a 10-20ms timer.
   * - Expose raw capture controls through BLE/GATT commands.
   */
  (void)ble;
  (void)can_rx;
}
