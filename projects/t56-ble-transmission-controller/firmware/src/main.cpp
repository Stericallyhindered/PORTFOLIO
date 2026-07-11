#include "ble_server.h"
#include "config_store.h"
#include "gear_engine.h"
#include "pins.h"
#include "pwm_capture.h"

#include <Arduino.h>

static ActiveConfig g_config;
static LiveStatus g_status;
static uint32_t g_lastNotifyMs = 0;

static void updateLiveStatus() {
  g_status.gearIndex = GEAR_UNKNOWN;
  g_status.flags = 0;

  PwmChannelState inputs[INPUT_COUNT];
  for (int i = 0; i < INPUT_COUNT; i++) {
    inputs[i] = pwmCaptureGetInput(i);
    g_status.inputs[i].dutyPct = inputs[i].dutyPct;
    g_status.inputs[i].periodMs = inputs[i].periodMs;
    g_status.inputs[i].valid = inputs[i].valid;
  }

  const uint8_t gear = gearEngineDetect(inputs);
  g_status.gearIndex = gear;

  if (gearEngineOutputsDisabledForGear(gear)) {
    g_status.flags |= FLAG_OUTPUTS_DISABLED;
    pwmOutputDisableAll();
  } else {
    gearEngineApplyOutputs(gear);
  }

  const GearRow *row = gearEngineGetRow(gear);
  if (row != nullptr) {
    for (int i = 0; i < OUTPUT_COUNT; i++) {
      g_status.outputs[i].dutyPct = row->outputDuty[i];
      g_status.outputs[i].periodMs = row->outputPeriod[i];
      g_status.outputs[i].valid = true;
    }
  } else {
    for (int i = 0; i < OUTPUT_COUNT; i++) {
      g_status.outputs[i] = {0, 0, false};
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pwmCaptureInit();
  pwmOutputInit();
  gearEngineInit();

  if (!configStoreLoad(&g_config)) {
    configStoreLoadDefault(&g_config);
    configStoreSave(&g_config);
  }
  gearEngineSetConfig(&g_config);

  bleServerInit();

  Serial.println("Grannas-T56 ready");
}

void loop() {
  if (bleServerOtaInProgress()) {
    delay(10);
    return;
  }

  pwmCaptureUpdate();
  updateLiveStatus();

  const uint32_t now = millis();
  if (now - g_lastNotifyMs >= 50) {
    g_lastNotifyMs = now;
    bleServerNotifyStatus(&g_status);
  }

  delay(5);
}
