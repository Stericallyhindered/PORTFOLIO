#include "turbolamik_decoder.h"

#include "signal_store.h"

static uint16_t be_u16(const uint8_t *bytes) {
  return (uint16_t)(((uint16_t)bytes[0] << 8U) | bytes[1]);
}

static int16_t be_s16(const uint8_t *bytes) {
  return (int16_t)be_u16(bytes);
}

bool turbolamik_decoder_process(live_snapshot_t *snapshot, const raw_can_frame_t *frame) {
  switch(frame->id) {
    case 0x720U:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_TORQUE_REDUCTION_PCT,
        (float)frame->data[4] * 0.5f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_TORQUE_REDUCTION_ACTIVE,
        (frame->data[5] & 0x01U) ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_SHIFT_ACTIVE,
        (frame->data[5] & 0x40U) ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      return true;

    case 0x721U:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_GEAR_CURRENT,
        (float)((int8_t)frame->data[0]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_GEAR_TARGET,
        (float)((int8_t)frame->data[1]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_WHEEL_TORQUE_NM,
        (float)be_s16(&frame->data[4]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      return true;

    case 0x722U:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_GEARBOX_PROGRAM,
        (float)frame->data[0],
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_SLOW_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_GEARBOX_MODE,
        (float)frame->data[1],
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_SLOW_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_LOCKUP_PCT,
        (float)frame->data[2] * 0.4f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_SLOW_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_GEARBOX_OIL_TEMP_C,
        (float)((int)frame->data[3] - 40),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_SLOW_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_VEHICLE_SPEED,
        (float)be_u16(&frame->data[4]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_SLOW_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      return true;

    case 0x723U:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_CLUTCH_SLIP_PCT,
        (float)be_s16(&frame->data[0]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_CONVERTER_SLIP_PCT,
        (float)be_s16(&frame->data[2]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_INPUT_SHAFT_RPM,
        (float)be_u16(&frame->data[4]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_OUTPUT_SHAFT_RPM,
        (float)be_u16(&frame->data[6]),
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN
      );
      return true;

    default:
      return false;
  }
}
