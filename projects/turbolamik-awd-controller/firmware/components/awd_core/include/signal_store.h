#ifndef SIGNAL_STORE_H
#define SIGNAL_STORE_H

#include "awd_types.h"

void signal_store_init(live_snapshot_t *snapshot);
void signal_store_update(
  live_snapshot_t *snapshot,
  awd_signal_id_t signal,
  float value,
  uint32_t timestamp_ms,
  uint32_t timeout_ms,
  awd_signal_source_t source
);
const signal_value_t *signal_store_get(const live_snapshot_t *snapshot, awd_signal_id_t signal);
void signal_store_refresh_validity(live_snapshot_t *snapshot, uint32_t now_ms);

#endif
