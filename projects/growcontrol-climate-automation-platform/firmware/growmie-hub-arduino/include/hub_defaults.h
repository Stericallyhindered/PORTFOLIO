#pragma once

// Optional compile-time hub + Supabase defaults (copy hub_secrets.example.h
// → hub_secrets.h — gitignored — so first flash works without typing long JWTs
// in the captive portal). Tuya credentials are no longer here: every device's
// local_key now lives in the Supabase `devices` table.
//
// Phase 2 (consumer provisioning): prefer storing `hubs.id` in NVS after a
// phone-driven setup step (QR or short code from the app) and reading it at
// boot so GROWMIE_HUB_ID is only a dev fallback. Until then, hub_secrets.h can
// mirror the UUID the Flutter app created for that grow room.

#if __has_include("hub_secrets.h")
#include "hub_secrets.h"
#else
#ifndef GROWMIE_SB_URL
#define GROWMIE_SB_URL ""
#endif
#ifndef GROWMIE_SB_ANON
#define GROWMIE_SB_ANON ""
#endif
#ifndef GROWMIE_SB_JWT
#define GROWMIE_SB_JWT ""
#endif
#ifndef GROWMIE_SB_SERVICE_ROLE
#define GROWMIE_SB_SERVICE_ROLE ""
#endif
#ifndef GROWMIE_HUB_ID
#define GROWMIE_HUB_ID ""
#endif
#ifndef GROWMIE_HUB_NAME
#define GROWMIE_HUB_NAME ""
#endif
#endif
