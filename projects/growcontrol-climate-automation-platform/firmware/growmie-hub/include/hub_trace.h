#pragma once

// Set to 0 in platformio.ini build_flags (-DGROWMIE_HUB_TRACE=0) to silence
// high-volume Serial logging (e.g. production builds).
#ifndef GROWMIE_HUB_TRACE
#define GROWMIE_HUB_TRACE 1
#endif

#include <Arduino.h>

#if GROWMIE_HUB_TRACE

inline unsigned long hubTraceMs() {
  return millis();
}

#define HUB_TRACE_TICK(fmt, ...) \
  Serial.printf("[hub][tick %lu] " fmt "\n", hubTraceMs(), ##__VA_ARGS__)

#define HUB_TRACE_SB(fmt, ...) Serial.printf("[sb] " fmt "\n", ##__VA_ARGS__)

#define HUB_TRACE_CMD(fmt, ...) Serial.printf("[cmd] " fmt "\n", ##__VA_ARGS__)

#define HUB_TRACE_CLIMATE(fmt, ...) \
  Serial.printf("[climate] " fmt "\n", ##__VA_ARGS__)

#define HUB_TRACE_RETRY(fmt, ...) \
  Serial.printf("[retry] " fmt "\n", ##__VA_ARGS__)

#define HUB_TRACE_ERR(fmt, ...) \
  Serial.printf("[hub][err] " fmt "\n", ##__VA_ARGS__)

#else

#define HUB_TRACE_TICK(fmt, ...)
#define HUB_TRACE_SB(fmt, ...)
#define HUB_TRACE_CMD(fmt, ...)
#define HUB_TRACE_CLIMATE(fmt, ...)
#define HUB_TRACE_RETRY(fmt, ...)
#define HUB_TRACE_ERR(fmt, ...)

#endif
