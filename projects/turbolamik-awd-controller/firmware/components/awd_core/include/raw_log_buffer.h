#ifndef RAW_LOG_BUFFER_H
#define RAW_LOG_BUFFER_H

#include "awd_types.h"

typedef struct {
  raw_can_frame_t frames[AWD_RAW_LOG_CAPACITY];
  uint32_t head;
  uint32_t count;
} raw_log_buffer_t;

void raw_log_buffer_init(raw_log_buffer_t *buffer);
bool raw_log_buffer_push(raw_log_buffer_t *buffer, const raw_can_frame_t *frame);
size_t raw_log_buffer_read_tail(
  const raw_log_buffer_t *buffer,
  size_t max_frames,
  raw_can_frame_t *out_frames,
  size_t out_capacity
);

#endif
