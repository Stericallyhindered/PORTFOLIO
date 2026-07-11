import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/supabase_env.dart';
import '../../services/settings_repository.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/add_tuya_device_sheet.dart';
import '../widgets/grid_scrim.dart';
import '../widgets/scene_editor_sheet.dart';
import 'calibration_page.dart';
import 'dashboard_page.dart';
import 'devices_page.dart';
import 'hub_switch_screen.dart';
import 'logs_page.dart';
import 'manual_page.dart';
import 'scenes_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;

  /// Bottom-nav index of the Manual tab. Must stay in sync with the children
  /// list inside the IndexedStack below.
  static const int _manualTabIndex = 2;

  /// Bottom-nav index of the Automation (scenes) tab — FAB is owned here so it
  /// docks above the Material 3 [NavigationBar] and receives taps reliably.
  static const int _automationTabIndex = 3;

  @override
  void initState() {
    super.initState();
    // Sync the controller's "manual tab visible" flag to whatever tab the
    // shell starts on (default 0 → false). Done in a post-frame callback so
    // the Provider tree is fully built before we read it.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context
          .read<GrowRoomController>()
          .setManualTabActive(index == _manualTabIndex);
    });
  }

  void _selectTab(int i) {
    setState(() => index = i);
    // Manual tab focus drives an automation-pause latch on the controller —
    // see GrowRoomController.setManualTabActive. Leaving the tab clears any
    // held device ids and forces a fresh climate evaluation.
    context
        .read<GrowRoomController>()
        .setManualTabActive(i == _manualTabIndex);
  }

  static const _titles = [
    'GROWMIE',
    'DEVICES',
    'MANUAL',
    'AUTOMATION',
    'LOGS',
    'CALIBRATE',
  ];

  static const _subtitles = [
    'SMART CONTROLLER',
    null,
    null,
    null,
    null,
    null,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: false,
      floatingActionButton: index == _automationTabIndex
          ? FloatingActionButton.extended(
              heroTag: 'scene_add',
              icon: const Icon(Icons.add),
              label: const Text('NEW AUTOMATION'),
              onPressed: () => showSceneEditorSheet(context),
            )
          : null,
      floatingActionButtonLocation: index == _automationTabIndex
          ? FloatingActionButtonLocation.endContained
          : FloatingActionButtonLocation.endFloat,
      appBar: AppBar(
        title: Builder(builder: (context) {
          final sub = _subtitles[index];
          if (sub == null) {
            return Text(
              _titles[index],
              style: AppTheme.fontDisplay(17).copyWith(letterSpacing: 3),
            );
          }
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _titles[index],
                style: AppTheme.fontDisplay(17).copyWith(letterSpacing: 3),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Text(
                  sub,
                  style: AppTheme.fontMono(9, color: AppTheme.mutedText)
                      .copyWith(letterSpacing: 3),
                ),
              ),
            ],
          );
        }),
        actions: [
          if (SupabaseEnv.hasCredentials)
            IconButton(
              tooltip: 'Switch grow room',
              icon: const Icon(Icons.home_work_outlined),
              onPressed: () async {
                await Navigator.of(context).push<void>(
                  MaterialPageRoute<void>(
                    builder: (_) => const HubSwitchScreen(),
                  ),
                );
              },
            ),
          // HUB badge — once a hub is bound, this is always lit (the phone
          // only operates in hub mode now).
          Consumer<SettingsRepository>(
            builder: (context, settings, _) {
              if (settings.activeHubId == null) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.neonCyan.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: AppTheme.neonCyan.withOpacity(0.55),
                      ),
                    ),
                    child: Text(
                      'HUB',
                      style: AppTheme.fontMono(9, color: AppTheme.neonCyan)
                          .copyWith(letterSpacing: 1.6),
                    ),
                  ),
                ),
              );
            },
          ),
          // Radar / pair button — only renders on Android/iOS where the
          // Tuya SDK can run. Lazily initialises the pairing gateway on tap.
          Consumer<GrowRoomController>(
            builder: (context, room, _) {
              if (!room.usesNativeTuya) return const SizedBox.shrink();
              return IconButton(
                tooltip: 'Scan / add device',
                icon: const Icon(Icons.radar),
                onPressed: () => showAddTuyaDeviceSheet(context),
              );
            },
          ),
        ],
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppTheme.bgDeep.withOpacity(0.97),
                AppTheme.bgDeep.withOpacity(0.65),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const GridScrim(intensity: 0.55),
          SafeArea(
            bottom: false,
            child: IndexedStack(
              index: index,
              children: const [
                DashboardPage(),
                DevicesPage(),
                ManualPage(),
                ScenesPage(),
                LogsPage(),
                CalibrationPage(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          labelTextStyle: WidgetStateProperty.resolveWith((s) {
            final sel = s.contains(WidgetState.selected);
            return AppTheme.fontMono(
              10,
              color: sel ? AppTheme.neonCyan : AppTheme.mutedText,
            );
          }),
        ),
        child: NavigationBar(
          height: 68,
          selectedIndex: index,
          onDestinationSelected: _selectTab,
          destinations: [
            NavigationDestination(
              icon: Icon(Icons.radar,
                  color: AppTheme.mutedText.withOpacity(0.9)),
              selectedIcon:
                  const Icon(Icons.radar, color: AppTheme.neonCyan),
              label: 'Live',
            ),
            NavigationDestination(
              icon: Icon(Icons.hub_outlined,
                  color: AppTheme.mutedText.withOpacity(0.9)),
              selectedIcon:
                  const Icon(Icons.hub, color: AppTheme.neonCyan),
              label: 'Mesh',
            ),
            NavigationDestination(
              icon: Icon(Icons.power_settings_new_outlined,
                  color: AppTheme.mutedText.withOpacity(0.9)),
              selectedIcon: const Icon(Icons.power_settings_new,
                  color: AppTheme.neonCyan),
              label: 'Manual',
            ),
            NavigationDestination(
              icon: Icon(Icons.auto_mode_outlined,
                  color: AppTheme.mutedText.withOpacity(0.9)),
              selectedIcon:
                  const Icon(Icons.auto_mode, color: AppTheme.neonCyan),
              label: 'Auto',
            ),
            NavigationDestination(
              icon: Icon(Icons.analytics_outlined,
                  color: AppTheme.mutedText.withOpacity(0.9)),
              selectedIcon:
                  const Icon(Icons.analytics, color: AppTheme.neonCyan),
              label: 'Data',
            ),
            NavigationDestination(
              icon: Icon(Icons.tune,
                  color: AppTheme.mutedText.withOpacity(0.9)),
              selectedIcon:
                  const Icon(Icons.tune, color: AppTheme.neonCyan),
              label: 'Tune',
            ),
          ],
        ),
      ),
    );
  }
}
