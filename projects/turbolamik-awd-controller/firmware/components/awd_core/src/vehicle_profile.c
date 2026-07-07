#include "vehicle_profile.h"

const vehicle_profile_t E90_TURBOLAMIK_PHASE1_PROFILE = {
  .name = "BMW E90 AWD + TurboLamik Phase 1",
  .vehicle_platform = "E90",
  .tcu_protocol = "TurboLamik TCU V2 TX",
  .bus_bitrate = 500000U,
  .shared_bus = true,
  .has_yaw_rate = false,
  .phase1_ids = {
    0x0AA, 0x0CE, 0x0C8, 0x19E, 0x1A6, 0x1B4, 0x34F, 0x130, 0x24A, 0x3B0,
    0x720, 0x721, 0x722, 0x723
  },
  .phase1_id_count = 14U
};

bool vehicle_profile_contains_id(const vehicle_profile_t *profile, uint32_t id) {
  size_t i;

  for(i = 0; i < profile->phase1_id_count; ++i) {
    if(profile->phase1_ids[i] == id) {
      return true;
    }
  }

  return false;
}
