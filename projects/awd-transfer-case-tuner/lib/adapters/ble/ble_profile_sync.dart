import '../../domain/profile.dart';
import '../../ports/profile_sync_port.dart';

/// Pushes serialized profiles when MCU protocol supports chunked writes.
class BleProfileSyncAdapter implements ProfileSyncPort {
  @override
  Future<void> pushProfile(Profile profile) async {
    throw UnsupportedError(
      'Profile sync requires finalized BLE characteristics — '
      'export JSON from the app until hardware protocol is ready.',
    );
  }
}
