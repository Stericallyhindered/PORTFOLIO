import 'package:flutter/foundation.dart';

/// Lets deep UI (e.g. pushed routes) ask [SessionGate] to show Supabase sign-in
/// again after [SupabaseRepository.signOut] without a full app restart.
class SessionAuthRelauncher extends ChangeNotifier {
  void showSupabaseSignIn() {
    notifyListeners();
  }
}
