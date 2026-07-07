# AWD Shadow Tables

This document captures the Phase 2 shadow-mode control model that will sit on
top of the Phase 1 telemetry and logging foundation.

## Control Intent

### Layered model (binding reference)

Control logic follows a **BMW xDrive–style three-layer stack** (pilot feedforward → traction/dynamics regulator → actuator feedback). Full signal mapping, Phase 1 gaps, and loop timing are specified in [esp32_arduino_telemetry_sketch_56a9c66d.plan.md](c:/Users/matt/.cursor/plans/esp32_arduino_telemetry_sketch_56a9c66d.plan.md) (section **AWD control architecture**). Shadow tables below remain the concrete map/tuning surface for Layers 1–2; Layer 3 ties to transfer-case hardware when the CAN protocol exists.

The internal controller output is a normalized:

- `awd_request_pct`

Range:

- `0..100`

This stays passive in Phase 1 and is only logged for review.

## Core Inputs

Vehicle-side:

- `engine_rpm`
- `throttle_pct`
- `wheel_speed_fl`
- `wheel_speed_fr`
- `wheel_speed_rl`
- `wheel_speed_rr`
- `steering_angle`
- `brake_active`
- `handbrake_active`
- `reverse_active`

Optional engine ECU (**MaxxECU** default CAN output, when enabled — see [maxxecu_can_output_default.md](maxxecu_can_output_default.md)):

- `maxxecu_rpm`, `maxxecu_throttle_pct`, `maxxecu_map_kpa`, `maxxecu_vehicle_speed_kph`
- `maxxecu_gear`, traction/slip fields (`0x523`–`0x524`), accel **`0x527`** (v1.3), bitmask **`0x526`** (brake/traction flags)

TurboLamik-side:

- `gear_current`
- `gear_target`
- `gearbox_mode`
- `gearbox_program`
- `lockup_pct`
- `wheel_torque_nm`
- `torque_reduction_pct`
- `torque_reduction_active`
- `shift_active`
- `input_shaft_rpm`
- `output_shaft_rpm`
- `clutch_slip_pct`
- `converter_slip_pct`
- `gearbox_oil_temp_c`

Derived:

- `front_axle_speed`
- `rear_axle_speed`
- `front_rear_speed_delta`
- `rear_slip_ratio`
- `front_slip_ratio`
- `turning_state`
- `drivetrain_state`

## Planned Maps

### Preload / Load Map

- X: `wheel_torque_nm`
- Y: `gear_current`
- Output: predictive `awd_pct`

Purpose:

- provide proactive front bias from real driveline load before wheel slip appears

### Slip Response Map

- X: `front_axle_speed` or `vehicle_speed_kph`
- Y: `rear_slip_ratio` or `front_rear_speed_delta`
- Output: additive `awd_pct`

Purpose:

- tune when AWD comes in after rear/front wheel-speed difference appears, and
  how aggressively it ramps in

### Shift Modifier

- X: `gear_current`
- Y: `gear_target`
- Gate: `shift_active`
- Output: additive `awd_pct`

Purpose:

- add bias during shifts when drivetrain loading changes quickly

### Gearbox Mode / Program Modifier

- X: `gearbox_mode`
- Y: `gearbox_program`
- Output: multiplier or offset

Purpose:

- let TurboLamik driving mode and program shape the AWD personality

### Steering Clamp Map

- X: `abs(steering_angle)`
- Y: `front_axle_speed` or `vehicle_speed_kph`
- Output: max `awd_pct`

Purpose:

- reduce front binding in tighter cornering and parking maneuvers

### Brake Clamp Map

- X: `brake_active` or brake-force proxy
- Y: `vehicle_speed_kph`
- Output: max `awd_pct`

Purpose:

- reduce unnecessary coupling under braking

### Lockup / Converter Modifier

- X: `lockup_pct`
- Y: `converter_slip_pct`
- Output: multiplier

Purpose:

- adjust front bias based on actual driveline coupling quality

### Clutch / Shaft Slip Modifier

- X: `input_shaft_rpm - output_shaft_rpm`
- Y: `clutch_slip_pct`
- Output: additive or subtractive `awd_pct`

Purpose:

- account for internal clutch slip and driveline speed delta before applying
  transfer-case lockup too aggressively

### Oil Temp Derate

- X: `gearbox_oil_temp_c`
- Output: max `awd_pct`

Purpose:

- protect hardware as transmission temperature climbs

### Launch Map

- X: `engine_rpm`
- Y: `wheel_torque_nm`
- Output: `prelaunch_awd_pct`

Purpose:

- preload the transfer case before straight-line launches

### Drag Launch Timer

Settings:

- launch AWD enable
- launch AWD percent
- hold time
- ramp-out time
- after-timer AWD percent
- launch trigger torque/RPM/speed thresholds
- max steering angle for launch timer

Purpose:

- allow AWD for the launch window and ramp toward RWD after a configured time to
  reduce driveline losses

### Fixed Rule Caps

Conditions:

- `handbrake_active`
- `reverse_active`
- tight low-speed parking state

Purpose:

- force reduced or zero AWD when aggressive coupling would be undesirable

## Planned Modes

### Street

- mild precharge
- conservative slip response
- strong steering clamp

### Rain

- earlier engagement
- stronger slip gain
- smoother torque spike control

### Sport

- higher precharge
- sharper shift and launch modifiers
- lighter steering clamp

### Drag / Launch

- aggressive straight-line preload
- strong slip response
- minimal cornering logic influence

### Drift

- delayed front engagement
- relaxed steering clamp
- strong handbrake logic

### Dyno / Service

- AWD disabled or hard-capped

## Safety Rules

- If TurboLamik TX goes stale, drop `awd_request_pct` to safe low or zero.
- If wheel-speed signals go stale or implausible, disable slip-based control
  and fall back to precharge-only.
- If steering goes stale, disable steering clamp and mark the controller
  degraded.
- Rate-limit every AWD target change.
- Add heartbeat timeout handling before any transfer-case output is enabled.
