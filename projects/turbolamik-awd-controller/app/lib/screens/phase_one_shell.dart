import 'package:flutter/material.dart';

import '../services/telemetry_service.dart';
import '../services/tuning_service.dart';
import 'capture_screen.dart';
import 'dashboard_screen.dart';
import 'decoded_signals_screen.dart';
import 'profile_screen.dart';
import 'raw_frames_screen.dart';
import 'saved_logs_screen.dart';
import 'tuning_screen.dart';

class PhaseOneShell extends StatefulWidget {
  const PhaseOneShell({
    super.key,
    required this.telemetry,
    required this.tuning,
  });

  final TelemetryService telemetry;
  final TuningService tuning;

  @override
  State<PhaseOneShell> createState() => _PhaseOneShellState();
}

class _PhaseOneShellState extends State<PhaseOneShell> {
  int _index = 0;

  static const List<String> _titles = <String>[
    'Live Dashboard',
    'Raw Frames',
    'Decoded Signals',
    'Capture Control',
    'Saved Sessions',
    'Tuning Mode',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.telemetry,
      builder: (BuildContext context, Widget? child) {
        final pages = <Widget>[
          DashboardScreen(telemetry: widget.telemetry),
          RawFramesScreen(telemetry: widget.telemetry),
          DecodedSignalsScreen(telemetry: widget.telemetry),
          CaptureScreen(telemetry: widget.telemetry),
          SavedLogsScreen(telemetry: widget.telemetry),
          TuningScreen(tuning: widget.tuning),
          ProfileScreen(telemetry: widget.telemetry),
        ];

        final compact = MediaQuery.sizeOf(context).width < 1100;
        final body =
            compact
                ? pages[_index]
                : Row(
                  children: <Widget>[
                    NavigationRail(
                      selectedIndex: _index,
                      useIndicator: true,
                      groupAlignment: -1,
                      labelType: NavigationRailLabelType.all,
                      onDestinationSelected:
                          (int value) => setState(() => _index = value),
                      destinations: const <NavigationRailDestination>[
                        NavigationRailDestination(
                          icon: Icon(Icons.dashboard_outlined),
                          selectedIcon: Icon(Icons.dashboard_rounded),
                          label: Text('Dash'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.memory_outlined),
                          selectedIcon: Icon(Icons.memory_rounded),
                          label: Text('Raw'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.tune_outlined),
                          selectedIcon: Icon(Icons.tune_rounded),
                          label: Text('Signals'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.fiber_smart_record_outlined),
                          selectedIcon: Icon(Icons.fiber_smart_record_rounded),
                          label: Text('Capture'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.folder_copy_outlined),
                          selectedIcon: Icon(Icons.folder_copy_rounded),
                          label: Text('Saved'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.grid_on_outlined),
                          selectedIcon: Icon(Icons.grid_on_rounded),
                          label: Text('Tune'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.settings_input_component_outlined),
                          selectedIcon: Icon(
                            Icons.settings_input_component_rounded,
                          ),
                          label: Text('Profile'),
                        ),
                      ],
                    ),
                    const VerticalDivider(width: 1),
                    Expanded(child: pages[_index]),
                  ],
                );

        return Scaffold(
          appBar: AppBar(
            title: Text(_titles[_index]),
            actions: <Widget>[
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Chip(
                  avatar: Icon(
                    widget.telemetry.health.bleConnected
                        ? Icons.bluetooth_connected
                        : Icons.bluetooth_disabled,
                    size: 18,
                  ),
                  label: Text(
                    widget.telemetry.isDemoMode
                        ? widget.telemetry.modeLabel
                        : widget.telemetry.health.bleConnected
                        ? 'BLE Ready'
                        : 'BLE Offline',
                  ),
                ),
              ),
            ],
          ),
          body: body,
          bottomNavigationBar:
              compact
                  ? NavigationBar(
                    selectedIndex: _index,
                    onDestinationSelected:
                        (int value) => setState(() => _index = value),
                    destinations: const <NavigationDestination>[
                      NavigationDestination(
                        icon: Icon(Icons.dashboard_outlined),
                        selectedIcon: Icon(Icons.dashboard_rounded),
                        label: 'Dash',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.memory_outlined),
                        selectedIcon: Icon(Icons.memory_rounded),
                        label: 'Raw',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.tune_outlined),
                        selectedIcon: Icon(Icons.tune_rounded),
                        label: 'Signals',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.fiber_smart_record_outlined),
                        selectedIcon: Icon(Icons.fiber_smart_record_rounded),
                        label: 'Capture',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.folder_copy_outlined),
                        selectedIcon: Icon(Icons.folder_copy_rounded),
                        label: 'Saved',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.grid_on_outlined),
                        selectedIcon: Icon(Icons.grid_on_rounded),
                        label: 'Tune',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.settings_input_component_outlined),
                        selectedIcon: Icon(
                          Icons.settings_input_component_rounded,
                        ),
                        label: 'Profile',
                      ),
                    ],
                  )
                  : null,
        );
      },
    );
  }
}
