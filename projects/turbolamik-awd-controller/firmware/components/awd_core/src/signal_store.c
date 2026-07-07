#include "signal_store.h"

#include <string.h>

void signal_store_init(live_snapshot_t *snapshot) {
  memset(snapshot, 0, sizeof(*snapshot));
}

void signal_store_update(
  live_snapshot_t *snapshot,
  awd_signal_id_t signal,
  float value,
  uint32_t timestamp_ms,
  uint32_t timeout_ms,
  awd_signal_source_t source
) {
  snapshot->signals[signal].value = value;
  snapshot->signals[signal].timestamp_ms = timestamp_ms;
  snapshot->signals[signal].timeout_ms = timeout_ms;
  snapshot->signals[signal].valid = true;
  snapshot->signals[signal].source = source;
}

const signal_value_t *signal_store_get(const live_snapshot_t *snapshot, awd_signal_id_t signal) {
  return &snapshot->signals[signal];
}

void signal_store_refresh_validity(live_snapshot_t *snapshot, uint32_t now_ms) {
  size_t i;

  for(i = 0; i < AWD_SIGNAL_COUNT; ++i) {
    signal_value_t *value = &snapshot->signals[i];

    if(value->valid && value->timeout_ms > 0U) {
      if((now_ms - value->timestamp_ms) > value->timeout_ms) {
        value->valid = false;
      }
    }
  }
}
