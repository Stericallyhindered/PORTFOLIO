#include "ble_service.h"

void ble_service_init(ble_service_t *service) {
  service->initialized = true;
  service->connected = false;
  service->published_snapshots = 0U;
  service->published_health_updates = 0U;
}

void ble_service_set_connection(ble_service_t *service, bool connected) {
  service->connected = connected;
}

void ble_service_publish_snapshot(ble_service_t *service, const live_snapshot_t *snapshot) {
  (void)snapshot;
  service->published_snapshots += 1U;
}

void ble_service_publish_health(ble_service_t *service, const health_status_t *status) {
  (void)status;
  service->published_health_updates += 1U;
}

void ble_service_apply_capture_request(ble_service_t *service, capture_control_t *capture, bool enabled) {
  (void)service;
  capture->enabled = enabled;
  capture->frames_captured = 0U;
}
