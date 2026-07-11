#include "ring_buffer.h"

namespace growmie {

void RingBuffer::pushSample(const SensorSample& s)        { _pushCapped(_samples, s); }
void RingBuffer::pushEvent(const OutletEvent& e)          { _pushCapped(_events, e); }
void RingBuffer::pushDecision(const AutomationDecision& d){ _pushCapped(_decisions, d); }

void RingBuffer::flushInto(SupabaseClient& sb) {
  // Drain in FIFO order; on the first failure put the item back at the head
  // and bail. We do not interleave the three queues: if telemetry inserts
  // are working but outlet_events inserts are failing (e.g. RLS issue), we
  // still make forward progress on telemetry.
  while (!_samples.empty()) {
    const auto s = _samples.front();
    if (!sb.insertSample(s)) {
      return;
    }
    _samples.pop_front();
  }
  while (!_events.empty()) {
    const auto e = _events.front();
    if (!sb.insertOutletEvent(e)) {
      return;
    }
    _events.pop_front();
  }
  while (!_decisions.empty()) {
    const auto d = _decisions.front();
    if (!sb.insertDecision(d)) {
      return;
    }
    _decisions.pop_front();
  }
}

}  // namespace growmie
