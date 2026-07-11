import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/supabase_env.dart';
import '../../services/session_auth_relauncher.dart';
import '../../services/settings_repository.dart';
import '../../services/supabase_repository.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/grid_scrim.dart';
import 'home_shell.dart';
import 'supabase_auth_screen.dart';

/// Boot order:
///   1. Supabase OTP sign-in + hub selection (only when needed).
///   2. Main shell.
///
/// If the user is already signed in and **exactly one** hub exists in
/// Supabase that they can see, we bind [SettingsRepository.activeHubId]
/// automatically — no hub picker, no serial paste, same as any consumer app
/// with a single "home".
///
/// The Tuya App SDK is no longer initialised at boot. The ESP32 hub talks
/// to every device on the LAN with the per-device `local_key` already stored
/// in Supabase, so the phone only needs Tuya for **pairing new hardware**.
/// That flow is triggered on-demand from the "Add device" sheet, which
/// lazily initialises the Tuya SDK and prompts for sign-in if needed.
class SessionGate extends StatefulWidget {
  const SessionGate({super.key});

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  var _phase = _GatePhase.checking;
  SessionAuthRelauncher? _relauncher;
  bool _relaunchHooked = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_relaunchHooked || !SupabaseEnv.hasCredentials) return;
    final r = context.read<SessionAuthRelauncher>();
    _relauncher = r;
    r.addListener(_onRelaunchAuthRequested);
    _relaunchHooked = true;
  }

  void _onRelaunchAuthRequested() {
    if (!mounted) return;
    setState(() => _phase = _GatePhase.needSupabase);
  }

  @override
  void dispose() {
    final r = _relauncher;
    if (r != null) {
      r.removeListener(_onRelaunchAuthRequested);
    }
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    if (!SupabaseEnv.hasCredentials) {
      if (mounted) setState(() => _phase = _GatePhase.ready);
      return;
    }

    final repo = SupabaseRepository();
    final settings = context.read<SettingsRepository>();

    if (!repo.isSignedIn) {
      if (mounted) setState(() => _phase = _GatePhase.needSupabase);
      return;
    }

    // Already bound from a prior session — go straight in.
    if (settings.activeHubId != null && settings.activeHubId!.isNotEmpty) {
      if (mounted) setState(() => _phase = _GatePhase.ready);
      return;
    }

    // Signed in but no local hub binding: pull hubs from Supabase and
    // auto-pick when there is exactly one (normal single-tent customer).
    if (mounted) setState(() => _phase = _GatePhase.checking);
    try {
      final hubs = await repo.listHubs();
      if (!mounted) return;
      if (hubs.length == 1) {
        await settings.setActiveHubId(hubs.single.id);
        await settings.setSource(ControllerSource.hubViaSupabase);
        await _syncHubInventoryAfterBind();
        if (mounted) setState(() => _phase = _GatePhase.ready);
        return;
      }
    } catch (_) {
      // Network / RLS — fall through to manual hub UI.
    }

    if (mounted) setState(() => _phase = _GatePhase.needSupabase);
  }

  /// After the user binds a hub (onboarding or auto-pick), pull Tuya inventory
  /// into Supabase when Smart Life is signed in, then refresh the primary
  /// gateway so Manual / Mesh show rows immediately.
  Future<void> _syncHubInventoryAfterBind() async {
    if (!mounted) return;
    try {
      final c = context.read<GrowRoomController>();
      final err = await c.pushTuyaHomeToSupabaseNow();
      await c.gateway.refreshDevices();
      if (mounted &&
          err != null &&
          err.isNotEmpty &&
          ScaffoldMessenger.maybeOf(context) != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err, style: AppTheme.fontMono(12))),
        );
      }
    } catch (_) {
      // Non-fatal — user can open Add device from the shell.
    }
  }

  Future<void> _afterHubOnboardingComplete() async {
    await _syncHubInventoryAfterBind();
    if (mounted) setState(() => _phase = _GatePhase.ready);
  }

  @override
  Widget build(BuildContext context) {
    switch (_phase) {
      case _GatePhase.checking:
        return Scaffold(
          body: Stack(
            fit: StackFit.expand,
            children: [
              const GridScrim(intensity: 0.75),
              SafeArea(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'GROWCONTROL',
                        style: AppTheme.fontDisplay(22).copyWith(
                          letterSpacing: 6,
                          color: AppTheme.neonCyan.withOpacity(0.92),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const CircularProgressIndicator(color: AppTheme.neonCyan),
                      const SizedBox(height: 16),
                      Text(
                        'Checking session…',
                        style: AppTheme.fontMono(11, color: AppTheme.mutedText),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      case _GatePhase.needSupabase:
        return SupabaseAuthScreen(
          onComplete: _afterHubOnboardingComplete,
        );
      case _GatePhase.ready:
        return const HomeShell();
    }
  }
}

enum _GatePhase { checking, needSupabase, ready }
