#pragma once

#include <stddef.h>
#include <stdint.h>

struct PwmChannelState {
  float dutyPct;
  float periodMs;
  bool valid;
};

struct LiveStatus {
  uint8_t gearIndex;
  uint8_t flags;
  PwmChannelState inputs[3];
  PwmChannelState outputs[2];
};

struct GearRow {
  uint8_t gearIndex;
  float inputDuty[3];
  float inputPeriod[3];
  float outputDuty[2];
  float outputPeriod[2];
};

struct ActiveConfig {
  char presetId[32];
  float matchTolerancePct;
  GearRow gears[8];
  int gearCount;
};

enum StatusFlags : uint8_t {
  FLAG_OUTPUTS_DISABLED = 1 << 0,
  FLAG_CONFIG_DIRTY = 1 << 1,
};

enum GearIndex : uint8_t {
  GEAR_NEUTRAL = 0,
  GEAR_1ST = 1,
  GEAR_2ND = 2,
  GEAR_3RD = 3,
  GEAR_4TH = 4,
  GEAR_5TH = 5,
  GEAR_6TH = 6,
  GEAR_REVERSE = 7,
  GEAR_UNKNOWN = 255,
};
