#ifndef VEHICLE_PROFILE_H
#define VEHICLE_PROFILE_H

#include "awd_types.h"

typedef struct {
  const char *name;
  const char *vehicle_platform;
  const char *tcu_protocol;
  uint32_t bus_bitrate;
  bool shared_bus;
  bool has_yaw_rate;
  uint32_t phase1_ids[16];
  size_t phase1_id_count;
} vehicle_profile_t;

extern const vehicle_profile_t E90_TURBOLAMIK_PHASE1_PROFILE;

bool vehicle_profile_contains_id(const vehicle_profile_t *profile, uint32_t id);

#endif
