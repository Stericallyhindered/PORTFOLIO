set(AWD_CORE_SRCS
  "src/ble_service.c"
  "src/can_rx.c"
  "src/derived_metrics.c"
  "src/e90_profile_decoder.c"
  "src/health_watchdog.c"
  "src/raw_log_buffer.c"
  "src/signal_store.c"
  "src/turbolamik_decoder.c"
  "src/vehicle_profile.c"
)

set(AWD_CORE_INCLUDE_DIRS "include")

if(COMMAND idf_component_register)
  idf_component_register(
    SRCS ${AWD_CORE_SRCS}
    INCLUDE_DIRS ${AWD_CORE_INCLUDE_DIRS}
  )
else()
  add_library(awd_core STATIC ${AWD_CORE_SRCS})
  target_include_directories(awd_core PUBLIC ${AWD_CORE_INCLUDE_DIRS})
  target_compile_features(awd_core PUBLIC c_std_11)
endif()
