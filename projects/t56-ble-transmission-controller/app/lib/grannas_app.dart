import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/app_providers.dart';
import 'ui/features/connect/connect_page.dart';
import 'ui/features/firmware/firmware_page.dart';
import 'ui/features/live/live_page.dart';
import 'ui/features/presets/presets_page.dart';
import 'ui/features/table/table_editor_page.dart';
import 'ui/theme/app_theme.dart';

class GrannasApp extends ConsumerStatefulWidget {
  const GrannasApp({super.key});

  @override
  ConsumerState<GrannasApp> createState() => _GrannasAppState();
}

class _GrannasAppState extends ConsumerState<GrannasApp> {
  int _index = 2;

  @override
  Widget build(BuildContext context) {
    final connected = ref.watch(isConnectedProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            stripeHeader(
              child: Row(
                children: [
                  Text(
                    'GRANNAS T56',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const Spacer(),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: connected ? GrannasColors.accentAlt : GrannasColors.textMuted,
                      boxShadow: connected
                          ? [
                              BoxShadow(
                                color: GrannasColors.accentAlt.withValues(alpha: 0.6),
                                blurRadius: 8,
                              ),
                            ]
                          : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    connected ? 'LINKED' : 'OFFLINE',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(fontSize: 11),
                  ),
                ],
              ),
            ),
            Expanded(child: _page()),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (v) => setState(() => _index = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.link), label: 'Link'),
          NavigationDestination(icon: Icon(Icons.speed), label: 'Live'),
          NavigationDestination(icon: Icon(Icons.table_chart), label: 'Table'),
          NavigationDestination(icon: Icon(Icons.grid_view), label: 'Presets'),
          NavigationDestination(icon: Icon(Icons.system_update), label: 'FW'),
          NavigationDestination(icon: Icon(Icons.import_export), label: 'I/O'),
        ],
      ),
    );
  }

  Widget _page() {
    switch (_index) {
      case 0:
        return const ConnectPage();
      case 1:
        return const LivePage();
      case 2:
        return const TableEditorPage();
      case 3:
        return const PresetsPage();
      case 4:
        return const FirmwarePage();
      default:
        return const ImportExportPage();
    }
  }
}
