import 'dart:async';

import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import '../../config/tuya_env.dart';
import '../../domain/models/discovered_tuya_device.dart';
import '../../services/tuya_device_gateway.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import 'tuya_login_sheet.dart';

/// "Add device" sheet — scans for nearby Tuya devices in pairing mode (BLE)
/// and runs the Smart Life pair flow against the user's Wi-Fi. Once the
/// device joins the network its `localKey` lands in the SDK device model, and
/// [TuyaDeviceGateway] auto-pushes it into Supabase so the ESP32 hub can pick
/// up the device via Local Tuya within seconds.
///
/// The Tuya SDK is initialised lazily here — the first time the sheet opens
/// (and only then) we kick `initSdk` and, if the user isn't signed into
/// Smart Life yet, we open the Tuya login sheet. Normal app operation never
/// touches Tuya; pairing is the only flow that does.
Future<void> showAddTuyaDeviceSheet(BuildContext context) async {
  final ctrl = context.read<GrowRoomController>();
  // Ensure the lazy Tuya pairing gateway is initialised before we render the
  // sheet. This is cheap if the SDK is already up; if it isn't we show a
  // small "Initialising Tuya…" overlay while initSdk runs.
  final initFuture = ctrl.ensurePairingGateway();
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppTheme.bgMid,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
    ),
    builder: (ctx) => _AddDeviceBody(initFuture: initFuture),
  );
}

class _AddDeviceBody extends StatefulWidget {
  const _AddDeviceBody({required this.initFuture});

  /// Future that resolves once the lazy Tuya pairing gateway has finished
  /// initialising. We render an "Initialising…" placeholder until it does.
  final Future<TuyaDeviceGateway?> initFuture;

  @override
  State<_AddDeviceBody> createState() => _AddDeviceBodyState();
}

class _AddDeviceBodyState extends State<_AddDeviceBody> {
  StreamSubscription<DiscoveredTuyaDevice>? _sub;
  final List<DiscoveredTuyaDevice> _found = [];
  DiscoveredTuyaDevice? _selected;
  String? _error;
  String? _cloudPushBanner;
  bool _scanning = false;
  bool _pairing = false;
  bool _initialising = true;
  bool _initFailed = false;
  String? _initError;

  final _ssidCtl = TextEditingController();
  final _wifiPwdCtl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _waitForInit();
  }

  Future<void> _waitForInit() async {
    final g = await widget.initFuture;
    if (!mounted) return;
    if (g == null) {
      setState(() {
        _initialising = false;
        _initFailed = true;
        _initError = 'Tuya SDK not available on this platform.';
      });
      return;
    }
    setState(() {
      _initialising = false;
      _initFailed = g.sdkInitFailed;
      _initError = g.sdkInitError;
    });
    if (!g.sdkInitFailed && g.hasCloudSession) {
      await _syncTuyaInventoryToSupabaseUi();
    }
  }

  /// Pushes the Smart Life home list into Supabase and refreshes the primary
  /// (hub) device list so Manual / Devices tabs repopulate.
  Future<void> _syncTuyaInventoryToSupabaseUi() async {
    if (!mounted) return;
    final ctrl = context.read<GrowRoomController>();
    final err = await ctrl.pushTuyaHomeToSupabaseNow();
    await ctrl.gateway.refreshDevices();
    if (!mounted) return;
    setState(() => _cloudPushBanner = err);
  }

  /// Gateway accessor — null until the lazy init completes.
  TuyaDeviceGateway? get _gateway =>
      context.read<GrowRoomController>().tuyaGateway;

  /// Make sure the user is signed into Tuya before we try BLE discovery.
  /// After login (or if already signed in), syncs the Tuya home to Supabase
  /// so the hub-backed UI can show devices.
  Future<bool> _ensureTuyaSignedIn() async {
    final g = _gateway;
    if (g == null) return false;
    if (!g.hasCloudSession) {
      final result = await showTuyaLoginSheet(context);
      if (result != true || !g.hasCloudSession) return false;
    }
    await _syncTuyaInventoryToSupabaseUi();
    return true;
  }

  Future<void> _startScan() async {
    final g = _gateway;
    if (g == null || _initFailed) {
      setState(() => _error = _initError ?? 'Tuya SDK not ready.');
      return;
    }
    final ok = await _ensureTuyaSignedIn();
    if (!ok) {
      setState(() => _error = 'Tuya sign-in is required to scan for devices.');
      return;
    }
    // BLE on Android requires runtime permissions (bluetoothScan + location).
    await Permission.bluetoothScan.request();
    await Permission.bluetoothConnect.request();
    await Permission.locationWhenInUse.request();
    setState(() {
      _scanning = true;
      _found.clear();
      _selected = null;
      _error = null;
    });
    _sub?.cancel();
    _sub = g.discoverDevices().listen(
      (d) {
        // Deduplicate by uuid.
        if (_found.any((x) => x.uuid == d.uuid)) return;
        setState(() => _found.add(d));
      },
      onError: (Object e) {
        setState(() {
          _scanning = false;
          _error = 'Discovery failed: $e';
        });
      },
    );
  }

  Future<void> _stopScan() async {
    await _sub?.cancel();
    _sub = null;
    if (!mounted) return;
    setState(() => _scanning = false);
  }

  Future<void> _pair() async {
    final picked = _selected;
    if (picked == null) {
      setState(() => _error = 'Tap a discovered device first.');
      return;
    }
    final ssid = _ssidCtl.text.trim();
    final pwd = _wifiPwdCtl.text;
    if (ssid.isEmpty || pwd.isEmpty) {
      setState(() => _error = 'Wi-Fi SSID + password required.');
      return;
    }
    final g = _gateway;
    if (g == null) return;
    await _stopScan();
    setState(() {
      _pairing = true;
      _error = null;
    });
    final devId = await g.pairDevice(
      device: picked,
      ssid: ssid,
      password: pwd,
    );
    if (!mounted) return;
    if (devId == null) {
      setState(() {
        _pairing = false;
        _error =
            'Pairing failed. Make sure the device is in pairing mode and on '
            'the same 2.4 GHz network.';
      });
      return;
    }
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Paired $devId — syncing to Supabase…')),
    );
  }

  @override
  void dispose() {
    _sub?.cancel();
    _ssidCtl.dispose();
    _wifiPwdCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_initialising) {
      return Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppTheme.neonCyan),
            const SizedBox(height: 12),
            Text(
              'Initialising Tuya SDK…',
              style: AppTheme.fontMono(11, color: AppTheme.mutedText),
            ),
          ],
        ),
      );
    }
    if (_initFailed) {
      final err = _initError ?? '';
      final missingCompileKeys =
          err.contains('TUYA_APP_KEY') || !TuyaEnv.hasCredentials;
      return Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'TUYA SDK INIT FAILED',
              style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
            ),
            const SizedBox(height: 8),
            Text(
              err.isEmpty
                  ? 'The Tuya App SDK could not start on this device. '
                      'Pairing new hardware requires the SDK; the rest of the '
                      'app keeps working without it.'
                  : err,
              style: AppTheme.fontMono(11, color: AppTheme.alertOrange),
            ),
            if (missingCompileKeys) ...[
              const SizedBox(height: 14),
              Text(
                'This debug build was launched without Tuya App Key + Secret. '
                'They must be compiled in (they are not read from Supabase).\n\n'
                '1. Copy tuya_run.defines.env.example → tuya_run.defines.env '
                'and paste your keys from Tuya IoT → SDK Development → Get Key.\n\n'
                '2. Run:\n'
                'flutter run --dart-define-from-file=tuya_run.defines.env '
                '--dart-define-from-file=supabase_run.defines.env\n\n'
                'In VS Code / Cursor, use the launch configuration '
                '"growcontrol (device + define files)".',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
            ],
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    }
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(
                  'ADD DEVICE',
                  style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Put the device in pairing mode (hold its button until the LED '
              'flashes fast), then tap Scan. Pair flows on your 2.4 GHz Wi-Fi.',
              style: AppTheme.fontMono(11, color: AppTheme.mutedText),
            ),
            const SizedBox(height: 12),
            if (_cloudPushBanner != null) ...[
              DecoratedBox(
                decoration: BoxDecoration(
                  color: AppTheme.alertOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.alertOrange.withOpacity(0.35)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    _cloudPushBanner!,
                    style: AppTheme.fontMono(10, color: AppTheme.alertOrange),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Expanded(
                  child: FilledButton.tonalIcon(
                    icon: Icon(_scanning ? Icons.stop : Icons.radar),
                    label: Text(_scanning ? 'Stop scan' : 'Scan'),
                    onPressed: _pairing
                        ? null
                        : () => _scanning ? _stopScan() : _startScan(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_found.isEmpty)
              Text(
                _scanning
                    ? 'Scanning… nothing yet.'
                    : 'No devices found yet. Hit Scan.',
                style: AppTheme.fontMono(11, color: AppTheme.mutedText),
              )
            else
              Column(
                children: [
                  for (final d in _found)
                    RadioListTile<DiscoveredTuyaDevice>(
                      value: d,
                      groupValue: _selected,
                      onChanged: _pairing
                          ? null
                          : (v) => setState(() => _selected = v),
                      title: Text(d.name),
                      subtitle: Text(
                        '${d.productId} · ${d.uuid.substring(0, 8)}…',
                        style:
                            AppTheme.fontMono(11, color: AppTheme.mutedText),
                      ),
                    ),
                ],
              ),
            const SizedBox(height: 8),
            TextField(
              controller: _ssidCtl,
              enabled: !_pairing,
              decoration: const InputDecoration(
                labelText: 'Wi-Fi SSID (2.4 GHz)',
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _wifiPwdCtl,
              enabled: !_pairing,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Wi-Fi password'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!,
                  style: AppTheme.fontMono(11, color: AppTheme.alertOrange)),
            ],
            const SizedBox(height: 14),
            FilledButton(
              onPressed: _pairing ? null : _pair,
              child: Text(_pairing ? 'Pairing…' : 'Pair'),
            ),
          ],
        ),
      ),
    );
  }
}
