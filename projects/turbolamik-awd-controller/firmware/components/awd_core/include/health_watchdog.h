#ifndef HEALTH_WATCHDOG_H
#define HEALTH_WATCHDOG_H

#include "awd_types.h"

typedef struct {
  health_status_t status;
} health_watchdog_t;

void health_watchdog_init(health_watchdog_t *watchdog);
void health_watchdog_record_frame(health_watchdog_t *watchdog, uint32_t id, bool decoded, uint32_t timestamp_ms);
void health_watchdog_set_capture(health_watchdog_t *watchdog, bool enabled);
void health_watchdog_set_ble(health_watchdog_t *watchdog, bool connected);
void health_watchdog_refresh(health_watchdog_t *watchdog, const live_snapshot_t *snapshot, uint32_t now_ms);
const health_status_t *health_watchdog_status(const health_watchdog_t *watchdog);

#endif
