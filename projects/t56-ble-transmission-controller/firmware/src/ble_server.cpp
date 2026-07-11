#include "ble_server.h"
#include "config_store.h"
#include "gear_engine.h"
#include "pins.h"

#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <Preferences.h>
#include <esp_ota_ops.h>
#include <esp_partition.h>
#include <mbedtls/sha256.h>
#include <string.h>
#include <vector>

#ifndef FW_VERSION
#define FW_VERSION "1.0.0"
#endif

static const char *SERVICE_UUID = "4faf2012-1fb5-459e-8fcc-c5c9c331914b";
static const char *CHAR_DEVICE_INFO = "4faf2012-1fb5-459e-8fcc-c5c9c331914c";
static const char *CHAR_LIVE_STATUS = "4faf2012-1fb5-459e-8fcc-c5c9c331914d";
static const char *CHAR_ACTIVE_PRESET = "4faf2012-1fb5-459e-8fcc-c5c9c331914e";
static const char *CHAR_CONFIG_CONTROL = "4faf2012-1fb5-459e-8fcc-c5c9c331914f";
static const char *CHAR_CONFIG_DATA = "4faf2012-1fb5-459e-8fcc-c5c9c3319150";
static const char *CHAR_OTA_CONTROL = "4faf2012-1fb5-459e-8fcc-c5c9c3319151";
static const char *CHAR_OTA_DATA = "4faf2012-1fb5-459e-8fcc-c5c9c3319152";

static NimBLECharacteristic *g_liveStatusChar = nullptr;
static NimBLECharacteristic *g_configDataChar = nullptr;
static ActiveConfig g_activeConfig;
static bool g_connected = false;

static std::vector<uint8_t> g_rxBuffer;
static uint32_t g_rxExpected = 0;
static bool g_rxActive = false;

static esp_ota_handle_t g_otaHandle = 0;
static const esp_partition_t *g_otaPartition = nullptr;
static size_t g_otaWritten = 0;
static size_t g_otaExpected = 0;
static uint8_t g_otaShaExpected[32];
static bool g_otaActive = false;
static mbedtls_sha256_context g_otaShaCtx;

static uint16_t scale100(float v) { return (uint16_t)(v * 100.0f + 0.5f); }

static void packLiveStatus(const LiveStatus *st, uint8_t *buf) {
  buf[0] = st->gearIndex;
  buf[1] = st->flags;
  int off = 2;
  for (int i = 0; i < 3; i++) {
    buf[off++] = scale100(st->inputs[i].dutyPct) & 0xFF;
    buf[off++] = (scale100(st->inputs[i].dutyPct) >> 8) & 0xFF;
    buf[off++] = scale100(st->inputs[i].periodMs) & 0xFF;
    buf[off++] = (scale100(st->inputs[i].periodMs) >> 8) & 0xFF;
  }
  for (int i = 0; i < 2; i++) {
    buf[off++] = scale100(st->outputs[i].dutyPct) & 0xFF;
    buf[off++] = (scale100(st->outputs[i].dutyPct) >> 8) & 0xFF;
    buf[off++] = scale100(st->outputs[i].periodMs) & 0xFF;
    buf[off++] = (scale100(st->outputs[i].periodMs) >> 8) & 0xFF;
  }
}

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer *pServer) override {
    g_connected = true;
  }
  void onDisconnect(NimBLEServer *pServer) override {
    g_connected = false;
    if (g_rxActive) {
      g_rxBuffer.clear();
      g_rxActive = false;
    }
    if (g_otaActive) {
      esp_ota_abort(g_otaHandle);
      g_otaActive = false;
    }
    NimBLEDevice::startAdvertising();
  }
};

class ConfigControlCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) override {
    std::string val = pChar->getValue();
    if (val.empty()) return;
    const uint8_t op = val[0];

    if (op == 0x01 && val.size() >= 5) {
      g_rxExpected = val[1] | (val[2] << 8) | (val[3] << 16) | (val[4] << 24);
      g_rxBuffer.clear();
      g_rxBuffer.reserve(g_rxExpected);
      g_rxActive = true;
      return;
    }

    if (op == 0x02 && g_rxActive) {
      if (g_rxBuffer.size() != g_rxExpected) {
        uint8_t err[] = {0x02};
        g_configDataChar->setValue(err, 1);
        g_rxActive = false;
        return;
      }
      ActiveConfig parsed;
      if (!configStoreParseJson((const char *)g_rxBuffer.data(),
                                g_rxBuffer.size(), &parsed)) {
        uint8_t err[] = {0x02};
        g_configDataChar->setValue(err, 1);
        g_rxActive = false;
        return;
      }
      g_activeConfig = parsed;
      gearEngineSetConfig(&g_activeConfig);
      if (!configStoreSave(&g_activeConfig)) {
        uint8_t err[] = {0x04};
        g_configDataChar->setValue(err, 1);
        g_rxActive = false;
        return;
      }
      uint8_t ok[] = {0x00};
      g_configDataChar->setValue(ok, 1);
      g_rxActive = false;
      return;
    }

    if (op == 0x04) {
      configStoreLoadDefault(&g_activeConfig);
      gearEngineSetConfig(&g_activeConfig);
      configStoreSave(&g_activeConfig);
      uint8_t ok[] = {0x00};
      g_configDataChar->setValue(ok, 1);
    }
  }
};

class ConfigDataCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) override {
    std::string val = pChar->getValue();
    if (!g_rxActive || val.size() < 3) return;
    uint16_t idx = val[0] | (val[1] << 8);
    size_t offset = idx * 480;
    if (offset > g_rxExpected) return;
    g_rxBuffer.resize(max(g_rxBuffer.size(), offset + val.size() - 2));
    memcpy(g_rxBuffer.data() + offset, val.data() + 2, val.size() - 2);
  }
};

class OtaControlCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) override {
    std::string val = pChar->getValue();
    if (val.empty()) return;
    const uint8_t op = val[0];

    if (op == 0x01 && val.size() >= 37) {
      g_otaExpected = val[1] | (val[2] << 8) | (val[3] << 16) | (val[4] << 24);
      memcpy(g_otaShaExpected, val.data() + 5, 32);
      g_otaPartition = esp_ota_get_next_update_partition(nullptr);
      if (g_otaPartition == nullptr ||
          esp_ota_begin(g_otaPartition, g_otaExpected, &g_otaHandle) !=
              ESP_OK) {
        uint8_t err[] = {0x04};
        g_configDataChar->setValue(err, 1);
        return;
      }
      mbedtls_sha256_init(&g_otaShaCtx);
      mbedtls_sha256_starts(&g_otaShaCtx, 0);
      g_otaWritten = 0;
      g_otaActive = true;
      uint8_t ok[] = {0x00};
      g_configDataChar->setValue(ok, 1);
      return;
    }

    if (op == 0x02 && g_otaActive) {
      esp_ota_abort(g_otaHandle);
      g_otaActive = false;
      return;
    }

    if (op == 0x03 && g_otaActive) {
      if (g_otaWritten != g_otaExpected) {
        uint8_t err[] = {0x02};
        g_configDataChar->setValue(err, 1);
        esp_ota_abort(g_otaHandle);
        g_otaActive = false;
        return;
      }
      uint8_t hash[32];
      mbedtls_sha256_finish(&g_otaShaCtx, hash);
      if (memcmp(hash, g_otaShaExpected, 32) != 0) {
        uint8_t err[] = {0x03};
        g_configDataChar->setValue(err, 1);
        esp_ota_abort(g_otaHandle);
        g_otaActive = false;
        return;
      }
      if (esp_ota_end(g_otaHandle) != ESP_OK ||
          esp_ota_set_boot_partition(g_otaPartition) != ESP_OK) {
        uint8_t err[] = {0x04};
        g_configDataChar->setValue(err, 1);
        g_otaActive = false;
        return;
      }
      uint8_t ok[] = {0x00};
      g_configDataChar->setValue(ok, 1);
      g_otaActive = false;
      delay(200);
      esp_restart();
    }
  }
};

class OtaDataCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) override {
    if (!g_otaActive) return;
    std::string val = pChar->getValue();
    if (val.empty()) return;
    if (esp_ota_write(g_otaHandle, val.data(), val.size()) != ESP_OK) {
      esp_ota_abort(g_otaHandle);
      g_otaActive = false;
      return;
    }
    mbedtls_sha256_update(&g_otaShaCtx, (const uint8_t *)val.data(), val.size());
    g_otaWritten += val.size();
  }
};

class ActivePresetCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) override {
    std::string val = pChar->getValue();
    if (val.empty()) return;
    strncpy(g_activeConfig.presetId, val.c_str(),
            sizeof(g_activeConfig.presetId) - 1);
  }
};

void bleServerInit() {
  configStoreLoad(&g_activeConfig);
  gearEngineSetConfig(&g_activeConfig);

  NimBLEDevice::init("Grannas-T56");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  NimBLEServer *server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService *service = server->createService(SERVICE_UUID);

  auto *deviceInfo = service->createCharacteristic(
      CHAR_DEVICE_INFO, NIMBLE_PROPERTY::READ);
  JsonDocument info;
  info["fwVersion"] = FW_VERSION;
  info["hwRev"] = "M5Stamp-C3";
  info["presetId"] = g_activeConfig.presetId;
  info["inputCount"] = INPUT_COUNT;
  info["outputCount"] = OUTPUT_COUNT;
  String infoStr;
  serializeJson(info, infoStr);
  deviceInfo->setValue(infoStr.c_str());

  g_liveStatusChar = service->createCharacteristic(
      CHAR_LIVE_STATUS, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  g_liveStatusChar->createDescriptor("2902");

  service->createCharacteristic(CHAR_ACTIVE_PRESET,
                                NIMBLE_PROPERTY::READ |
                                    NIMBLE_PROPERTY::WRITE)
      ->setCallbacks(new ActivePresetCallbacks());

  service->createCharacteristic(CHAR_CONFIG_CONTROL, NIMBLE_PROPERTY::WRITE)
      ->setCallbacks(new ConfigControlCallbacks());

  g_configDataChar = service->createCharacteristic(
      CHAR_CONFIG_DATA, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE);
  g_configDataChar->setCallbacks(new ConfigDataCallbacks());

  service->createCharacteristic(CHAR_OTA_CONTROL, NIMBLE_PROPERTY::WRITE)
      ->setCallbacks(new OtaControlCallbacks());

  service->createCharacteristic(CHAR_OTA_DATA, NIMBLE_PROPERTY::WRITE_NR)
      ->setCallbacks(new OtaDataCallbacks());

  service->start();

  NimBLEAdvertising *adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setName("Grannas-T56");
  adv->start();
}

void bleServerSetConfig(const ActiveConfig *config) {
  if (config) g_activeConfig = *config;
}

void bleServerNotifyStatus(const LiveStatus *status) {
  if (!g_connected || g_liveStatusChar == nullptr || status == nullptr) {
    return;
  }
  uint8_t buf[22];
  packLiveStatus(status, buf);
  g_liveStatusChar->setValue(buf, sizeof(buf));
  g_liveStatusChar->notify();
}

bool bleServerIsConnected() { return g_connected; }

bool bleServerApplyConfigJson(const char *json, size_t len) {
  ActiveConfig parsed;
  if (!configStoreParseJson(json, len, &parsed)) return false;
  g_activeConfig = parsed;
  gearEngineSetConfig(&g_activeConfig);
  return configStoreSave(&g_activeConfig);
}

bool bleServerOtaInProgress() { return g_otaActive; }
