#include "pwm_capture.h"
#include "pins.h"

#include <Arduino.h>

static const int OUTPUT_PINS[OUTPUT_COUNT] = {
    PIN_PWM_OUT_0, PIN_PWM_OUT_1};

static const int LEDC_CHANNEL[OUTPUT_COUNT] = {0, 1};
static const int LEDC_TIMER = 0;
static const int LEDC_RES_BITS = 12;

static uint32_t freqFromPeriodMs(float periodMs) {
  if (periodMs <= 0) {
    return 250;
  }
  return (uint32_t)(1000.0f / periodMs);
}

static uint32_t dutyTicks(float dutyPct) {
  const float clamped = constrain(dutyPct, 0.0f, 100.0f);
  return (uint32_t)((clamped / 100.0f) * ((1 << LEDC_RES_BITS) - 1));
}

void pwmOutputInit() {
  for (int i = 0; i < OUTPUT_COUNT; i++) {
    ledcSetup(LEDC_CHANNEL[i], 250, LEDC_RES_BITS);
    ledcAttachPin(OUTPUT_PINS[i], LEDC_CHANNEL[i]);
    ledcWrite(LEDC_CHANNEL[i], 0);
  }
}

void pwmOutputSet(int index, float dutyPct, float periodMs) {
  if (index < 0 || index >= OUTPUT_COUNT) {
    return;
  }
  const uint32_t freq = freqFromPeriodMs(periodMs);
  ledcSetup(LEDC_CHANNEL[index], freq, LEDC_RES_BITS);
  ledcWrite(LEDC_CHANNEL[index], dutyTicks(dutyPct));
}

void pwmOutputDisableAll() {
  for (int i = 0; i < OUTPUT_COUNT; i++) {
    ledcWrite(LEDC_CHANNEL[i], 0);
  }
}
