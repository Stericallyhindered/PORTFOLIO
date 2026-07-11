import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../services/settings_repository.dart';
import '../../services/supabase_repository.dart';
import '../../theme/app_theme.dart';
import '../widgets/grid_scrim.dart';

/// Two-step Supabase onboarding for the Flutter app.
///
/// 1. **Sign in** — email + 6-digit OTP. Magic-link deep links are great but
///    require Android intent-filter wiring; OTPs work today with zero
///    platform code.
/// 2. **Pick or create a hub** — every grow room is one Supabase `hubs` row.
///    The app generates the hub id for normal users. In **debug** builds only,
///    an optional fixed UUID field exists for developers aligning legacy
///    compile-time firmware until NVS provisioning (Phase 2) ships.
///
/// The widget is purely view code; it talks to Supabase through
/// [SupabaseRepository] and persists the chosen hub via [SettingsRepository].
///
/// [onComplete] runs after hub bind; the caller may async-sync devices before
/// navigating away (see [SessionGate]).
class SupabaseAuthScreen extends StatefulWidget {
  const SupabaseAuthScreen({
    super.key,
    required this.onComplete,
  });

  /// Called after the user has signed in and chosen / created a hub (bound
  /// in [SettingsRepository]). Awaited by this screen so the shell can refresh
  /// Supabase / Tuya state before transition.
  final Future<void> Function() onComplete;

  @override
  State<SupabaseAuthScreen> createState() => _SupabaseAuthScreenState();
}

enum _AuthPhase { email, code, password, hub }

class _SupabaseAuthScreenState extends State<SupabaseAuthScreen> {
  final _repo = SupabaseRepository();
  final _emailCtl = TextEditingController();
  final _codeCtl = TextEditingController();
  final _passwordCtl = TextEditingController();
  final _hubNameCtl = TextEditingController(text: 'Tent 1');
  final _hubIdCtl = TextEditingController();

  _AuthPhase _phase = _AuthPhase.email;
  bool _busy = false;
  String? _error;
  List<HubRecord> _hubs = [];

  @override
  void initState() {
    super.initState();
    if (_repo.isSignedIn) {
      _phase = _AuthPhase.hub;
      _loadHubs();
    }
  }

  @override
  void dispose() {
    _emailCtl.dispose();
    _codeCtl.dispose();
    _passwordCtl.dispose();
    _hubNameCtl.dispose();
    _hubIdCtl.dispose();
    super.dispose();
  }

  Future<void> _signInWithPassword() async {
    final email = _emailCtl.text.trim();
    final password = _passwordCtl.text;
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter a valid email.');
      return;
    }
    if (password.isEmpty) {
      setState(() => _error = 'Enter your password.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _repo.signInWithPassword(email: email, password: password);
      if (!mounted) return;
      await _loadHubs();
      if (!mounted) return;
      setState(() => _phase = _AuthPhase.hub);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendOtp() async {
    final email = _emailCtl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter a valid email.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _repo.signInWithMagicLink(email);
      if (!mounted) return;
      setState(() => _phase = _AuthPhase.code);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyOtp() async {
    final email = _emailCtl.text.trim();
    final code = _codeCtl.text.trim();
    // Supabase OTP length is configurable in the dashboard (6–10 digits).
    // Accept anything in that range so a future config change doesn't break
    // login.
    if (code.length < 6 || code.length > 10) {
      setState(() => _error = 'Code must be 6–10 digits.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.verifyOTP(
        email: email,
        token: code,
        type: OtpType.email,
      );
      if (!mounted) return;
      await _loadHubs();
      if (!mounted) return;
      setState(() => _phase = _AuthPhase.hub);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loadHubs() async {
    try {
      final hubs = await _repo.listHubs();
      if (!mounted) return;
      if (hubs.length == 1) {
        await _bindHubAndCutover(hubs.single.id);
        if (!mounted) return;
        await widget.onComplete();
        return;
      }
      setState(() => _hubs = hubs);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Failed to load hubs: $e');
    }
  }

  Future<void> _createHub() async {
    final name = _hubNameCtl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Give your hub a name.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final idRaw = _hubIdCtl.text.trim();
      final hub = await _repo.createHub(
        name: name,
        id: idRaw.isEmpty ? null : idRaw,
      );
      if (!mounted) return;
      await _bindHubAndCutover(hub.id);
      if (!mounted) return;
      await widget.onComplete();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _selectHub(HubRecord hub) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _bindHubAndCutover(hub.id);
      if (!mounted) return;
      await widget.onComplete();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Bind the phone to [hubId]. The ESP32 already owns the climate loop;
  /// the phone is just a remote that reads/writes Supabase from anywhere.
  Future<void> _bindHubAndCutover(String hubId) async {
    final settings = context.read<SettingsRepository>();
    await settings.setActiveHubId(hubId);
    // Belt-and-suspenders: the default is already hubViaSupabase, but
    // legacy installs may have a stale `tuyaDirect` value persisted.
    await settings.setSource(ControllerSource.hubViaSupabase);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const GridScrim(intensity: 0.85),
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 28),
                      Text(
                        'GROWMIE CLOUD',
                        textAlign: TextAlign.center,
                        style: AppTheme.fontDisplay(20).copyWith(
                          letterSpacing: 5,
                          color: AppTheme.neonCyan.withOpacity(0.95),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _subtitle(),
                        textAlign: TextAlign.center,
                        style: AppTheme.fontMono(11, color: AppTheme.mutedText),
                      ),
                      const SizedBox(height: 22),
                      if (_error != null) _ErrorBanner(text: _error!),
                      if (_error != null) const SizedBox(height: 12),
                      _bodyForPhase(),
                      const SizedBox(height: 18),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _subtitle() {
    switch (_phase) {
      case _AuthPhase.email:
        return 'Sign in once. Your phone can then read the grow room from anywhere.';
      case _AuthPhase.code:
        return 'Enter the code we just emailed.';
      case _AuthPhase.password:
        return 'Sign in with email + password.';
      case _AuthPhase.hub:
        return 'Pick the hub this phone should follow, or create a new one.';
    }
  }

  Widget _bodyForPhase() {
    switch (_phase) {
      case _AuthPhase.email:
        return Column(
          children: [
            _LabeledField(
              label: 'EMAIL',
              child: TextField(
                controller: _emailCtl,
                enabled: !_busy,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                style: AppTheme.fontMono(13),
                decoration: const InputDecoration(
                  hintText: 'you@example.com',
                ),
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: _busy ? null : _sendOtp,
              child: Text(_busy ? 'Sending…' : 'Send code'),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _phase = _AuthPhase.password;
                        _error = null;
                      }),
              child: Text(
                'Use password instead',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
            ),
          ],
        );
      case _AuthPhase.password:
        return Column(
          children: [
            _LabeledField(
              label: 'EMAIL',
              child: TextField(
                controller: _emailCtl,
                enabled: !_busy,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                style: AppTheme.fontMono(13),
                decoration: const InputDecoration(
                  hintText: 'you@example.com',
                ),
              ),
            ),
            const SizedBox(height: 12),
            _LabeledField(
              label: 'PASSWORD',
              child: TextField(
                controller: _passwordCtl,
                enabled: !_busy,
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                style: AppTheme.fontMono(13),
                decoration: const InputDecoration(
                  hintText: '••••••••',
                ),
                onSubmitted: (_) => _signInWithPassword(),
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: _busy ? null : _signInWithPassword,
              child: Text(_busy ? 'Signing in…' : 'Sign in'),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _phase = _AuthPhase.email;
                        _passwordCtl.clear();
                        _error = null;
                      }),
              child: Text(
                'Use email code instead',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
            ),
          ],
        );
      case _AuthPhase.code:
        return Column(
          children: [
            _LabeledField(
              label: 'SIGN-IN CODE',
              child: TextField(
                controller: _codeCtl,
                enabled: !_busy,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                style: AppTheme.fontMono(15).copyWith(letterSpacing: 6),
                decoration: const InputDecoration(hintText: '----------'),
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: _busy ? null : _verifyOtp,
              child: Text(_busy ? 'Verifying…' : 'Verify'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _phase = _AuthPhase.email;
                        _codeCtl.clear();
                      }),
              child: Text(
                'Use a different email',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
            ),
          ],
        );
      case _AuthPhase.hub:
        return _hubPicker();
    }
  }

  Widget _hubPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_hubs.isNotEmpty) ...[
          for (final h in _hubs) ...[
            _HubTile(
              hub: h,
              busy: _busy,
              onTap: () => _selectHub(h),
            ),
            const SizedBox(height: 8),
          ],
          const Divider(height: 24),
        ],
        Text(
          _hubs.isEmpty ? 'CREATE YOUR FIRST HUB' : 'OR CREATE A NEW HUB',
          textAlign: TextAlign.center,
          style: AppTheme.fontMono(10, color: AppTheme.mutedText)
              .copyWith(letterSpacing: 1.6),
        ),
        const SizedBox(height: 10),
        _LabeledField(
          label: 'HUB NAME',
          child: TextField(
            controller: _hubNameCtl,
            enabled: !_busy,
            style: AppTheme.fontMono(13),
            decoration: const InputDecoration(
              hintText: 'Tent 1 / Closet / Veg Room',
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (kDebugMode) ...[
          Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              collapsedShape: const RoundedRectangleBorder(),
              shape: const RoundedRectangleBorder(),
              title: Text(
                'Developer · fixed hub UUID',
                style: AppTheme.fontMono(10, color: AppTheme.mutedText),
              ),
              childrenPadding: const EdgeInsets.only(bottom: 8),
              children: [
                _LabeledField(
                  label: 'HUB UUID',
                  child: TextField(
                    controller: _hubIdCtl,
                    enabled: !_busy,
                    style: AppTheme.fontMono(12),
                    autocorrect: false,
                    decoration: const InputDecoration(
                      hintText: 'Match compile-time GROWMIE_HUB_ID',
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Release builds hide this. Production uses app-generated ids '
                  'or future ESP32 provisioning.',
                  style: AppTheme.fontMono(9, color: AppTheme.mutedText),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        FilledButton(
          onPressed: _busy ? null : _createHub,
          child: Text(_busy ? 'Creating…' : 'Create hub'),
        ),
      ],
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: AppTheme.fontMono(10, color: AppTheme.mutedText)
              .copyWith(letterSpacing: 1.8),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

class _HubTile extends StatelessWidget {
  const _HubTile({
    required this.hub,
    required this.busy,
    required this.onTap,
  });

  final HubRecord hub;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: busy ? null : onTap,
      borderRadius: BorderRadius.circular(10),
      child: Ink(
        decoration: BoxDecoration(
          color: AppTheme.surfaceElevated.withOpacity(0.85),
          borderRadius: BorderRadius.circular(10),
          border:
              Border.all(color: AppTheme.neonCyan.withOpacity(0.20)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hub.name.isEmpty ? 'Unnamed hub' : hub.name,
                    style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 1.4),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hub.lastSeenAt == null
                        ? 'Never seen online · firmware not deployed yet'
                        : 'Last seen ${hub.lastSeenAt!.toLocal()}',
                    style: AppTheme.fontMono(10, color: AppTheme.mutedText),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right,
                color: AppTheme.neonCyan.withOpacity(0.7)),
          ],
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppTheme.alertOrange.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.alertOrange.withOpacity(0.35)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(
          text,
          style: AppTheme.fontMono(10, color: AppTheme.alertOrange),
        ),
      ),
    );
  }
}
