// LAN-only Tuya protocol client (versions 3.1 / 3.3).
//
// Why local: the cloud OpenAPI requires a paid "IoT Core" subscription that
// Tuya periodically expires. Every Tuya Wi-Fi device also speaks a
// reverse-engineered local protocol on TCP port 6668 with AES-128-ECB
// payloads keyed by a per-device `local_key` that we extract with
// `tinytuya wizard`. We get: free, faster (~50 ms vs 1-3 s), and no
// dependency on Tuya's cloud being up.
//
// References used:
//   https://github.com/jasonacox/tinytuya (Python reference impl)
//   https://github.com/codetheweb/tuyapi   (Node.js reference impl)
//   https://github.com/rospogrigio/localtuya (Home Assistant integration)

#include "local_tuya.h"

#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <mbedtls/aes.h>
#include <time.h>

namespace growmie {

namespace {

// Tuya's "udpkey" for decrypting v3.3+ UDP broadcasts on port 6667. It is
// md5("yGAdlopoPVldABfn") truncated to 16 bytes, identical for every device.
const uint8_t kUdpKey[16] = {
    0x6c, 0xfd, 0xd0, 0x66, 0xd7, 0x33, 0xe1, 0xa6,
    0xb5, 0x07, 0x4a, 0xc4, 0x77, 0x06, 0x9c, 0xc7,
};

constexpr uint32_t kPrefix = 0x000055AA;
constexpr uint32_t kSuffix = 0x0000AA55;

constexpr uint32_t kCmdControl   = 7;
constexpr uint32_t kCmdStatus    = 8;
constexpr uint32_t kCmdHbeat     = 9;   // unused
constexpr uint32_t kCmdDpQuery   = 10;
constexpr uint32_t kCmdDpQueryNew = 16;

constexpr uint16_t kPortLocal       = 6668;
constexpr uint16_t kPortDiscovery33 = 6667;

constexpr uint32_t kDiscoveryTtlMs = 60 * 1000;  // forget IPs after 60 s

// CRC32 (IEEE 802.3, polynomial 0xEDB88320), small bytewise variant — fits
// the ESP32 flash budget and is run on tiny frames (~200 bytes).
uint32_t crc32Update(uint32_t crc, const uint8_t* data, size_t len) {
  crc = ~crc;
  for (size_t i = 0; i < len; ++i) {
    crc ^= data[i];
    for (int b = 0; b < 8; ++b) {
      crc = (crc >> 1) ^ (0xEDB88320u & (~((crc & 1) - 1)));
    }
  }
  return ~crc;
}

void putBE32(std::vector<uint8_t>& buf, uint32_t v) {
  buf.push_back((v >> 24) & 0xFF);
  buf.push_back((v >> 16) & 0xFF);
  buf.push_back((v >> 8) & 0xFF);
  buf.push_back(v & 0xFF);
}

uint32_t readBE32(const uint8_t* p) {
  return (uint32_t(p[0]) << 24) | (uint32_t(p[1]) << 16) |
         (uint32_t(p[2]) << 8)  | uint32_t(p[3]);
}

void aesEcbCrypt(const uint8_t* key16, bool encrypt,
                 const uint8_t* in, size_t len, std::vector<uint8_t>& out) {
  out.clear();
  out.resize(len);
  mbedtls_aes_context ctx;
  mbedtls_aes_init(&ctx);
  if (encrypt) {
    mbedtls_aes_setkey_enc(&ctx, key16, 128);
  } else {
    mbedtls_aes_setkey_dec(&ctx, key16, 128);
  }
  for (size_t i = 0; i + 16 <= len; i += 16) {
    mbedtls_aes_crypt_ecb(&ctx,
                          encrypt ? MBEDTLS_AES_ENCRYPT : MBEDTLS_AES_DECRYPT,
                          in + i, out.data() + i);
  }
  mbedtls_aes_free(&ctx);
}

// PKCS#7-pad src to a 16-byte boundary into dst.
void pkcs7Pad(const String& src, std::vector<uint8_t>& dst) {
  const size_t len = src.length();
  const size_t pad = 16 - (len % 16);
  dst.assign((const uint8_t*)src.c_str(),
             (const uint8_t*)src.c_str() + len);
  for (size_t i = 0; i < pad; ++i) dst.push_back((uint8_t)pad);
}

// Strip PKCS#7 from a decrypted buffer. Returns the byte length without pad.
size_t pkcs7Unpad(const std::vector<uint8_t>& buf) {
  if (buf.empty()) return 0;
  const uint8_t pad = buf.back();
  if (pad == 0 || pad > 16 || pad > buf.size()) return buf.size();
  for (size_t i = buf.size() - pad; i < buf.size(); ++i) {
    if (buf[i] != pad) return buf.size();
  }
  return buf.size() - pad;
}

// Pack `localKey` (always 16 ASCII chars from tinytuya) into a 16-byte AES key.
bool keyFromString(const String& localKey, uint8_t out[16]) {
  if (localKey.length() != 16) return false;
  memcpy(out, localKey.c_str(), 16);
  return true;
}

// Build a complete Tuya frame (3.3 payload format) around an already-built
// payload buffer. Returns the bytes ready to send over TCP.
std::vector<uint8_t> buildFrame(uint32_t seq, uint32_t cmd,
                                const std::vector<uint8_t>& payload) {
  std::vector<uint8_t> frame;
  frame.reserve(payload.size() + 24);
  putBE32(frame, kPrefix);
  putBE32(frame, seq);
  putBE32(frame, cmd);
  // length = payload.size() + 8  (crc32 + suffix together)
  putBE32(frame, (uint32_t)(payload.size() + 8));
  for (uint8_t b : payload) frame.push_back(b);
  const uint32_t crc = crc32Update(0, frame.data(), frame.size());
  putBE32(frame, crc);
  putBE32(frame, kSuffix);
  return frame;
}

// Parse one frame out of `buf` starting at offset 0. Returns the payload
// bytes (encrypted) and the command. Returns false on prefix/suffix or CRC
// mismatch.
bool parseFrame(const std::vector<uint8_t>& buf, uint32_t& outCmd,
                std::vector<uint8_t>& outPayload) {
  if (buf.size() < 24) return false;
  if (readBE32(buf.data()) != kPrefix) return false;
  outCmd = readBE32(buf.data() + 8);
  const uint32_t len = readBE32(buf.data() + 12);
  if (len < 8 || buf.size() < 16 + len) return false;
  const size_t payloadLen = len - 8;
  // CRC covers everything up to (not including) crc32 itself.
  const uint32_t expected = readBE32(buf.data() + 16 + payloadLen);
  const uint32_t actual   = crc32Update(0, buf.data(), 16 + payloadLen);
  if (expected != actual) return false;
  if (readBE32(buf.data() + 16 + payloadLen + 4) != kSuffix) return false;
  outPayload.assign(buf.data() + 16, buf.data() + 16 + payloadLen);
  return true;
}

// Decrypt a 3.3-style outgoing payload buffer. Some commands (DP_QUERY,
// CONTROL on 3.3) prepend a 15-byte "3.3" + 12 zero bytes header before the
// encrypted JSON. Detect and strip it.
bool decryptResponse(const std::vector<uint8_t>& cipher, const uint8_t key[16],
                     String& outJson) {
  // 3.3 inbound payloads usually start with 4 zero bytes (return_code) then
  // optionally "3.3" + 12 zeros, then ciphertext. We try a few offsets.
  // tinytuya.message_parse handles all this; we keep it short here.
  size_t offset = 0;
  // Some firmwares prepend 4 zero bytes (return code = 0 success).
  if (cipher.size() >= 4 &&
      cipher[0] == 0 && cipher[1] == 0 && cipher[2] == 0 && cipher[3] == 0) {
    offset = 4;
  }
  // Some prepend "3.3" + 12 null bytes (15 bytes total).
  if (cipher.size() >= offset + 15 &&
      cipher[offset + 0] == '3' && cipher[offset + 1] == '.' &&
      cipher[offset + 2] == '3') {
    offset += 15;
  }
  if ((cipher.size() - offset) < 16 || ((cipher.size() - offset) % 16) != 0) {
    // Plaintext JSON? Sometimes status responses come back un-encrypted.
    if (offset < cipher.size() && cipher[offset] == '{') {
      outJson = String((const char*)(cipher.data() + offset),
                       cipher.size() - offset);
      return true;
    }
    return false;
  }
  std::vector<uint8_t> plain;
  aesEcbCrypt(key, /*encrypt=*/false,
              cipher.data() + offset, cipher.size() - offset, plain);
  const size_t n = pkcs7Unpad(plain);
  outJson = String();
  outJson.reserve(n + 1);
  for (size_t i = 0; i < n; ++i) outJson += (char)plain[i];
  return true;
}

// Build the encrypted payload portion (no prefix/suffix) for 3.3 commands.
// For CONTROL the format is: "3.3" + 12 zero bytes + AES(json).
// For DP_QUERY it's just AES(json) (no version header).
std::vector<uint8_t> buildPayload33(uint32_t cmd, const String& json,
                                    const uint8_t key[16]) {
  std::vector<uint8_t> padded;
  pkcs7Pad(json, padded);
  std::vector<uint8_t> cipher;
  aesEcbCrypt(key, /*encrypt=*/true, padded.data(), padded.size(), cipher);

  std::vector<uint8_t> payload;
  if (cmd == kCmdControl) {
    payload.reserve(15 + cipher.size());
    const char* hdr = "3.3";
    payload.push_back(hdr[0]);
    payload.push_back(hdr[1]);
    payload.push_back(hdr[2]);
    for (int i = 0; i < 12; ++i) payload.push_back(0);
  } else {
    payload.reserve(cipher.size());
  }
  for (uint8_t b : cipher) payload.push_back(b);
  return payload;
}

String currentTsSeconds() {
  char buf[24];
  snprintf(buf, sizeof(buf), "%llu", (unsigned long long)time(nullptr));
  return String(buf);
}

// Resolve a friendly name ("switch", "temperature", "humidity") to the DP id
// for this specific device, with sensible defaults.
String dpId(const Device& d, const String& key, const String& fallback) {
  auto it = d.dpMap.find(key);
  if (it != d.dpMap.end() && !it->second.isEmpty()) return it->second;
  return fallback;
}

}  // namespace

void LocalTuya::begin(const HubConfig& /*cfg*/) {
  _ready = true;
  _seq   = 1;
  if (_udp33.begin(kPortDiscovery33)) {
    Serial.println("[ltuya] listening for v3.3 broadcasts on udp/6667");
  } else {
    Serial.println("[ltuya] WARN: could not bind udp/6667");
  }
}

void LocalTuya::pumpDiscovery() {
  int len = _udp33.parsePacket();
  if (len <= 0) return;
  std::vector<uint8_t> pkt(len);
  _udp33.read(pkt.data(), len);

  uint32_t cmd;
  std::vector<uint8_t> payload;
  if (!parseFrame(pkt, cmd, payload)) return;

  // 3.3 broadcasts are encrypted with the global udpkey.
  std::vector<uint8_t> plain;
  if (payload.size() >= 16 && (payload.size() % 16) == 0) {
    aesEcbCrypt(kUdpKey, /*encrypt=*/false,
                payload.data(), payload.size(), plain);
    const size_t n = pkcs7Unpad(plain);
    plain.resize(n);
  } else {
    plain = payload;
  }
  // Skip any leading null bytes from the return-code header.
  size_t off = 0;
  while (off < plain.size() && plain[off] != '{') ++off;
  if (off >= plain.size()) return;

  JsonDocument doc;
  if (deserializeJson(doc, (const char*)(plain.data() + off),
                      plain.size() - off)) return;
  const String gwId = doc["gwId"].as<String>();
  const String ip   = doc["ip"].as<String>();
  if (gwId.isEmpty() || ip.isEmpty()) return;
  auto& e = _seen[gwId];
  if (e.ip != ip) {
    Serial.printf("[ltuya] discovered %s @ %s\n", gwId.c_str(), ip.c_str());
  }
  e.ip          = ip;
  e.lastSeenMs  = millis();
}

String LocalTuya::_resolveIp(const Device& d) const {
  // Discovery cache wins (devices can get a new DHCP lease at any time).
  auto it = _seen.find(d.tuyaDeviceId);
  if (it != _seen.end() && !it->second.ip.isEmpty()) {
    if (millis() - it->second.lastSeenMs < kDiscoveryTtlMs) return it->second.ip;
  }
  return d.ip;  // fall back to Supabase hint
}

bool LocalTuya::_send(const Device& d, uint32_t cmd, const String& json,
                      String& outJson) {
  if (d.protocolVersion != "3.3" && d.protocolVersion != "3.1") {
    Serial.printf("[ltuya] %s: protocol %s not yet supported\n",
                  d.tuyaDeviceId.c_str(), d.protocolVersion.c_str());
    return false;
  }
  uint8_t key[16];
  if (!keyFromString(d.localKey, key)) {
    Serial.printf("[ltuya] %s: bad local_key (len=%d)\n",
                  d.tuyaDeviceId.c_str(), d.localKey.length());
    return false;
  }
  const String ip = _resolveIp(d);
  if (ip.isEmpty()) {
    Serial.printf("[ltuya] %s: no ip (waiting for udp discovery)\n",
                  d.tuyaDeviceId.c_str());
    return false;
  }

  WiFiClient cli;
  cli.setTimeout(2);
  if (!cli.connect(ip.c_str(), kPortLocal)) {
    Serial.printf("[ltuya] %s: connect %s:6668 failed\n",
                  d.tuyaDeviceId.c_str(), ip.c_str());
    return false;
  }

  const std::vector<uint8_t> payload = buildPayload33(cmd, json, key);
  const std::vector<uint8_t> frame   = buildFrame(_seq++, cmd, payload);
  cli.write(frame.data(), frame.size());

  // Read until we get a complete frame (max ~1 KB, 1500 ms total).
  std::vector<uint8_t> in;
  const uint32_t start = millis();
  while (millis() - start < 1500) {
    while (cli.available()) {
      in.push_back((uint8_t)cli.read());
    }
    if (in.size() >= 24) {
      const uint32_t len = readBE32(in.data() + 12);
      if (in.size() >= 16 + len) break;
    }
    delay(10);
  }
  cli.stop();
  if (in.size() < 24) return false;

  uint32_t respCmd;
  std::vector<uint8_t> respPayload;
  if (!parseFrame(in, respCmd, respPayload)) return false;
  return decryptResponse(respPayload, key, outJson);
}

bool LocalTuya::_query(const Device& d, String& outJson) {
  // Most devices honor DP_QUERY; humidifier outlets and humidity sensors
  // alike answer with {"dps": {...}}.
  String body;
  {
    JsonDocument doc;
    doc["gwId"]  = d.tuyaDeviceId;
    doc["devId"] = d.tuyaDeviceId;
    doc["uid"]   = d.tuyaDeviceId;
    doc["t"]     = currentTsSeconds();
    serializeJson(doc, body);
  }
  return _send(d, kCmdDpQuery, body, outJson);
}

bool LocalTuya::_control(const Device& d, const String& dp, bool on) {
  String body;
  {
    JsonDocument doc;
    doc["devId"] = d.tuyaDeviceId;
    doc["uid"]   = "";
    doc["t"]     = currentTsSeconds();
    JsonObject dps = doc["dps"].to<JsonObject>();
    dps[dp]      = on;
    serializeJson(doc, body);
  }
  String resp;
  return _send(d, kCmdControl, body, resp);
}

bool LocalTuya::publishSwitch(const Device& d, bool on) {
  const String dp = dpId(d, "switch", "1");
  if (!_control(d, dp, on)) {
    Serial.printf("[ltuya] %s: switch dp=%s -> %s FAILED\n",
                  d.tuyaDeviceId.c_str(), dp.c_str(), on ? "ON" : "OFF");
    return false;
  }
  Serial.printf("[ltuya] %s: switch dp=%s -> %s\n",
                d.tuyaDeviceId.c_str(), dp.c_str(), on ? "ON" : "OFF");
  return true;
}

bool LocalTuya::publishSwitch(const String& tuyaDeviceId, bool on,
                              const std::vector<Device>& devices) {
  for (const auto& d : devices) {
    if (d.tuyaDeviceId == tuyaDeviceId) return publishSwitch(d, on);
  }
  Serial.printf("[ltuya] publishSwitch: unknown device %s\n",
                tuyaDeviceId.c_str());
  return false;
}

bool LocalTuya::pollAll(const std::vector<Device>& devices,
                        std::vector<SensorSample>& outSamples,
                        ControllerStateSnapshot& outSnapshot) {
  pumpDiscovery();
  Serial.printf("[ltuya] pollAll devices=%u\n", (unsigned)devices.size());
  if (devices.empty()) return true;
  bool anyOk = false;
  for (const auto& d : devices) {
    if (d.localKey.isEmpty()) continue;
    String resp;
    if (!_query(d, resp)) continue;
    JsonDocument doc;
    if (deserializeJson(doc, resp)) continue;
    JsonObject dps = doc["dps"].as<JsonObject>();
    if (dps.isNull()) continue;
    anyOk = true;

    if (d.kind == "tempHumiditySensor") {
      SensorSample s;
      s.tsMs     = (uint64_t)time(nullptr) * 1000ULL;
      s.deviceId = d.supabaseId;
      const String tempKey = dpId(d, "temperature", "1");
      const String rhKey   = dpId(d, "humidity",    "2");
      if (dps[tempKey].is<float>() || dps[tempKey].is<int>()) {
        const float raw = dps[tempKey].as<float>();
        // Most Tuya temp DPs come back ×10 (e.g. 234 -> 23.4 °C). Sniff:
        // raw in plausible "celsius range" -> pass through; else ÷10.
        s.tempC = (raw >= -30 && raw <= 70) ? raw : raw / 10.0f;
      }
      if (dps[rhKey].is<float>() || dps[rhKey].is<int>()) {
        const float raw = dps[rhKey].as<float>();
        s.rhPct = (raw <= 100) ? raw : raw / 10.0f;
      }
      if (!isnan(s.tempC) && !isnan(s.rhPct)) {
        outSamples.push_back(s);
        Serial.printf("[ltuya]   %s temp=%.1fC rh=%.0f%%\n",
                      d.tuyaDeviceId.c_str(), s.tempC, s.rhPct);
      }
    } else {
      const String swKey = dpId(d, "switch", "1");
      if (!dps[swKey].isNull()) {
        const bool isOn = dps[swKey].as<bool>();
        if (d.role == "humidifier")    outSnapshot.humRelayOn  = isOn;
        if (d.role == "dehumidifier")  outSnapshot.dehuRelayOn = isOn;
      }
    }
  }
  return anyOk;
}

}  // namespace growmie
