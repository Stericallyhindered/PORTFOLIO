import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';

/// Tuya Smart Life sign-in panel. Uses the SDK's email-code flow by default
/// (no password to remember, no Tuya-Cloud subscription needed). Falls back
/// to email/password and phone/password for users who already have an
/// account.
///
/// We don't store the session ourselves — the native SDK does. After a
/// successful login we just flip [GrowRoomController.hasTuyaCloudSession] and
/// the session gate proceeds to the home shell.
class TuyaLoginPanel extends StatefulWidget {
  const TuyaLoginPanel({
    super.key,
    required this.onComplete,
    this.onSkip,
  });

  /// Called when the user successfully signs in. The caller is responsible
  /// for moving past the gate.
  final VoidCallback onComplete;

  /// Optional — when non-null we render a "Skip Tuya — use ESP32 hub only"
  /// button below the form. Tapping flips the Source toggle to
  /// `hubViaSupabase` and proceeds without a Tuya session.
  final VoidCallback? onSkip;

  @override
  State<TuyaLoginPanel> createState() => _TuyaLoginPanelState();
}

enum _Mode { emailCode, emailPwd, phonePwd, register }

class _TuyaLoginPanelState extends State<TuyaLoginPanel> {
  _Mode _mode = _Mode.emailCode;
  final _country = TextEditingController(text: '+1');
  final _id = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();
  bool _busy = false;
  bool _codeSent = false;
  String? _info;
  String? _error;

  @override
  void dispose() {
    _country.dispose();
    _id.dispose();
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final ctrl = context.read<GrowRoomController>();
    final email = _id.text.trim();
    final cc = _country.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Enter your email first.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
      _info = null;
    });
    final ok = await ctrl.tuyaSendEmailCode(email: email, countryCode: cc);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _codeSent = ok;
      _info = ok
          ? 'Code sent. Check your inbox.'
          : null;
      _error = ok ? null : 'Tuya refused to send the code. Check email + region.';
    });
  }

  Future<void> _submit() async {
    final ctrl = context.read<GrowRoomController>();
    setState(() {
      _busy = true;
      _error = null;
      _info = null;
    });
    bool ok = false;
    try {
      switch (_mode) {
        case _Mode.emailCode:
          ok = await ctrl.tuyaLoginWithEmailCode(
            email: _id.text.trim(),
            countryCode: _country.text.trim(),
            code: _code.text.trim(),
          );
          break;
        case _Mode.emailPwd:
          ok = await ctrl.tuyaLoginWithUserNamePassword(
            username: _id.text.trim(),
            countryCode: _country.text.trim(),
            password: _password.text,
          );
          break;
        case _Mode.phonePwd:
          ok = await ctrl.tuyaLoginWithPhonePassword(
            phone: _id.text.trim(),
            countryCode: _country.text.trim(),
            password: _password.text,
          );
          break;
        case _Mode.register:
          ok = await ctrl.tuyaRegisterWithEmail(
            email: _id.text.trim(),
            countryCode: _country.text.trim(),
            code: _code.text.trim(),
            password: _password.text,
          );
          if (ok) {
            // Auto-login after register.
            ok = await ctrl.tuyaLoginWithUserNamePassword(
              username: _id.text.trim(),
              countryCode: _country.text.trim(),
              password: _password.text,
            );
          }
          break;
      }
    } catch (e) {
      ok = false;
      _error = '$e';
    }
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (ok) {
        _info = 'Signed in.';
      } else {
        _error ??= ctrl.tuyaLoginFailure ?? 'Tuya rejected the credentials.';
      }
    });
    if (ok) widget.onComplete();
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = context.watch<GrowRoomController>();
    final initFail = ctrl.tuyaInitFailure;
    final showCode = _mode == _Mode.emailCode || _mode == _Mode.register;
    final showPwd = _mode != _Mode.emailCode;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'TUYA SMART LIFE SIGN IN',
            style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'One-time. The SDK caches your session locally. Free tier — no '
            'Tuya cloud subscription needed.',
            textAlign: TextAlign.center,
            style: AppTheme.fontMono(11, color: AppTheme.mutedText),
          ),
          if (initFail != null) ...[
            const SizedBox(height: 8),
            Text(
              'SDK init failed: $initFail',
              style: AppTheme.fontMono(11, color: AppTheme.alertOrange),
            ),
          ],
          const SizedBox(height: 14),
          SegmentedButton<_Mode>(
            segments: const [
              ButtonSegment(value: _Mode.emailCode, label: Text('Email code')),
              ButtonSegment(value: _Mode.emailPwd, label: Text('Email pwd')),
              ButtonSegment(value: _Mode.phonePwd, label: Text('Phone pwd')),
              ButtonSegment(value: _Mode.register, label: Text('Register')),
            ],
            selected: {_mode},
            onSelectionChanged: (s) => setState(() {
              _mode = s.first;
              _info = null;
              _error = null;
              _codeSent = false;
            }),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              SizedBox(
                width: 84,
                child: TextField(
                  controller: _country,
                  enabled: !_busy,
                  decoration: const InputDecoration(labelText: 'Country'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _id,
                  enabled: !_busy,
                  decoration: InputDecoration(
                    labelText: _mode == _Mode.phonePwd ? 'Phone' : 'Email',
                    hintText:
                        _mode == _Mode.phonePwd ? '5551234567' : 'you@you.com',
                  ),
                  keyboardType: _mode == _Mode.phonePwd
                      ? TextInputType.phone
                      : TextInputType.emailAddress,
                ),
              ),
            ],
          ),
          if (showPwd) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _password,
              enabled: !_busy,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
          ],
          if (showCode) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _code,
                    enabled: !_busy,
                    maxLength: 6,
                    decoration: const InputDecoration(
                      labelText: 'Verification code',
                      counterText: '',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.tonal(
                  onPressed: _busy ? null : _sendCode,
                  child: Text(_codeSent ? 'Resend' : 'Send code'),
                ),
              ],
            ),
          ],
          if (_info != null) ...[
            const SizedBox(height: 8),
            Text(_info!, style: AppTheme.fontMono(11, color: AppTheme.neonCyan)),
          ],
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!,
                style: AppTheme.fontMono(11, color: AppTheme.alertOrange)),
          ],
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy
                ? 'Working…'
                : _mode == _Mode.register
                    ? 'Create account'
                    : 'Sign in'),
          ),
          if (widget.onSkip != null) ...[
            const SizedBox(height: 6),
            TextButton(
              onPressed: _busy ? null : widget.onSkip,
              child: const Text('Skip — use ESP32 hub only (no manual control)'),
            ),
          ],
        ],
      ),
    );
  }
}
