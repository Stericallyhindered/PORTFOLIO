#include "raw_log_buffer.h"

#include <string.h>

void raw_log_buffer_init(raw_log_buffer_t *buffer) {
  memset(buffer, 0, sizeof(*buffer));
}

bool raw_log_buffer_push(raw_log_buffer_t *buffer, const raw_can_frame_t *frame) {
  buffer->frames[buffer->head] = *frame;
  buffer->head = (buffer->head + 1U) % AWD_RAW_LOG_CAPACITY;

  if(buffer->count < AWD_RAW_LOG_CAPACITY) {
    buffer->count += 1U;
  }

  return true;
}

size_t raw_log_buffer_read_tail(
  const raw_log_buffer_t *buffer,
  size_t max_frames,
  raw_can_frame_t *out_frames,
  size_t out_capacity
) {
  size_t frames_to_copy = buffer->count;
  size_t start_index;
  size_t i;

  if(frames_to_copy > max_frames) {
    frames_to_copy = max_frames;
  }

  if(frames_to_copy > out_capacity) {
    frames_to_copy = out_capacity;
  }

  start_index = (buffer->head + AWD_RAW_LOG_CAPACITY - frames_to_copy) % AWD_RAW_LOG_CAPACITY;

  for(i = 0; i < frames_to_copy; ++i) {
    out_frames[i] = buffer->frames[(start_index + i) % AWD_RAW_LOG_CAPACITY];
  }

  return frames_to_copy;
}
