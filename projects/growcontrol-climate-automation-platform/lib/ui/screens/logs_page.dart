import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../domain/models/dehu_learning_record.dart';
import '../../domain/models/outlet_event.dart';
import '../../services/traffic_logger.dart';
import '../../state/grow_room_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets/grid_scrim.dart';
import '../widgets/telemetry_lab_chart.dart';

// `_PersistenceBanner` was removed — the chart now fills the entire Telemetry
// tab and the storage hint moved into a one-liner footer on the chart itself.

class LogsPage extends StatefulWidget {
  const LogsPage({super.key});

  @override
  State<LogsPage> createState() => _LogsPageState();
}

class _LogsPageState extends State<LogsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GrowRoomController>(
      builder: (context, room, _) {
        // Landscape phones get a slimmer top tab bar (no big horizontal padding)
        // so the chart panel keeps every vertical pixel possible.
        final landscape =
            MediaQuery.of(context).orientation == Orientation.landscape;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(
                  landscape ? 8 : 16, landscape ? 0 : 8, landscape ? 8 : 16, 0),
              child: TabBar(
                controller: _tabs,
                indicatorColor: AppTheme.neonCyan,
                labelColor: AppTheme.neonCyan,
                unselectedLabelColor: AppTheme.mutedText,
                labelStyle: AppTheme.fontMono(landscape ? 9 : 11),
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: const [
                  Tab(text: 'TELEMETRY'),
                  Tab(text: 'EVENT STREAM'),
                  Tab(text: 'LEARNING'),
                  Tab(text: 'TRAFFIC'),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                    child: TelemetryLabChart(
                      allSamples: room.log.samples,
                      footerHint: room.logPersistenceHint,
                    ),
                  ),
                  _EventStreamTab(
                    events: room.log.outletEvents.reversed.toList(),
                  ),
                  _LearningTab(
                    records: room.log.dehuSegments.reversed.toList(),
                  ),
                  const _TrafficTab(),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _EventStreamTab extends StatelessWidget {
  const _EventStreamTab({required this.events});

  final List<OutletEvent> events;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('yyyy-MM-dd HH:mm:ss');
    final slice = events.take(400).toList();

    return GridScrim(
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
        itemCount: slice.isEmpty ? 1 : slice.length + 1,
        itemBuilder: (context, i) {
          if (slice.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'NO RELAY EVENTS CAPTURED YET.',
                style: AppTheme.fontMono(12, color: AppTheme.mutedText),
              ),
            );
          }
          if (i == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                '// OUTLET COMMAND TRACE · LAST ${slice.length} ROWS',
                style: AppTheme.fontMono(10, color: AppTheme.neonPurple),
              ),
            );
          }
          final e = slice[i - 1];
          final at = fmt.format(e.at);
          final on = e.on ? 'ARM' : 'DISARM';
          final pulse = e.on ? AppTheme.neonYellow : AppTheme.mutedText;
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
              color: AppTheme.surfaceElevated.withOpacity(0.55),
            ),
            child: RichText(
              text: TextSpan(
                style: AppTheme.fontMono(11, color: AppTheme.mutedText),
                children: [
                  TextSpan(
                    text: '[$at] ',
                    style: AppTheme.fontMono(11, color: AppTheme.neonCyan),
                  ),
                  TextSpan(
                    text: '${e.role.name.toUpperCase()} ',
                    style: AppTheme.fontMono(11,
                        color: Colors.white.withOpacity(0.85)),
                  ),
                  TextSpan(
                    text: '$on ',
                    style: AppTheme.fontMono(11, color: pulse),
                  ),
                  TextSpan(
                    text: '— ${e.reason}',
                    style: AppTheme.fontMono(10,
                        color: AppTheme.mutedText.withOpacity(0.95)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _LearningTab extends StatelessWidget {
  const _LearningTab({required this.records});

  final List<DehumidifierPullDownRecord> records;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat.Hm();

    return GridScrim(
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
        itemCount: records.isEmpty ? 1 : records.length + 1,
        itemBuilder: (context, i) {
          if (records.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'NO DEHUMIDIFIER SEGMENTS — cycles must complete with telemetry.',
                style: AppTheme.fontMono(12, color: AppTheme.mutedText),
              ),
            );
          }
          if (i == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                '// PULL-DOWN LEARNING · RH VELOCITY',
                style: AppTheme.fontMono(10, color: AppTheme.alertOrange),
              ),
            );
          }
          final r = records[i - 1];
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.alertOrange.withOpacity(0.22)),
              gradient: LinearGradient(
                colors: [
                  AppTheme.surfaceElevated.withOpacity(0.8),
                  AppTheme.surface.withOpacity(0.6),
                ],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${r.rhStart.toStringAsFixed(1)}% → ${r.rhEnd.toStringAsFixed(1)}% RH',
                  style: AppTheme.fontMono(13, color: Colors.white),
                ),
                const SizedBox(height: 6),
                Text(
                  '${r.duration.inMinutes}m ${r.duration.inSeconds % 60}s · '
                  '${r.rhPerMinute.toStringAsFixed(2)} pts/min · '
                  '${r.tempCAvg.toStringAsFixed(1)}°C avg',
                  style: AppTheme.fontMono(11, color: AppTheme.mutedText),
                ),
                const SizedBox(height: 4),
                Text(
                  '${fmt.format(r.startedAt)} → ${fmt.format(r.endedAt)}',
                  style: AppTheme.fontMono(10, color: AppTheme.neonPurple),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Live developer log of every gateway / controller / sensor event captured
/// by [TrafficLogger]. Filterable by source, pausable, clearable, and
/// auto-scrolls to newest entry as long as the user hasn't manually scrolled
/// up to inspect older lines.
class _TrafficTab extends StatefulWidget {
  const _TrafficTab();

  @override
  State<_TrafficTab> createState() => _TrafficTabState();
}

class _TrafficTabState extends State<_TrafficTab> {
  final List<TrafficEntry> _entries = [];
  final ScrollController _scroll = ScrollController();
  StreamSubscription<TrafficEntry>? _sub;

  bool _paused = false;
  bool _autoFollow = true;
  // Visible source toggles. All on by default.
  final Set<TrafficSource> _shown = {...TrafficSource.values};

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    final logger = context.read<TrafficLogger>();
    _entries.addAll(logger.snapshot.reversed);
    _sub = logger.watch().listen(_onEntry);
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;
    // ListView is reverse:true, so position 0 == newest. If the user has
    // scrolled away from the top, suspend auto-follow so we don't yank them
    // back every time a new entry lands.
    final top = _scroll.position.pixels <= 32;
    if (top != _autoFollow) {
      setState(() => _autoFollow = top);
    }
  }

  void _onEntry(TrafficEntry e) {
    if (_paused) return;
    if (!mounted) return;
    setState(() {
      _entries.add(e);
      // Keep memory in check; mirror logger capacity.
      if (_entries.length > 2200) {
        _entries.removeRange(0, _entries.length - 2000);
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visible = _entries
        .where((e) => _shown.contains(e.source))
        .toList(growable: false)
        .reversed
        .toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              for (final s in TrafficSource.values)
                _SourceChip(
                  source: s,
                  selected: _shown.contains(s),
                  onTap: () {
                    setState(() {
                      if (!_shown.add(s)) _shown.remove(s);
                    });
                  },
                ),
              const SizedBox(width: 4),
              _ToolButton(
                label: _paused ? 'RESUME' : 'PAUSE',
                icon: _paused ? Icons.play_arrow : Icons.pause,
                onTap: () => setState(() => _paused = !_paused),
                accent: _paused ? AppTheme.alertOrange : AppTheme.neonCyan,
              ),
              _ToolButton(
                label: 'CLEAR',
                icon: Icons.clear_all,
                onTap: () {
                  context.read<TrafficLogger>().clear();
                  setState(_entries.clear);
                },
                accent: AppTheme.mutedText,
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 0),
          child: Text(
            '${visible.length} ENTRIES${_paused ? " · PAUSED" : ""}'
            '${_autoFollow ? "" : " · SCROLLED"}',
            style: AppTheme.fontMono(9, color: AppTheme.mutedText),
          ),
        ),
        Expanded(
          child: GridScrim(
            child: visible.isEmpty
                ? Center(
                    child: Text(
                      _entries.isEmpty
                          ? 'NO TRAFFIC YET — interact with the app to populate.'
                          : 'ALL SOURCES FILTERED OUT.',
                      style: AppTheme.fontMono(11, color: AppTheme.mutedText),
                    ),
                  )
                : ListView.builder(
                    controller: _scroll,
                    reverse: true,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                    itemCount: visible.length,
                    itemBuilder: (context, i) => _TrafficRow(entry: visible[i]),
                  ),
          ),
        ),
      ],
    );
  }
}

class _SourceChip extends StatelessWidget {
  const _SourceChip({
    required this.source,
    required this.selected,
    required this.onTap,
  });

  final TrafficSource source;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = _colorFor(source);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: selected ? color.withOpacity(0.18) : Colors.transparent,
          border: Border.all(
            color: selected
                ? color.withOpacity(0.65)
                : AppTheme.mutedText.withOpacity(0.3),
          ),
        ),
        child: Text(
          _labelFor(source),
          style: AppTheme.fontMono(10,
              color: selected ? color : AppTheme.mutedText.withOpacity(0.85)),
        ),
      ),
    );
  }
}

class _ToolButton extends StatelessWidget {
  const _ToolButton({
    required this.label,
    required this.icon,
    required this.onTap,
    required this.accent,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: accent.withOpacity(0.45)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: accent),
            const SizedBox(width: 4),
            Text(
              label,
              style: AppTheme.fontMono(10, color: accent),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrafficRow extends StatelessWidget {
  const _TrafficRow({required this.entry});

  final TrafficEntry entry;

  @override
  Widget build(BuildContext context) {
    final color = _colorFor(entry.source);
    final t = entry.at;
    final stamp = '${t.hour.toString().padLeft(2, '0')}:'
        '${t.minute.toString().padLeft(2, '0')}:'
        '${t.second.toString().padLeft(2, '0')}.'
        '${t.millisecond.toString().padLeft(3, '0')}';
    final detail = entry.detail;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        color: AppTheme.surface.withOpacity(0.6),
        border: Border.all(
          color: entry.ok
              ? color.withOpacity(0.18)
              : AppTheme.alertOrange.withOpacity(0.55),
          width: entry.ok ? 1 : 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: AppTheme.fontMono(11, color: AppTheme.mutedText),
              children: [
                TextSpan(
                  text: '$stamp ',
                  style: AppTheme.fontMono(10,
                      color: AppTheme.mutedText.withOpacity(0.7)),
                ),
                TextSpan(
                  text: '${_labelFor(entry.source).padRight(10)} ',
                  style: AppTheme.fontMono(10, color: color),
                ),
                TextSpan(
                  text: '${entry.kind.name.padRight(11)} ',
                  style: AppTheme.fontMono(10,
                      color: color.withOpacity(0.85)),
                ),
                if (entry.deviceId != null) ...[
                  TextSpan(
                    text: '${_shortId(entry.deviceId!)} ',
                    style: AppTheme.fontMono(10,
                        color: Colors.white.withOpacity(0.8)),
                  ),
                ],
                TextSpan(
                  text: entry.label,
                  style: AppTheme.fontMono(11,
                      color: Colors.white.withOpacity(0.9)),
                ),
              ],
            ),
          ),
          if (detail != null && detail.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 4, top: 2),
              child: Text(
                detail,
                style: AppTheme.fontMono(9,
                    color: AppTheme.mutedText.withOpacity(0.85)),
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }
}

String _labelFor(TrafficSource s) {
  switch (s) {
    case TrafficSource.gateway:
      return 'I/O';
    case TrafficSource.sensor:
      return 'SENSOR';
    case TrafficSource.manual:
      return 'MANUAL';
    case TrafficSource.controller:
      return 'AUTO';
    case TrafficSource.error:
      return 'ERR';
  }
}

Color _colorFor(TrafficSource s) {
  switch (s) {
    case TrafficSource.gateway:
      return AppTheme.neonPurple;
    case TrafficSource.sensor:
      return AppTheme.mutedText;
    case TrafficSource.manual:
      return AppTheme.neonYellow;
    case TrafficSource.controller:
      return AppTheme.neonCyan;
    case TrafficSource.error:
      return AppTheme.alertOrange;
  }
}

String _shortId(String id) {
  if (id.length <= 8) return id;
  return id.substring(id.length - 6);
}
