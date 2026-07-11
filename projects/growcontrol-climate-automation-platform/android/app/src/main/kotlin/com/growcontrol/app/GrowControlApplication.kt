package com.growcontrol.app

import android.app.Application
import com.thingclips.smart.home.sdk.ThingHomeSdk

/// Registers Thing Application context before user/storage APIs run (avoids NPE in ThingSmartUserCoreManager).
///
/// Init is the single, documented Tuya SmartLife App SDK path:
/// https://developer.tuya.com/en/docs/app-development/integrated?id=Ka69nt96cw0uj (Step 6).
/// Reads THING_SMART_APPKEY / THING_SMART_SECRET from AndroidManifest meta-data.
/// `setDebugMode(true)` (Step 8) gives richer login/network logs in debug builds.
class GrowControlApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ThingHomeSdk.init(this)
        ThingHomeSdk.setDebugMode(true)
    }
}
