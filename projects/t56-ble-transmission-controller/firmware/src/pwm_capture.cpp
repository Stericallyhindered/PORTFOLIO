#include "pwm_capture.h"
#include "pins.h"

#include <Arduino.h>

static const int INPUT_PINS[INPUT_COUNT] = {
    PIN_PWM_IN_0, PIN_PWM_IN_1, PIN_PWM_IN_2};

static PwmChannelState g_inputs[INPUT_COUNT];

void pwmCaptureInit() {
  for (int i = 0; i < INPUT_COUNT; i++) {
    pinMode(INPUT_PINS[i], INPUT);
    g_inputs[i] = {0, 0, false};
  }
}

void pwmCaptureUpdate() {
  for (int i = 0; i < INPUT_COUNT; i++) {
    const unsigned long highUs = pulseIn(INPUT_PINS[i], HIGH, 20000);
    const unsigned long lowUs = pulseIn(INPUT_PINS[i], LOW, 20000);
    if (highUs > 0 && lowUs > 0) {
      const float periodUs = (float)(highUs + lowUs);
      g_inputs[i].dutyPct = (highUs * 100.0f) / periodUs;
      g_inputs[i].periodMs = periodUs / 1000.0f;
      g_inputs[i].valid = true;
    } else {
      g_inputs[i].valid = false;
    }
  }
}

PwmChannelState pwmCaptureGetInput(int index) {
  if (index < 0 || index >= INPUT_COUNT) {
    return {0, 0, false};
  }
  return g_inputs[index];
}
