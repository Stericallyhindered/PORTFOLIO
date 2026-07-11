import 'package:flutter/foundation.dart';

/// One row in the BLE discovery stream surfaced by [TuyaDeviceGateway].
/// Discovery devices don't have a `devId` yet — that materialises after a
/// successful pair.
@immutable
class DiscoveredTuyaDevice {
  const DiscoveredTuyaDevice({
    required this.uuid,
    required this.productId,
    required this.name,
    this.iconUrl = '',
  });

  /// BLE advertisement UUID; pass back to [TuyaDeviceGateway.pairDevice].
  final String uuid;

  /// Tuya product id (catalog-level identifier, shared across all units of
  /// the same SKU).
  final String productId;

  /// Friendly name (often just the product type).
  final String name;
  final String iconUrl;
}
