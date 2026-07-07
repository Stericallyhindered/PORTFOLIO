#ifndef CAN_RX_H
#define CAN_RX_H

#include "awd_types.h"
#include "health_watchdog.h"
#include "raw_log_buffer.h"
#include "vehicle_profile.h"

typedef struct {
  live_snapshot_t *snapshot;
  raw_log_buffer_t *raw_log;
  health_watchdog_t *health;
  capture_control_t *capture;
  const vehicle_profile_t *profile;
} can_rx_context_t;

void can_rx_init(
  can_rx_context_t *context,
  live_snapshot_t *snapshot,
  raw_log_buffer_t *raw_log,
  health_watchdog_t *health,
  capture_control_t *capture,
  const vehicle_profile_t *profile
);
bool can_rx_process_frame(can_rx_context_t *context, const raw_can_frame_t *frame);

#endif
