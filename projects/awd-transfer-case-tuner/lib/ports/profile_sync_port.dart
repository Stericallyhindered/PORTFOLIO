import '../domain/profile.dart';

abstract class ProfileSyncPort {
  Future<void> pushProfile(Profile profile);
}
