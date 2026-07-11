import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/supabase_env.dart';
import '../../services/session_auth_relauncher.dart';
import '../../services/settings_repository.dart';
import '../../services/supabase_repository.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/hub_pairing_sheet.dart';

/// Pick which Supabase `hubs` row this phone follows (same list as sign-in).
/// Binds [SettingsRepository.activeHubId] and refreshes the Supabase-backed
/// device gateway so Mesh / Manual repopulate without reinstalling the app.
class HubSwitchScreen extends StatefulWidget {
  const HubSwitchScreen({super.key});

  @override
  State<HubSwitchScreen> createState() => _HubSwitchScreenState();
}

class _HubSwitchScreenState extends State<HubSwitchScreen> {
  Future<List<HubRecord>>? _hubsFuture;

  SupabaseRepository _repo(BuildContext context) {
    try {
      return context.read<SupabaseRepository>();
    } catch (_) {
      return SupabaseRepository();
    }
  }

  Future<void> _select(HubRecord h) async {
    final settings = context.read<SettingsRepository>();
    final room = context.read<GrowRoomController>();
    await settings.setActiveHubId(h.id);
    await settings.setSource(ControllerSource.hubViaSupabase);
    await room.pushTuyaHomeToSupabaseNow();
    await room.gateway.refreshDevices();
    if (mounted) Navigator.of(context).pop(true);
  }

  Future<void> _signOutOfCloud() async {
    final settings = context.read<SettingsRepository>();
    final repo = _repo(context);
    try {
      if (repo.isSignedIn) {
        await repo.signOut();
      }
      await settings.setActiveHubId(null);
      if (!mounted) return;
      context.read<SessionAuthRelauncher>().showSupabaseSignIn();
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e', style: AppTheme.fontMono(12))),
      );
    }
  }

  Widget _signOutFooter() {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        children: [
          TextButton.icon(
            onPressed: _signOutOfCloud,
            icon: Icon(
              Icons.logout,
              color: AppTheme.alertOrange.withOpacity(0.95),
            ),
            label: Text(
              'SIGN OUT OF CLOUD',
              style: AppTheme.fontMono(11, color: AppTheme.alertOrange)
                  .copyWith(letterSpacing: 1.2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'Return to email sign-in. '
              'Tuya / Smart Life stays logged in until you clear app data.',
              textAlign: TextAlign.center,
              style: AppTheme.fontMono(10, color: AppTheme.mutedText),
            ),
          ),
        ],
      ),
    );
  }

  Widget _hubRow(HubRecord h, String? currentId) {
    final selected = h.id == currentId;
    return InkWell(
      onTap: () => _select(h),
      borderRadius: BorderRadius.circular(10),
      child: Ink(
        decoration: BoxDecoration(
          color: AppTheme.surfaceElevated.withOpacity(0.85),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected
                ? AppTheme.neonCyan.withOpacity(0.55)
                : AppTheme.neonCyan.withOpacity(0.15),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    h.name.isEmpty ? 'Unnamed hub' : h.name,
                    style:
                        AppTheme.fontDisplay(14).copyWith(letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    h.id,
                    style: AppTheme.fontMono(9, color: AppTheme.mutedText),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    h.lastSeenAt == null
                        ? 'Never seen online'
                        : 'Last seen ${h.lastSeenAt!.toLocal()}',
                    style: AppTheme.fontMono(10, color: AppTheme.mutedText),
                  ),
                ],
              ),
            ),
            if (selected)
              Text(
                'ACTIVE',
                style: AppTheme.fontMono(9, color: AppTheme.neonCyan)
                    .copyWith(letterSpacing: 1.4),
              )
            else
              Icon(
                Icons.chevron_right,
                color: AppTheme.neonCyan.withOpacity(0.7),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!SupabaseEnv.hasCredentials) {
      return Scaffold(
        appBar: AppBar(title: const Text('Grow room')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Supabase is not configured in this build.',
              textAlign: TextAlign.center,
              style: AppTheme.fontMono(12, color: AppTheme.mutedText),
            ),
          ),
        ),
      );
    }

    final currentId = context.watch<SettingsRepository>().activeHubId;
    _hubsFuture ??= _repo(context).listHubs();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'GROW ROOM',
          style: AppTheme.fontDisplay(14).copyWith(letterSpacing: 2),
        ),
        actions: [
          if (currentId != null && currentId.isNotEmpty)
            IconButton(
              tooltip: 'Hub UUID & QR for hardware',
              icon: const Icon(Icons.qr_code_2_outlined),
              onPressed: () => showHubPairingSheet(context, hubId: currentId),
            ),
        ],
      ),
      body: FutureBuilder<List<HubRecord>>(
        future: _hubsFuture,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.neonCyan),
            );
          }
          if (snap.hasError) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 28),
              children: [
                Text(
                  '${snap.error}',
                  textAlign: TextAlign.center,
                  style: AppTheme.fontMono(11, color: AppTheme.alertOrange),
                ),
                _signOutFooter(),
              ],
            );
          }
          final hubs = snap.data ?? [];
          if (hubs.isEmpty) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 28),
              children: [
                Text(
                  'No grow rooms in the cloud yet.\n'
                  'Sign out and sign back in to create your first hub, '
                  'or ask another member to invite you.',
                  textAlign: TextAlign.center,
                  style: AppTheme.fontMono(12, color: AppTheme.mutedText),
                ),
                _signOutFooter(),
              ],
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            children: [
              for (var i = 0; i < hubs.length; i++) ...[
                if (i > 0) const SizedBox(height: 8),
                _hubRow(hubs[i], currentId),
              ],
              _signOutFooter(),
            ],
          );
        },
      ),
    );
  }
}
