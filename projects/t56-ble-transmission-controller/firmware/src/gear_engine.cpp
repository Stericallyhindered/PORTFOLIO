#include "gear_engine.h"
#include "config_store.h"
#include "pwm_capture.h"
#include "pins.h"

#include <Arduino.h>
#include <math.h>

static ActiveConfig g_config;
static uint8_t g_lastGear = GEAR_UNKNOWN;
static uint8_t g_stableCount = 0;

static bool dutyMatches(float measured, float expected, float tolerancePct) {
  return fabsf(measured - expected) <= tolerancePct;
}

static bool rowMatches(const GearRow *row, const PwmChannelState inputs[3],
                       float tolerancePct) {
  for (int i = 0; i < 3; i++) {
    if (!inputs[i].valid) {
      return false;
    }
    if (!dutyMatches(inputs[i].dutyPct, row->inputDuty[i], tolerancePct)) {
      return false;
    }
  }
  return true;
}

void gearEngineInit() {
  g_lastGear = GEAR_UNKNOWN;
  g_stableCount = 0;
}

void gearEngineSetConfig(const ActiveConfig *config) {
  if (config == nullptr) {
    return;
  }
  g_config = *config;
  g_lastGear = GEAR_UNKNOWN;
  g_stableCount = 0;
}

uint8_t gearEngineDetect(const PwmChannelState inputs[3]) {
  uint8_t candidate = GEAR_UNKNOWN;
  const float tol = g_config.matchTolerancePct;

  for (int g = 0; g < g_config.gearCount; g++) {
    if (rowMatches(&g_config.gears[g], inputs, tol)) {
      candidate = g_config.gears[g].gearIndex;
      break;
    }
  }

  if (candidate == g_lastGear) {
    if (candidate != GEAR_UNKNOWN) {
      g_stableCount = min(g_stableCount + 1, 10);
    }
  } else {
    g_stableCount = 0;
    g_lastGear = candidate;
  }

  if (g_stableCount >= 2 || candidate == GEAR_UNKNOWN) {
    return candidate;
  }
  return g_lastGear;
}

const GearRow *gearEngineGetRow(uint8_t gearIndex) {
  for (int g = 0; g < g_config.gearCount; g++) {
    if (g_config.gears[g].gearIndex == gearIndex) {
      return &g_config.gears[g];
    }
  }
  return nullptr;
}

bool gearEngineOutputsDisabledForGear(uint8_t gearIndex) {
  const GearRow *row = gearEngineGetRow(gearIndex);
  if (row == nullptr) {
    return true;
  }
  for (int i = 0; i < OUTPUT_COUNT; i++) {
    if (row->outputDuty[i] > 0.01f) {
      return false;
    }
  }
  return true;
}

void gearEngineApplyOutputs(uint8_t gearIndex) {
  const GearRow *row = gearEngineGetRow(gearIndex);
  if (row == nullptr || gearEngineOutputsDisabledForGear(gearIndex)) {
    pwmOutputDisableAll();
    return;
  }
  for (int i = 0; i < OUTPUT_COUNT; i++) {
    pwmOutputSet(i, row->outputDuty[i], row->outputPeriod[i]);
  }
}
