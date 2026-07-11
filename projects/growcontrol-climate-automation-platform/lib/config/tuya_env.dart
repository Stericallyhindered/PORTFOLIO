/// Tuya App SDK credentials (free tier — never expires, no usage tracking).
///
/// These come from the [Tuya IoT Console](https://platform.tuya.com/) →
/// SDK Development → your app → **Get SDK** tab → "Get Key" (App Key + App
/// Secret). The third arg (`TUYA_LICENSE_KEY`) is the optional license text
/// some SDK bundles ship; for the standard Android `security-algorithm-*.aar`
/// flow it's blank.
///
/// All three are compiled in via `--dart-define` (or `--dart-define-from-file`):
///
/// ```
/// flutter run \
///   --dart-define=TUYA_APP_KEY=mwjy4rp8hrxgsnvyeyhj \
///   --dart-define=TUYA_APP_SECRET=bc28f102df124f01852931ad8cbc88f2 \
///   --dart-define=TUYA_LICENSE_KEY=
/// ```
///
/// (Or use `tuya_run.defines.env.example` as a template for
/// `tuya_run.defines.env` and pass `--dart-define-from-file=tuya_run.defines.env`.)
class TuyaEnv {
  TuyaEnv._();

  static const String appKey = String.fromEnvironment(
    'TUYA_APP_KEY',
    defaultValue: '',
  );

  static const String appSecret = String.fromEnvironment(
    'TUYA_APP_SECRET',
    defaultValue: '',
  );

  /// Third arg to `initSdk` — usually empty when the security `.aar` is in
  /// `android/app/libs`.
  static const String licenseKey = String.fromEnvironment(
    'TUYA_LICENSE_KEY',
    defaultValue: '',
  );

  /// Default DP id for on/off smart plugs (most outlets use `1`).
  static const String defaultSwitchDpId = String.fromEnvironment(
    'TUYA_SWITCH_DP',
    defaultValue: '1',
  );

  /// True when both App Key and App Secret are baked into the build. The
  /// session-gate splash uses this to decide whether to show the Tuya login
  /// step.
  static bool get hasCredentials =>
      appKey.isNotEmpty && appSecret.isNotEmpty;

  /// Optional sensor DP overrides — only set these if your hardware uses
  /// non-default DPs. Most Wi-Fi temp/humidity sticks ship `2`/`3`.
  static const String sensorTempDp = String.fromEnvironment(
    'TUYA_SENSOR_TEMP_DP',
    defaultValue: '',
  );
  static const String sensorRhDp = String.fromEnvironment(
    'TUYA_SENSOR_RH_DP',
    defaultValue: '',
  );
}
