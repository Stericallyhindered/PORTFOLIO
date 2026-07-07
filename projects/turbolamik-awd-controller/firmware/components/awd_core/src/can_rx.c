#include "can_rx.h"

#include "derived_metrics.h"
#include "e90_profile_decoder.h"
#include "signal_store.h"
#include "turbolamik_decoder.h"

static bool should_capture(const can_rx_context_t *context, const raw_can_frame_t *frame) {
  if(!context->capture->enabled) {
    return false;
  }

  if(context->capture->frames_captured >= context->capture->max_frames) {
    return false;
  }

  if(context->capture->filter_mode == CAPTURE_FILTER_ALL) {
    return true;
  }

  return vehicle_profile_contains_id(context->profile, frame->id);
}

void can_rx_init(
  can_rx_context_t *context,
  live_snapshot_t *snapshot,
  raw_log_buffer_t *raw_log,
  health_watchdog_t *health,
  capture_control_t *capture,
  const vehicle_profile_t *profile
) {
  context->snapshot = snapshot;
  context->raw_log = raw_log;
  context->health = health;
  context->capture = capture;
  context->profile = profile;
}

bool can_rx_process_frame(can_rx_context_t *context, const raw_can_frame_t *frame) {
  bool decoded = false;

  if(should_capture(context, frame)) {
    raw_log_buffer_push(context->raw_log, frame);
    context->capture->frames_captured += 1U;
  }

  decoded = e90_profile_decoder_process(context->snapshot, frame);

  if(!decoded) {
    decoded = turbolamik_decoder_process(context->snapshot, frame);
  }

  signal_store_refresh_validity(context->snapshot, frame->timestamp_ms);
  derived_metrics_compute(context->snapshot);
  health_watchdog_record_frame(context->health, frame->id, decoded, frame->timestamp_ms);
  health_watchdog_set_capture(context->health, context->capture->enabled);
  health_watchdog_refresh(context->health, context->snapshot, frame->timestamp_ms);
  return decoded;
}
