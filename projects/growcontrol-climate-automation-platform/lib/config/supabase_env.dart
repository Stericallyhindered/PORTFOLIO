/// Compile-time Supabase project credentials.
///
/// Pass these via `--dart-define-from-file=supabase_run.defines.env` (the
/// preferred dev flow, alongside the existing `tuya_run.defines.env`):
///
/// ```
/// flutter run --dart-define-from-file=tuya_run.defines.env \
///             --dart-define-from-file=supabase_run.defines.env
/// ```
///
/// The "publishable" / anon key is safe to ship inside the app — RLS gates
/// every read and write. The service-role key must NEVER be compiled in here
/// or anywhere in the client; it lives on the ESP32 hub (provisioned at
/// setup time, persisted to NVS) and on any future Edge Functions.
class SupabaseEnv {
  SupabaseEnv._();

  static const String url = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const String anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  /// `true` once both compile-time defines are non-empty. Until then the
  /// app falls back to the legacy `Tuya direct` source: it logs locally and
  /// controls the room over Tuya cloud the same way it did before Supabase
  /// landed.
  static bool get hasCredentials => url.isNotEmpty && anonKey.isNotEmpty;
}
