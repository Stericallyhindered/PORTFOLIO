#include "derived_metrics.h"

#include "signal_store.h"

static float absf(float value) {
  return value < 0.0f ? -value : value;
}

static float clampf(float value, float min_value, float max_value) {
  if(value < min_value) {
    return min_value;
  }
  if(value > max_value) {
    return max_value;
  }
  return value;
}

static float signal_or_zero(const live_snapshot_t *snapshot, awd_signal_id_t id) {
  const signal_value_t *signal = signal_store_get(snapshot, id);
  return signal->valid ? signal->value : 0.0f;
}

void derived_metrics_compute(live_snapshot_t *snapshot) {
  const float wheel_fl = signal_or_zero(snapshot, AWD_SIGNAL_WHEEL_SPEED_FL);
  const float wheel_fr = signal_or_zero(snapshot, AWD_SIGNAL_WHEEL_SPEED_FR);
  const float wheel_rl = signal_or_zero(snapshot, AWD_SIGNAL_WHEEL_SPEED_RL);
  const float wheel_rr = signal_or_zero(snapshot, AWD_SIGNAL_WHEEL_SPEED_RR);
  const float throttle = signal_or_zero(snapshot, AWD_SIGNAL_THROTTLE_PCT);
  const float speed = signal_or_zero(snapshot, AWD_SIGNAL_VEHICLE_SPEED);
  const float steering = signal_or_zero(snapshot, AWD_SIGNAL_STEERING_ANGLE);
  const float gear = signal_or_zero(snapshot, AWD_SIGNAL_GEAR_CURRENT);
  const float shift_active = signal_or_zero(snapshot, AWD_SIGNAL_SHIFT_ACTIVE);
  const float lockup = signal_or_zero(snapshot, AWD_SIGNAL_LOCKUP_PCT);
  const float clutch_slip = signal_or_zero(snapshot, AWD_SIGNAL_CLUTCH_SLIP_PCT);
  const float converter_slip = signal_or_zero(snapshot, AWD_SIGNAL_CONVERTER_SLIP_PCT);
  const float oil_temp = signal_or_zero(snapshot, AWD_SIGNAL_GEARBOX_OIL_TEMP_C);
  const float brake_active = signal_or_zero(snapshot, AWD_SIGNAL_BRAKE_ACTIVE);
  const float handbrake_active = signal_or_zero(snapshot, AWD_SIGNAL_HANDBRAKE_ACTIVE);
  const float reverse_active = signal_or_zero(snapshot, AWD_SIGNAL_REVERSE_ACTIVE);

  snapshot->metrics.front_axle_speed = (wheel_fl + wheel_fr) * 0.5f;
  snapshot->metrics.rear_axle_speed = (wheel_rl + wheel_rr) * 0.5f;
  snapshot->metrics.front_rear_speed_delta =
    snapshot->metrics.rear_axle_speed - snapshot->metrics.front_axle_speed;
  snapshot->metrics.left_right_speed_delta_front = wheel_fl - wheel_fr;
  snapshot->metrics.left_right_speed_delta_rear = wheel_rl - wheel_rr;

  if(snapshot->metrics.front_axle_speed > 1.0f) {
    snapshot->metrics.rear_slip_ratio =
      snapshot->metrics.front_rear_speed_delta / snapshot->metrics.front_axle_speed;
  } else {
    snapshot->metrics.rear_slip_ratio = 0.0f;
  }

  if(snapshot->metrics.rear_axle_speed > 1.0f) {
    snapshot->metrics.front_slip_ratio =
      (snapshot->metrics.front_axle_speed - snapshot->metrics.rear_axle_speed) / snapshot->metrics.rear_axle_speed;
  } else {
    snapshot->metrics.front_slip_ratio = 0.0f;
  }

  snapshot->metrics.turning_state = absf(steering) * (speed / 100.0f);
  snapshot->metrics.drivetrain_state =
    gear * 10.0f + (shift_active * 20.0f) + (lockup * 0.2f) - (absf(clutch_slip) * 0.1f) - (absf(converter_slip) * 0.1f);

  snapshot->shadow.degraded =
    !signal_store_get(snapshot, AWD_SIGNAL_GEAR_CURRENT)->valid ||
    !signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_FL)->valid ||
    !signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_FR)->valid ||
    !signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_RL)->valid ||
    !signal_store_get(snapshot, AWD_SIGNAL_WHEEL_SPEED_RR)->valid;

  snapshot->shadow.base_precharge_pct = clampf(throttle * 0.25f, 0.0f, 30.0f);
  snapshot->shadow.shift_add_pct = shift_active > 0.5f ? 8.0f : 0.0f;
  snapshot->shadow.slip_add_pct = clampf(snapshot->metrics.rear_slip_ratio * 200.0f, 0.0f, 40.0f);
  snapshot->shadow.steering_clamp_pct = clampf(100.0f - (absf(steering) * 0.15f), 25.0f, 100.0f);
  snapshot->shadow.brake_clamp_pct = brake_active > 0.5f ? 20.0f : 100.0f;
  snapshot->shadow.oil_temp_clamp_pct = oil_temp > 125.0f ? 40.0f : 100.0f;

  snapshot->shadow.awd_request_pct =
    snapshot->shadow.base_precharge_pct +
    snapshot->shadow.shift_add_pct +
    snapshot->shadow.slip_add_pct;

  if(handbrake_active > 0.5f || reverse_active > 0.5f) {
    snapshot->shadow.awd_request_pct = 0.0f;
  }

  snapshot->shadow.awd_request_pct = clampf(
    snapshot->shadow.awd_request_pct,
    0.0f,
    snapshot->shadow.steering_clamp_pct
  );
  snapshot->shadow.awd_request_pct = clampf(
    snapshot->shadow.awd_request_pct,
    0.0f,
    snapshot->shadow.brake_clamp_pct
  );
  snapshot->shadow.awd_request_pct = clampf(
    snapshot->shadow.awd_request_pct,
    0.0f,
    snapshot->shadow.oil_temp_clamp_pct
  );

  if(snapshot->shadow.degraded) {
    snapshot->shadow.awd_request_pct = 0.0f;
  }
}
