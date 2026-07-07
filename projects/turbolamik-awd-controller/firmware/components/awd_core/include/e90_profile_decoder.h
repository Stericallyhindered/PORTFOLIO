#ifndef E90_PROFILE_DECODER_H
#define E90_PROFILE_DECODER_H

#include "awd_types.h"

bool e90_profile_decoder_process(live_snapshot_t *snapshot, const raw_can_frame_t *frame);

#endif
