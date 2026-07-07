# TurboLamik ADX Protocol Notes

Source: `XDF_ADX 10.75/ADX TCU V10_75.adx`

This document reverse engineers the external protocol surface exposed by the ADX file only.
It is written as a client-device spec for building a new device that talks to a TurboLamik TCU
the same way TunerPro does.

## Scope

- This is based only on the ADX file.
- It covers live telemetry/control commands exposed to TunerPro.
- It does not describe BIN flashing or tune-writing.
- It does not prove lower-level framing beyond what the ADX defines.

## Transport

- Baud rate: `921600`
- ADX default element size: `8 bits`
- Signed: `false`
- Float: `false`
- `lsbfirst=0`

### Inferred decode rule for 16-bit values

The ADX marks multi-byte values with `lsbfirst=0`, so the most likely decode is big-endian:

```text
u16 = (buf[n] << 8) | buf[n+1]
```

If live capture shows nonsense values, test little-endian as a fallback. The ADX alone does not
prove parity/stop bits or any adapter-specific encapsulation.

## Host-to-TCU commands

All explicit commands in the ADX are 4-byte ASCII payloads:

| Command | Raw Hex | ASCII | Purpose |
|---|---|---|---|
| `COMMAND0` | `4C 4F 47 31` | `LOG1` | Start/poll log set 1 |
| `MODE1,Send1` | `4C 4F 47 32` | `LOG2` | Start/poll log set 2 |
| `RESETERRORS` | `42 4C 41 44` | `BLAD` | Reset errors |
| `POWERDOWN` | `42 4C 41 5A` | `BLAZ` | Power down |

## Likely polling cycle

The ADX monitor macro is:

```text
COMMAND0MAC:
  COMMAND0
  MODE1,MESSAGE0
  FASTLOG
  MODE1,Send1
  MODE1,MESSAGE0
  MODE1,MESSAGE1
```

Interpreted as a client poll loop, the most likely sequence is:

1. Send `LOG1`
2. Read one `Mode 1, Log Fast` packet
3. Read one `Mode 1, Log1` packet
4. Send `LOG2`
5. Read one `Mode 1, Log Fast` packet
6. Read one `Mode 1, Log2` packet
7. Repeat

This sequence is an inference from the macro structure, but it is the strongest reading of the ADX.

## Receive packet definitions

The ADX defines three fixed-size receive packets:

| Packet | Internal Hash | Declared Size | Timeout |
|---|---|---:|---:|
| `Mode 1, Log Fast` | `0x4BBB4F7A` | `100 bytes` | `400 ms` |
| `Mode 1, Log1` | `0x11A8A134` | `100 bytes` | `400 ms` |
| `Mode 1, Log2` | `0x4BBB413A` | `100 bytes` | `400 ms` |

The ADX uses `packetoffsetinbody=0`, `packetbodylength=100`, and `packetsize=100` for all three,
which means TunerPro is treating each as a raw fixed-length payload.

No checksum, sync byte, header, footer, or CRC is described in the ADX.

## Packet map: Mode 1, Log Fast

Declared packet size: `100 bytes`

```text
00-01  u16  sample_number
02-03  u16  slip_correction_close              = raw / 16
04-05  u16  input_rpm
06-07  u16  output_rpm
08-09  u16  engine_rpm
0A      u8  gear_target                        = raw - 100
0B      u8  gear_raw
              alias: gear                      = raw - 100
              alias: gear_minus_1              = raw - 101
0C-0D  u16  log_time_seconds                   = raw / 1000
0E      u8  button_up_all                      = 1 - raw
0F      u8  button_down_all                    = 1 - raw
10-11  u16  slip_correction_open               = raw / 16
12      u8  tq_cut_1_flag
13      u8  tq_cut_2_flag
14      --  unmapped
15-16  u16  linear_pressure_sensor_bar         = raw / 100
17-2E  --  unmapped
2F      u8  clutch_x
30      u8  clutch_y
31      u8  clutch_x_correct
32      u8  clutch_y_correct
33-34  u16  debug_1
35-36  u16  debug_2
37-38  u16  debug_3
39-3A  u16  debug_4
3B-3C  u16  corrected_pressure_close_clutch    = raw / 16
3D-3E  u16  corrected_pressure_open_clutch     = raw / 16
3F      u8  base_corrected_pressure_lockup
40      --  unmapped
41      u8  slip_gear_clutch_flags             = raw / 100
42      u8  torque_reduction_map_percent       = raw / 1.28
43-44  u16  virtual_clutch_time
45      u8  blip_status
46-47  u16  blip_target_torque_nm
48      u8  blip_target_percent                = raw / 1.28
49-63  --  unmapped
7F      u8  stale_placeholder_field ("empty")
```

Notes:

- The ADX contains one extra placeholder field at offset `0x7F`, which is beyond the declared
  100-byte packet size (`0x63` last valid byte). Treat that field as stale ADX debris unless a
  live capture proves the packet is actually longer.

## Packet map: Mode 1, Log1

Declared packet size: `100 bytes`

```text
00      u8  cor_temp_zal_clutch                = raw - 100
01      u8  cor_temp_open_clutch               = raw - 100
02-03  u16  gearbox_torque_nm
              alias: gearbox_torque_ftlb       = raw * 0.7376
04      u8  lockup_map
05      u8  program_sw
06      u8  ignition_voltage_v                 = raw / 10
07      u8  battery_voltage_v                  = raw / 10
08-09  u16  engine_torque_nm
              alias: engine_torque_ftlb        = raw * 0.7376
0A-0B  u16  engine_pressure_kpa
0C      u8  oil_temp_c                         = raw - 40
              alias: oil_temp_f                = (raw - 40) * 1.8 + 32
0D      --  unmapped
0E      u8  tps_percent
0F      u8  dbw_percent
10-25  11x u16 current_calculation_1_to_11_ma
26      u8  virtual_clutch_position_percent    = 100 - (raw / 2.5)
27      u8  foot_brake
28-29  u16  shift_time_1                       = raw / 5
2A-2B  u16  slip_adaptation_time               = raw / 5
2C-2D  u16  clutch_adaptation_time             = raw / 5
2E-38  11x u8  out_current_adaptation_1_to_11_percent
39      u8  clutch_1_a
3A      u8  clutch_2_b
3B      u8  clutch_3_e
3C      u8  clutch_4_c
3D      u8  clutch_5_d
3E      u8  clutch_6_turbine
3F      u8  clutch_7
40      u8  mv_2
41      u8  mv_3
42      u8  mv_4
43      u8  mv_5
44-59  11x u16 out_current_1_to_11_ma
5A      u8  software_loop_cycle_0             = raw * 10
5B      u8  software_loop_cycle_1             = raw * 10
5C      u8  software_loop_cycle_2             = raw * 10
5D      u8  cpu_load_3
5E-5F  u16  base_corrected_pressure_clutch    = raw / 16
60      u8  cpu_load_0_percent
61      u8  linear_pressure
62      u8  lockup_multiplier                 = raw / 1.28
63      u8  lockup_pressure
```

## Packet map: Mode 1, Log2

Declared packet size: `100 bytes`

```text
00-01  u16  slip_gear_clutch_percent
02-03  u16  lockup_current
04      u8  lockup_slip_percent               = 100 - raw
05      u8  clutch_1_a_pressure_adaptation    = raw / 2 - 50
06      u8  clutch_2_b_pressure_adaptation    = raw / 2 - 50
07      u8  clutch_3_e_pressure_adaptation    = raw / 2 - 50
08      u8  clutch_4_c_pressure_adaptation    = raw / 2 - 50
09      u8  clutch_5_d_pressure_adaptation    = raw / 2 - 50
0A      u8  adaptation_activation_parameter
0B      u8  safe_mode
0C-0D  u16  error_code_active
0E      u8  vehicle_speed_kph                 = raw * 2
              alias: vehicle_speed_mph        = (raw * 2) * 0.621371
0F-10  u16  wheels_torque_nm
11-1C  12x u8 analog_in_1_to_12_v            = raw * 0.0196
1D-28  12x u8 aux_1_to_12
29-2A  u16  can_tq_1_nm
2B-2C  u16  can_tq_2_nm
2D-2E  u16  can_tq_3_nm
2F      u8  button_up_1
30      u8  button_down_1
31      u8  button_up_2
32      u8  button_down_2
33      u8  button_up_can
34      u8  button_down_can
35      u8  engine_clt_c                      = raw - 40
36-37  u16  error_code_historic
38-39  u16  ground_differential_voltage       = raw / 100
3A      u8  solenoid_supply_voltage_v         = raw / 10
3B-3C  u16  can_engine_losses_nm
3D      u8  tps_automatic_mode_percent
3E      u8  time_off_automatic_seconds
3F-40  u16  input_rpm_accel
41-42  u16  output_speed_accel
43      u8  virtual_clutch_pressure
44      u8  awd_activation_target             = raw / 2
45      u8  awd_activation_base               = raw / 2
46      u8  pwm1_dc_out                       = raw / 1.28
47-48  u16  steering_angle                    = raw / 10
49      u8  selector_command
4A      u8  sw1_mux
4B      u8  sw2_mux
4C      u8  sw3_mux
4D      u8  oil_temp_voltage_v                = raw * 0.02
4E-4F  u16  max_rpm_auto_mode
50-51  u16  min_rpm_auto_mode
52-53  u16  max_rpm_limit
54      u8  awd_current                       = raw / 10
55      u8  automatic_mode
56      u8  automatic_map_up
57      u8  automatic_map_down
58-59  u16  universal_speed_input_2
5A-5B  u16  awd_engine_speed
5C      u8  awd_activation_actual             = raw / 2
5D      u8  kickdown
5E      u8  t_brake
5F      u8  parametric_1
60      u8  parametric_2
61      u8  parametric_3
62      u8  parametric_4
63      u8  upshift_mode
```

## Aliases and duplicates in the ADX

The ADX duplicates some offsets for alternate units or alternate interpretations:

- `Log Fast 0x0B`: current gear aliases
- `Log1 0x02-0x03`: gearbox torque in `Nm` and `ft/lbs`
- `Log1 0x08-0x09`: engine torque in `Nm` and `ft/lbs`
- `Log1 0x0C`: oil temp in `C` and `F`
- `Log2 0x0E`: vehicle speed in `km/h` and `mph`

When implementing firmware/software, decode the raw byte once and expose converted views separately.

## What is still unknown from the ADX alone

- Whether the physical link is direct UART, USB-serial, or adapter-mediated
- Whether packet framing exists below the 100-byte payload level
- Whether there is a sync byte or checksum handled outside the ADX
- Exact serial framing parameters beyond baud rate
- Whether `LOG1`/`LOG2` are one-shot polls or mode-switch commands on a continuously streaming link

## Practical client implementation plan

Minimal client behavior to emulate TunerPro:

1. Open serial link at `921600`
2. Send `LOG1`
3. Read `100` bytes as `Log Fast`
4. Read `100` bytes as `Log1`
5. Send `LOG2`
6. Read `100` bytes as `Log Fast`
7. Read `100` bytes as `Log2`
8. Repeat

If a live capture disagrees with that loop, the next thing to verify is whether `LOG1` and `LOG2`
switch the stream mode rather than request a one-shot response.
