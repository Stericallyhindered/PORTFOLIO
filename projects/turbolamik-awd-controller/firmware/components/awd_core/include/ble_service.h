#ifndef BLE_SERVICE_H
#define BLE_SERVICE_H

#include "awd_types.h"

typedef struct {
  bool initialized;
  bool connected;
  uint32_t published_snapshots;
  uint32_t published_health_updates;
} ble_service_t;

void ble_service_init(ble_service_t *service);
void ble_service_set_connection(ble_service_t *service, bool connected);
void ble_service_publish_snapshot(ble_service_t *service, const live_snapshot_t *snapshot);
void ble_service_publish_health(ble_service_t *service, const health_status_t *status);
void ble_service_apply_capture_request(ble_service_t *service, capture_control_t *capture, bool enabled);

#endif
