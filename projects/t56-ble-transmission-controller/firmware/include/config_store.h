#pragma once

#include <stddef.h>

#include "types.h"

bool configStoreInit(ActiveConfig *out);
bool configStoreSave(const ActiveConfig *config);
bool configStoreLoad(ActiveConfig *out);
bool configStoreParseJson(const char *json, size_t len, ActiveConfig *out);
void configStoreLoadDefault(ActiveConfig *out);
