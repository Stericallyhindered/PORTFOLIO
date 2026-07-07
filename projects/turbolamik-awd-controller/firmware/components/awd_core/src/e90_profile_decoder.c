#include "e90_profile_decoder.h"

#include "signal_store.h"

static uint16_t le_u16(const uint8_t *bytes) {
  return (uint16_t)(bytes[0] | ((uint16_t)bytes[1] << 8U));
}

static int16_t le_s16(const uint8_t *bytes) {
  return (int16_t)le_u16(bytes);
}

bool e90_profile_decoder_process(live_snapshot_t *snapshot, const raw_can_frame_t *frame) {
  switch(frame->id) {
    case 0x0AAU:
      /*
       * Confirmed from BN2000 references:
       * - Byte 3: TPS in 0.39063% steps
       * - Bytes 4-5: Engine RPM in 0.25rpm steps (little-endian)
       */
      signal_store_update(
        snapshot,
        AWD_SIGNAL_THROTTLE_PCT,
        (float)frame->data[3] * 0.39063f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_ENGINE_RPM,
        (float)le_u16(&frame->data[4]) * 0.25f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;

    case 0x0CEU:
      /*
       * Confirmed from BN2000 references:
       * each pair is little-endian wheel speed in 0.0625km/h units.
       */
      signal_store_update(snapshot, AWD_SIGNAL_WHEEL_SPEED_FL, (float)le_u16(&frame->data[0]) * 0.0625f,
        frame->timestamp_ms, AWD_SIGNAL_TIMEOUT_FAST_MS, AWD_SIGNAL_SOURCE_VEHICLE_CAN);
      signal_store_update(snapshot, AWD_SIGNAL_WHEEL_SPEED_FR, (float)le_u16(&frame->data[2]) * 0.0625f,
        frame->timestamp_ms, AWD_SIGNAL_TIMEOUT_FAST_MS, AWD_SIGNAL_SOURCE_VEHICLE_CAN);
      signal_store_update(snapshot, AWD_SIGNAL_WHEEL_SPEED_RL, (float)le_u16(&frame->data[4]) * 0.0625f,
        frame->timestamp_ms, AWD_SIGNAL_TIMEOUT_FAST_MS, AWD_SIGNAL_SOURCE_VEHICLE_CAN);
      signal_store_update(snapshot, AWD_SIGNAL_WHEEL_SPEED_RR, (float)le_u16(&frame->data[6]) * 0.0625f,
        frame->timestamp_ms, AWD_SIGNAL_TIMEOUT_FAST_MS, AWD_SIGNAL_SOURCE_VEHICLE_CAN);
      return true;

    case 0x0C8U:
      /*
       * Provisional: steering angle is treated as signed little-endian with a
       * 0.1deg scale pending in-car validation.
       */
      signal_store_update(
        snapshot,
        AWD_SIGNAL_STEERING_ANGLE,
        (float)le_s16(&frame->data[0]) * 0.1f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;

    case 0x19EU: {
      /*
       * Provisional brake-force proxy derived from the most dynamic bytes in
       * the DSC state frame. This should be validated against live braking data.
       */
      float brake_proxy = (float)(frame->data[1] + frame->data[2]) * 0.5f;
      signal_store_update(
        snapshot,
        AWD_SIGNAL_BRAKE_PRESSURE_PROXY,
        brake_proxy,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      signal_store_update(
        snapshot,
        AWD_SIGNAL_BRAKE_ACTIVE,
        brake_proxy > 1.0f ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;
    }

    case 0x130U:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_BRAKE_ACTIVE,
        signal_store_get(snapshot, AWD_SIGNAL_BRAKE_ACTIVE)->valid
          ? signal_store_get(snapshot, AWD_SIGNAL_BRAKE_ACTIVE)->value
          : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_FAST_MS,
        AWD_SIGNAL_SOURCE_SYSTEM
      );
      return true;

    case 0x1A6U:
      /*
       * Instrument-cluster speed encoding is not yet validated. We currently
       * rely on TurboLamik vehicle speed for normalized output and just treat
       * this frame as presence/health evidence.
       */
      return true;

    case 0x1B4U:
      /*
       * Provisional handbrake extraction. This should be checked against a live
       * capture before it is used for control decisions.
       */
      signal_store_update(
        snapshot,
        AWD_SIGNAL_HANDBRAKE_ACTIVE,
        frame->data[7] == 0x91U ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;

    case 0x34FU:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_HANDBRAKE_ACTIVE,
        frame->data[0] == 0xFEU ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;

    case 0x24AU:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_REVERSE_ACTIVE,
        frame->data[0] == 0x06U ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;

    case 0x3B0U:
      signal_store_update(
        snapshot,
        AWD_SIGNAL_REVERSE_ACTIVE,
        frame->data[0] == 0xFDU ? 1.0f : 0.0f,
        frame->timestamp_ms,
        AWD_SIGNAL_TIMEOUT_MEDIUM_MS,
        AWD_SIGNAL_SOURCE_VEHICLE_CAN
      );
      return true;

    case 0x0A8U:
    case 0x1D0U:
      return true;

    default:
      return false;
  }
}
