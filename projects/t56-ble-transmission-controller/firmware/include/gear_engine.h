#pragma once

#include "types.h"

void gearEngineInit();
void gearEngineSetConfig(const ActiveConfig *config);
uint8_t gearEngineDetect(const PwmChannelState inputs[3]);
const GearRow *gearEngineGetRow(uint8_t gearIndex);
bool gearEngineOutputsDisabledForGear(uint8_t gearIndex);
void gearEngineApplyOutputs(uint8_t gearIndex);
