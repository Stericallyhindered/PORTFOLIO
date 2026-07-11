import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/app_providers.dart';
import 'ui/features/config/config_page.dart';
import 'ui/features/connect/connect_page.dart';
import 'ui/features/diagnostics/diagnostics_page.dart';
import 'ui/features/realtime/realtime_page.dart';
import 'ui/features/tuning/tuning_page.dart';

class AwdApp extends ConsumerStatefulWidget {
  const AwdApp({super.key});

  @override
  ConsumerState<AwdApp> createState() => _AwdAppState();
}

class _AwdAppState extends ConsumerState<AwdApp> {
  int _index = 2;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(profileProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _index,
            onDestinationSelected: (v) => setState(() => _index = v),
            extended: MediaQuery.sizeOf(context).width > 900,
            labelType: NavigationRailLabelType.all,
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.link),
                label: Text('Connect'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.tune),
                label: Text('Config'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.grid_on),
                label: Text('Tuning'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.speed),
                label: Text('Realtime'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.bug_report_outlined),
                label: Text('Diagnostics'),
              ),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: _page()),
        ],
      ),
    );
  }

  Widget _page() {
    switch (_index) {
      case 0:
        return const ConnectPage();
      case 1:
        return const ConfigPage();
      case 2:
        return const TuningPage();
      case 3:
        return const RealtimePage();
      default:
        return const DiagnosticsPage();
    }
  }
}
