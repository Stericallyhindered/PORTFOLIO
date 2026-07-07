#ifndef TURBOLAMIK_DECODER_H
#define TURBOLAMIK_DECODER_H

#include "awd_types.h"

bool turbolamik_decoder_process(live_snapshot_t *snapshot, const raw_can_frame_t *frame);

#endif
