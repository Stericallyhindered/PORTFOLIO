#include "config_store.h"
#include "pins.h"

#include <ArduinoJson.h>
#include <Preferences.h>
#include <string.h>

static const char *NVS_NS = "grannas";
static const char *NVS_KEY = "preset_json";

static void setRow(GearRow *row, uint8_t idx, float d0, float d1, float d2) {
  row->gearIndex = idx;
  row->inputDuty[0] = d0;
  row->inputDuty[1] = d1;
  row->inputDuty[2] = d2;
  row->inputPeriod[0] = 4.0f;
  row->inputPeriod[1] = 4.04f;
  row->inputPeriod[2] = 4.0f;
  row->outputDuty[0] = 0;
  row->outputDuty[1] = 0;
  row->outputPeriod[0] = 4.0f;
  row->outputPeriod[1] = 4.0f;
}

void configStoreLoadDefault(ActiveConfig *out) {
  memset(out, 0, sizeof(ActiveConfig));
  strncpy(out->presetId, "t56_stock", sizeof(out->presetId) - 1);
  out->matchTolerancePct = 2.0f;
  out->gearCount = 8;

  setRow(&out->gears[0], GEAR_NEUTRAL, 29.0f, 41.5f, 41.0f);
  setRow(&out->gears[1], GEAR_1ST, 20.0f, 20.7f, 63.0f);
  setRow(&out->gears[2], GEAR_2ND, 20.0f, 20.0f, 18.8f);
  setRow(&out->gears[3], GEAR_3RD, 40.5f, 41.5f, 63.0f);
  setRow(&out->gears[4], GEAR_4TH, 40.5f, 41.5f, 17.0f);
  setRow(&out->gears[5], GEAR_5TH, 60.3f, 60.3f, 62.0f);
  setRow(&out->gears[6], GEAR_6TH, 60.3f, 60.3f, 17.0f);
  setRow(&out->gears[7], GEAR_REVERSE, 81.1f, 81.0f, 61.0f);
}

static bool parseConfigJson(const char *json, size_t len, ActiveConfig *out) {
  JsonDocument doc;
  if (deserializeJson(doc, json, len) != DeserializationError::Ok) {
    return false;
  }

  configStoreLoadDefault(out);

  const char *id = doc["id"] | "t56_stock";
  strncpy(out->presetId, id, sizeof(out->presetId) - 1);
  out->matchTolerancePct = doc["matchTolerancePct"] | 2.0f;

  JsonArray gears = doc["gears"].as<JsonArray>();
  if (gears.isNull()) {
    return false;
  }

  static const char *gearNames[] = {"Neutral", "1st", "2nd", "3rd",
                                    "4th",     "5th", "6th", "Reverse"};
  int count = 0;
  for (JsonObject g : gears) {
    if (count >= 8) break;
    const char *name = g["gear"] | "";
    uint8_t idx = GEAR_UNKNOWN;
    for (int i = 0; i < 8; i++) {
      if (strcmp(name, gearNames[i]) == 0) {
        idx = i;
        break;
      }
    }
    if (idx == GEAR_UNKNOWN) continue;

    GearRow *row = &out->gears[count];
    row->gearIndex = idx;
    JsonArray inputs = g["inputs"].as<JsonArray>();
    JsonArray outputs = g["outputs"].as<JsonArray>();
    for (int i = 0; i < 3 && i < (int)inputs.size(); i++) {
      row->inputDuty[i] = inputs[i]["dutyPct"] | 0.0f;
      row->inputPeriod[i] = inputs[i]["periodMs"] | 4.0f;
    }
    for (int i = 0; i < 2 && i < (int)outputs.size(); i++) {
      row->outputDuty[i] = outputs[i]["dutyPct"] | 0.0f;
      row->outputPeriod[i] = outputs[i]["periodMs"] | 4.0f;
    }
    count++;
  }
  out->gearCount = count > 0 ? count : 8;
  return true;
}

bool configStoreInit(ActiveConfig *out) {
  return configStoreLoad(out);
}

bool configStoreLoad(ActiveConfig *out) {
  Preferences prefs;
  if (!prefs.begin(NVS_NS, true)) {
    configStoreLoadDefault(out);
    return false;
  }
  String json = prefs.getString(NVS_KEY, "");
  prefs.end();
  if (json.length() == 0) {
    configStoreLoadDefault(out);
    return false;
  }
  return parseConfigJson(json.c_str(), json.length(), out);
}

bool configStoreSave(const ActiveConfig *config) {
  // Re-serialize minimal JSON for NVS storage
  JsonDocument doc;
  doc["id"] = config->presetId;
  doc["matchTolerancePct"] = config->matchTolerancePct;
  doc["inputCount"] = INPUT_COUNT;
  doc["outputCount"] = OUTPUT_COUNT;

  static const char *gearNames[] = {"Neutral", "1st", "2nd", "3rd",
                                    "4th",     "5th", "6th", "Reverse"};
  JsonArray gears = doc["gears"].to<JsonArray>();
  for (int g = 0; g < config->gearCount; g++) {
    const GearRow *row = &config->gears[g];
    JsonObject go = gears.add<JsonObject>();
    go["gear"] = gearNames[row->gearIndex];
    JsonArray ins = go["inputs"].to<JsonArray>();
    JsonArray outs = go["outputs"].to<JsonArray>();
    for (int i = 0; i < 3; i++) {
      JsonObject ch = ins.add<JsonObject>();
      ch["dutyPct"] = row->inputDuty[i];
      ch["periodMs"] = row->inputPeriod[i];
      ch["vavg"] = 0;
      ch["vrms"] = 0;
      ch["vmax"] = 0;
      ch["vmin"] = 0;
    }
    for (int i = 0; i < 2; i++) {
      JsonObject ch = outs.add<JsonObject>();
      ch["dutyPct"] = row->outputDuty[i];
      ch["periodMs"] = row->outputPeriod[i];
      ch["vavg"] = 0;
      ch["vrms"] = 0;
      ch["vmax"] = 0;
      ch["vmin"] = 0;
    }
  }

  String serialized;
  serializeJson(doc, serialized);

  Preferences prefs;
  if (!prefs.begin(NVS_NS, false)) {
    return false;
  }
  bool ok = prefs.putString(NVS_KEY, serialized) > 0;
  prefs.end();
  return ok;
}

bool configStoreParseJson(const char *json, size_t len, ActiveConfig *out) {
  return parseConfigJson(json, len, out);
}
