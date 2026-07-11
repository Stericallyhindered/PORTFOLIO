#pragma once

#include <deque>

#include "../include/types.h"
#include "supabase_client.h"

namespace growmie {

// Bounded FIFO of unsent telemetry. Sized to absorb ~25 min of outage at the
// default 10 s tick. Oldest entries are evicted on overflow.
class RingBuffer {
 public:
  static constexpr size_t kCapacity = 256;

  void pushSample(const SensorSample& s);
  void pushEvent(const OutletEvent& e);
  void pushDecision(const AutomationDecision& d);

  // Attempts to drain everything into [sb]. Items that still fail go back to
  // the head of the queue.
  void flushInto(SupabaseClient& sb);

  size_t pendingCount() const {
    return _samples.size() + _events.size() + _decisions.size();
  }

 private:
  std::deque<SensorSample>        _samples;
  std::deque<OutletEvent>         _events;
  std::deque<AutomationDecision>  _decisions;

  template <typename T>
  void _pushCapped(std::deque<T>& q, const T& v) {
    if (q.size() >= kCapacity) q.pop_front();
    q.push_back(v);
  }
};

}  // namespace growmie
