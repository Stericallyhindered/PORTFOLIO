#pragma once

#include "types.h"

void pwmCaptureInit();
void pwmCaptureUpdate();
PwmChannelState pwmCaptureGetInput(int index);

void pwmOutputInit();
void pwmOutputSet(int index, float dutyPct, float periodMs);
void pwmOutputDisableAll();
