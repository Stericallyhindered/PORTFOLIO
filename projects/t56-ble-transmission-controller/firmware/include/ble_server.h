#pragma once

#include <stddef.h>

#include "types.h"

void bleServerInit();
void bleServerSetConfig(const ActiveConfig *config);
void bleServerNotifyStatus(const LiveStatus *status);
bool bleServerIsConnected();

// Config sync from JSON payload
bool bleServerApplyConfigJson(const char *json, size_t len);

// OTA
bool bleServerOtaInProgress();
