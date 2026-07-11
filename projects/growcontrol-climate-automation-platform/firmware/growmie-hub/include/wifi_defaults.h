#pragma once

// Optional first-boot WiFi without typing SSID in the captive portal.
//
// Copy `wifi_secrets.h.example` → `wifi_secrets.h` and fill in your home AP.
// `wifi_secrets.h` is gitignored — never commit real passwords.
//
// If `wifi_secrets.h` is missing, all macros expand to empty strings (portal
// flow unchanged).

#if __has_include("wifi_secrets.h")
#include "wifi_secrets.h"
#else
#ifndef GROWMIE_DEFAULT_WIFI_SSID
#define GROWMIE_DEFAULT_WIFI_SSID ""
#endif
#ifndef GROWMIE_DEFAULT_WIFI_PASSWORD
#define GROWMIE_DEFAULT_WIFI_PASSWORD ""
#endif
#endif
