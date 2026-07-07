#ifndef AWD_TYPES_H
#define AWD_TYPES_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define AWD_SIGNAL_TIMEOUT_FAST_MS 60U
#define AWD_SIGNAL_TIMEOUT_MEDIUM_MS 120U
#define AWD_SIGNAL_TIMEOUT_SLOW_MS 250U
#define AWD_RAW_LOG_CAPACITY 2048U
#define AWD_CAPTURE_EXPORT_CHUNK 64U

typedef enum {
  AWD_SIGNAL_SOURCE_UNKNOWN = 0,
  AWD_SIGNAL_SOURCE_VEHICLE_CAN,
  AWD_SIGNAL_SOURCE_TURBOLAMIK_CAN,
  AWD_SIGNAL_SOURCE_DERIVED,
  AWD_SIGNAL_SOURCE_SYSTEM
} awd_signal_source_t;

typedef enum {
  AWD_SIGNAL_ENGINE_RPM = 0,
  AWD_SIGNAL_THROTTLE_PCT,
  AWD_SIGNAL_WHEEL_SPEED_FL,
  AWD_SIGNAL_WHEEL_SPEED_FR,
  AWD_SIGNAL_WHEEL_SPEED_RL,
  AWD_SIGNAL_WHEEL_SPEED_RR,
  AWD_SIGNAL_VEHICLE_SPEED,
  AWD_SIGNAL_STEERING_ANGLE,
  AWD_SIGNAL_BRAKE_ACTIVE,
  AWD_SIGNAL_HANDBRAKE_ACTIVE,
  AWD_SIGNAL_REVERSE_ACTIVE,
  AWD_SIGNAL_GEAR_CURRENT,
  AWD_SIGNAL_GEAR_TARGET,
  AWD_SIGNAL_GEARBOX_MODE,
  AWD_SIGNAL_GEARBOX_PROGRAM,
  AWD_SIGNAL_LOCKUP_PCT,
  AWD_SIGNAL_WHEEL_TORQUE_NM,
  AWD_SIGNAL_TORQUE_REDUCTION_PCT,
  AWD_SIGNAL_TORQUE_REDUCTION_ACTIVE,
  AWD_SIGNAL_SHIFT_ACTIVE,
  AWD_SIGNAL_INPUT_SHAFT_RPM,
  AWD_SIGNAL_OUTPUT_SHAFT_RPM,
  AWD_SIGNAL_CLUTCH_SLIP_PCT,
  AWD_SIGNAL_CONVERTER_SLIP_PCT,
  AWD_SIGNAL_GEARBOX_OIL_TEMP_C,
  AWD_SIGNAL_BRAKE_PRESSURE_PROXY,
  AWD_SIGNAL_COUNT
} awd_signal_id_t;

typedef enum {
  AWD_CAPTURE_FILTER_ALL = 0,
  AWD_CAPTURE_FILTER_PHASE1_IDS
} capture_filter_mode_t;

typedef struct {
  float value;
  uint32_t timestamp_ms;
  uint32_t timeout_ms;
  bool valid;
  awd_signal_source_t source;
} signal_value_t;

typedef struct {
  uint32_t timestamp_ms;
  uint8_t bus;
  uint32_t id;
  uint8_t dlc;
  uint8_t data[8];
} raw_can_frame_t;

typedef struct {
  bool enabled;
  uint32_t started_at_ms;
  uint32_t max_frames;
  uint32_t frames_captured;
  capture_filter_mode_t filter_mode;
} capture_control_t;

typedef struct {
  float front_axle_speed;
  float rear_axle_speed;
  float front_rear_speed_delta;
  float rear_slip_ratio;
  float front_slip_ratio;
  float left_right_speed_delta_front;
  float left_right_speed_delta_rear;
  float turning_state;
  float drivetrain_state;
} derived_metrics_t;

typedef struct {
  float awd_request_pct;
  float base_precharge_pct;
  float slip_add_pct;
  float shift_add_pct;
  float steering_clamp_pct;
  float brake_clamp_pct;
  float oil_temp_clamp_pct;
  bool degraded;
} awd_shadow_output_t;

typedef struct {
  signal_value_t signals[AWD_SIGNAL_COUNT];
  derived_metrics_t metrics;
  awd_shadow_output_t shadow;
} live_snapshot_t;

typedef struct {
  uint32_t uptime_ms;
  uint32_t last_can_rx_ms;
  uint32_t total_frames;
  uint32_t frames_dropped;
  uint32_t decoder_errors;
  uint32_t e90_frames;
  uint32_t turbolamik_frames;
  bool ble_connected;
  bool capture_enabled;
  bool stale_turbolamik;
  bool stale_wheel_speeds;
  bool stale_steering;
  bool stale_vehicle_rpm;
} health_status_t;

#endif
