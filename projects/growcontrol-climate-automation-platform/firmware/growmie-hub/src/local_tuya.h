#pragma once

#include <Arduino.h>
#include <WiFiUdp.h>
#include <map>
#include <vector>

#include "../include/types.h"
#include "config_store.h"

namespace growmie {

// LAN-only Tuya client. Drop-in replacement for the cloud TuyaClient that
// was used here previously: same public surface (`begin`, `pollAll`,
// `publishSwitch`), no HTTPS, no subscription, no rate limits.
//
// Wire format reference (well-documented in tinytuya / localtuya):
//   frame = [0x000055AA prefix u32]
//           [seq u32]
//           [cmd u32]
//           [length u32]                  // bytes from end-of-length to suffix inclusive
//           [payload (possibly AES-128-ECB encrypted)]
//           [crc32 u32]                   // over everything up to (not including) crc32
//           [0x0000AA55 suffix u32]
//
// For protocol 3.3 the payload of CONTROL / DP_QUERY is:
//   [optional "3.3" + 12 zero bytes header (only for some cmds)] +
//   AES-128-ECB-PKCS7(localKey, json)
//
// 3.4 swaps the static-key encryption for an HMAC-SHA256 session-key handshake
// (SESS_KEY_NEG_*), then AES with the negotiated key. tinytuya documents the
// full state machine; this firmware speaks 3.3 first and falls back to a
// no-op on 3.4 devices until that handshake is implemented.
class LocalTuya {
 public:
  void begin(const HubConfig& cfg);
  bool isReady() const { return _ready; }

  // Refresh the IP cache by reading any pending UDP broadcasts. Cheap; call
  // this once per loop iteration. Devices broadcast their gwId+ip every
  // ~10 s on UDP/6666 (legacy plaintext, 3.1) and UDP/6667 (encrypted with
  // the global udpkey, 3.3+).
  void pumpDiscovery();

  // Poll every device. Sensor devices push samples into [outSamples]; outlet
  // state lands in [outSnapshot]. Returns true if at least one device
  // responded.
  bool pollAll(const std::vector<Device>& devices,
               std::vector<SensorSample>& outSamples,
               ControllerStateSnapshot& outSnapshot);

  // Flip a smart-outlet's primary switch DP. The matching Device row gives
  // us localKey / ip / protocolVersion / dpMap.
  bool publishSwitch(const Device& d, bool on);

  // Convenience overload used by climate/burst when only a tuyaDeviceId is
  // known; resolves the Device via the cached device list passed at the
  // call site. Falls back to a no-op if the device is unknown.
  bool publishSwitch(const String& tuyaDeviceId, bool on,
                     const std::vector<Device>& devices);

 private:
  struct DiscoveryEntry {
    String   ip;
    uint32_t lastSeenMs = 0;
  };

  String _resolveIp(const Device& d) const;
  bool   _query(const Device& d, String& outJson);
  bool   _control(const Device& d, const String& dpId, bool on);
  bool   _send(const Device& d, uint32_t cmd, const String& json,
               String& outJson);

  WiFiUDP _udp33;
  bool    _ready = false;
  uint32_t _seq = 1;
  std::map<String, DiscoveryEntry> _seen;   // gwId -> last broadcast
};

}  // namespace growmie
