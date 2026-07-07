import 'package:flutter/material.dart';

import '../models/tuning_map.dart';
import '../services/tuning_service.dart';

class TuningScreen extends StatefulWidget {
  const TuningScreen({super.key, required this.tuning});

  final TuningService tuning;

  @override
  State<TuningScreen> createState() => _TuningScreenState();
}

class _TuningScreenState extends State<TuningScreen> {
  final TextEditingController _valueController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _syncController();
  }

  @override
  void didUpdateWidget(covariant TuningScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncController();
  }

  @override
  void dispose() {
    _valueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.tuning,
      builder: (BuildContext context, Widget? child) {
        _syncController();

        return ListView(
          padding: const EdgeInsets.fromLTRB(6, 4, 6, 10),
          children: <Widget>[
            _ModeAndMapHeader(tuning: widget.tuning),
            const SizedBox(height: 8),
            _MapGrid(tuning: widget.tuning),
            if (MediaQuery.sizeOf(context).width >= 520) ...<Widget>[
              const SizedBox(height: 8),
              _CellInspector(
                tuning: widget.tuning,
                controller: _valueController,
              ),
            ],
            const SizedBox(height: 8),
            if (widget.tuning.selectedModeId == TuningModeId.dragLaunch)
              _DragLaunchPanel(tuning: widget.tuning),
          ],
        );
      },
    );
  }

  void _syncController() {
    final text = widget.tuning.selectedValue.toStringAsFixed(
      widget.tuning.selectedMap.valueUnit == 'x' ? 2 : 1,
    );
    if (_valueController.text != text) {
      _valueController.text = text;
    }
  }
}

class _TunerPanel extends StatelessWidget {
  const _TunerPanel({
    required this.title,
    required this.child,
    this.trailing,
  });

  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2E2E2E)),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x26000000),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: const Color(0xFFEDEDED),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}

class _TunerChip extends StatelessWidget {
  const _TunerChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF232323),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF393939)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(
            label.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: const Color(0xFF9A9A9A),
              fontSize: 8,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _DarkDropdown<T> extends StatelessWidget {
  const _DarkDropdown({
    required this.value,
    required this.label,
    required this.items,
    required this.onChanged,
  });

  final T value;
  final String label;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      value: value,
      dropdownColor: const Color(0xFF222222),
      iconEnabledColor: Colors.white,
      style: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w500,
        fontSize: 12,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0xFFBEBEBE)),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        filled: true,
        fillColor: const Color(0xFF202020),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF3A3A3A)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFFB000), width: 2),
        ),
      ),
      items: items,
      onChanged: onChanged,
    );
  }
}

class _ModeAndMapHeader extends StatelessWidget {
  const _ModeAndMapHeader({required this.tuning});

  final TuningService tuning;

  @override
  Widget build(BuildContext context) {
    final selectedMap = tuning.selectedMap;
    return _TunerPanel(
      title: 'AWD Strategy',
      trailing: _TunerChip(label: 'Mode', value: tuning.selectedModeId.label),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _DarkDropdown<TuningModeId>(
                  value: tuning.selectedModeId,
                  label: 'Mode',
                  items:
                      TuningModeId.values
                          .map(
                            (modeId) => DropdownMenuItem<TuningModeId>(
                              value: modeId,
                              child: Text(
                                modeId.label,
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                          )
                          .toList(),
                  onChanged:
                      (modeId) =>
                          modeId == null ? null : tuning.selectMode(modeId),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DarkDropdown<String>(
                  value: selectedMap.id,
                  label: 'Component',
                  items:
                      tuning.selectedMode.maps
                          .map(
                            (map) => DropdownMenuItem<String>(
                              value: map.id,
                              child: Text(
                                map.name,
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                          )
                          .toList(),
                  onChanged:
                      (mapId) =>
                          mapId == null ? null : tuning.selectMap(mapId),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            selectedMap.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: const Color(0xFFD7D7D7),
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: <Widget>[
              _TunerChip(
                label: 'X',
                value: '${selectedMap.xAxis.label} ${selectedMap.xAxis.unit}',
              ),
              _TunerChip(
                label: 'Y',
                value: '${selectedMap.yAxis.label} ${selectedMap.yAxis.unit}',
              ),
              _TunerChip(
                label: 'Blend',
                value: selectedMap.blendMode.name.toUpperCase(),
              ),
              _TunerChip(
                label: 'Range',
                value:
                    '${selectedMap.minValue.toStringAsFixed(0)}..${selectedMap.maxValue.toStringAsFixed(selectedMap.valueUnit == 'x' ? 1 : 0)} ${selectedMap.valueUnit}',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MapGrid extends StatelessWidget {
  const _MapGrid({required this.tuning});

  final TuningService tuning;

  @override
  Widget build(BuildContext context) {
    final map = tuning.selectedMap;
    return _TunerPanel(
      title: map.name,
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final columns = map.xAxis.values.length + 1;
          const cellGap = 1.2;
          final cellWidth = ((constraints.maxWidth - (columns * cellGap)) / columns)
              .clamp(18.0, 31.0)
              .toDouble();
          final cellHeight = (cellWidth * 0.68).clamp(13.0, 21.0).toDouble();
          final fontSize = (cellHeight * 0.44).clamp(6.5, 9.0).toDouble();
          final totalWidth = (cellWidth + cellGap) * columns;

          return Center(
            child: SizedBox(
              width: totalWidth,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      _AxisCell(
                        width: cellWidth,
                        height: cellHeight,
                        gap: cellGap,
                        fontSize: fontSize,
                        label: map.yAxis.label,
                      ),
                      for (final x in map.xAxis.values)
                        _AxisCell(
                          width: cellWidth,
                          height: cellHeight,
                          gap: cellGap,
                          fontSize: fontSize,
                          label: _formatAxis(x),
                        ),
                    ],
                  ),
                  for (var row = 0; row < map.yAxis.values.length; row++)
                    Row(
                      children: <Widget>[
                        _AxisCell(
                          width: cellWidth,
                          height: cellHeight,
                          gap: cellGap,
                          fontSize: fontSize,
                          label: _formatAxis(map.yAxis.values[row]),
                        ),
                        for (
                          var column = 0;
                          column < map.xAxis.values.length;
                          column++
                        )
                          _ValueCell(
                            width: cellWidth,
                            height: cellHeight,
                            gap: cellGap,
                            fontSize: fontSize,
                            value: map.valueAt(row, column),
                            minValue: map.minValue,
                            maxValue: map.maxValue,
                            selected:
                                row == tuning.selectedRow &&
                                column == tuning.selectedColumn,
                            unit: map.valueUnit,
                            onTap: () => _editCell(context, row, column),
                          ),
                      ],
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _editCell(BuildContext context, int row, int column) {
    tuning.selectCell(row, column);
    if (MediaQuery.sizeOf(context).width < 760) {
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder:
            (context) => Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                bottom: 16 + MediaQuery.viewInsetsOf(context).bottom,
              ),
              child: _CellInspector(
                tuning: tuning,
                controller: TextEditingController(
                  text: tuning.selectedValue.toStringAsFixed(
                    tuning.selectedMap.valueUnit == 'x' ? 2 : 1,
                  ),
                ),
              ),
            ),
      );
    }
  }

  static String _formatAxis(double value) {
    if (value == value.roundToDouble()) {
      return value.toStringAsFixed(0);
    }
    return value.toStringAsFixed(2);
  }
}

class _AxisCell extends StatelessWidget {
  const _AxisCell({
    required this.width,
    required this.height,
    required this.gap,
    required this.fontSize,
    required this.label,
  });

  final double width;
  final double height;
  final double gap;
  final double fontSize;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      alignment: Alignment.center,
      margin: EdgeInsets.all(gap / 2),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w500,
          color: const Color(0xFFECECEC),
        ),
      ),
    );
  }
}

class _ValueCell extends StatelessWidget {
  const _ValueCell({
    required this.width,
    required this.height,
    required this.gap,
    required this.fontSize,
    required this.value,
    required this.minValue,
    required this.maxValue,
    required this.selected,
    required this.unit,
    required this.onTap,
  });

  final double width;
  final double height;
  final double gap;
  final double fontSize;
  final double value;
  final double minValue;
  final double maxValue;
  final bool selected;
  final String unit;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final normalized =
        maxValue == minValue ? 0.0 : ((value - minValue) / (maxValue - minValue));
    final color = Color.lerp(
      const Color(0xFF2F7D32),
      const Color(0xFFC95D12),
      normalized.clamp(0, 1),
    )!;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        width: width,
        height: height,
        alignment: Alignment.center,
        margin: EdgeInsets.all(gap / 2),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(4),
          border:
              selected
                  ? Border.all(color: const Color(0xFFFFD166), width: 2)
                  : Border.all(color: const Color(0x33000000)),
        ),
        child: Text(
          value.toStringAsFixed(unit == 'x' ? 2 : 0),
          style: TextStyle(
            fontSize: fontSize,
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _CellInspector extends StatelessWidget {
  const _CellInspector({required this.tuning, required this.controller});

  final TuningService tuning;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final map = tuning.selectedMap;
    final x = map.xAxis.values[tuning.selectedColumn];
    final y = map.yAxis.values[tuning.selectedRow];
    return _TunerPanel(
      title: 'Selected Cell',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _TunerChip(
                  label: map.xAxis.label,
                  value: _formatWithUnit(x, map.xAxis.unit),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _TunerChip(
                  label: map.yAxis.label,
                  value: _formatWithUnit(y, map.yAxis.unit),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              SizedBox(
                width: 96,
                child: TextField(
                  controller: controller,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    labelText: map.valueLabel,
                    suffixText: map.valueUnit,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 9,
                    ),
                    labelStyle: const TextStyle(color: Color(0xFFBEBEBE)),
                    suffixStyle: const TextStyle(color: Color(0xFFBEBEBE)),
                    filled: true,
                    fillColor: const Color(0xFF202020),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF3A3A3A)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Color(0xFFFFB000),
                        width: 2,
                      ),
                    ),
                  ),
                  onSubmitted: (_) => _apply(context),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _nudge(-1),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF4A4A4A)),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  child: const Text('-1'),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _nudge(1),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF4A4A4A)),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  child: const Text('+1'),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: FilledButton(
                  onPressed: () => _apply(context),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB000),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  child: const Text('Apply'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Allowed ${map.minValue.toStringAsFixed(1)} to ${map.maxValue.toStringAsFixed(1)} ${map.valueUnit}',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: const Color(0xFFBEBEBE),
            ),
          ),
        ],
      ),
    );
  }

  void _nudge(double delta) {
    final next = tuning.selectedValue + delta;
    tuning.updateSelectedCell(next);
  }

  void _apply(BuildContext context) {
    final parsed = double.tryParse(controller.text);
    if (parsed == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a numeric tuning value.')),
      );
      return;
    }
    tuning.updateSelectedCell(parsed);
    FocusScope.of(context).unfocus();
  }

  static String _formatWithUnit(double value, String unit) {
    final formatted =
        value == value.roundToDouble()
            ? value.toStringAsFixed(0)
            : value.toStringAsFixed(2);
    return '$formatted $unit'.trim();
  }
}

class _DragLaunchPanel extends StatelessWidget {
  const _DragLaunchPanel({required this.tuning});

  final TuningService tuning;

  @override
  Widget build(BuildContext context) {
    final config = tuning.selectedMode.dragLaunch;
    return _TunerPanel(
      title: 'Drag Launch Timer',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(
                'Timer',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: const Color(0xFFD7D7D7),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Switch(
                value: config.enabled,
                onChanged:
                    (enabled) => tuning.updateDragLaunch(
                      config.copyWith(enabled: enabled),
                    ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: <Widget>[
              _LaunchField(
                label: 'AWD',
                suffix: '%',
                value: config.launchAwdPct,
                min: 0,
                max: 100,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(launchAwdPct: value),
                    ),
              ),
              _LaunchField(
                label: 'Hold',
                suffix: 's',
                value: config.holdSeconds,
                min: 0,
                max: 10,
                decimals: 2,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(holdSeconds: value),
                    ),
              ),
              _LaunchField(
                label: 'Ramp',
                suffix: 's',
                value: config.rampOutSeconds,
                min: 0,
                max: 5,
                decimals: 2,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(rampOutSeconds: value),
                    ),
              ),
              _LaunchField(
                label: 'After',
                suffix: '%',
                value: config.afterTimerAwdPct,
                min: 0,
                max: 100,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(afterTimerAwdPct: value),
                    ),
              ),
              _LaunchField(
                label: 'Tq',
                suffix: 'Nm',
                value: config.triggerMinWheelTorqueNm,
                min: 0,
                max: 1500,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(triggerMinWheelTorqueNm: value),
                    ),
              ),
              _LaunchField(
                label: 'RPM',
                suffix: '',
                value: config.triggerMinEngineRpm,
                min: 0,
                max: 8000,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(triggerMinEngineRpm: value),
                    ),
              ),
              _LaunchField(
                label: 'Speed',
                suffix: 'kph',
                value: config.triggerSpeedKph,
                min: 0,
                max: 20,
                decimals: 1,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(triggerSpeedKph: value),
                    ),
              ),
              _LaunchField(
                label: 'Steer',
                suffix: 'deg',
                value: config.maxSteeringAngleDeg,
                min: 0,
                max: 45,
                decimals: 1,
                onChanged:
                    (value) => tuning.updateDragLaunch(
                      config.copyWith(maxSteeringAngleDeg: value),
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LaunchField extends StatelessWidget {
  const _LaunchField({
    required this.label,
    required this.suffix,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.decimals = 0,
  });

  final String label;
  final String suffix;
  final double value;
  final double min;
  final double max;
  final int decimals;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final controller = TextEditingController(text: value.toStringAsFixed(decimals));
    return SizedBox(
      width: 82,
      child: TextField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          labelText: label,
          suffixText: suffix,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 7, vertical: 7),
          labelStyle: const TextStyle(color: Color(0xFFBEBEBE), fontSize: 9),
          suffixStyle: const TextStyle(color: Color(0xFFBEBEBE), fontSize: 9),
          filled: true,
          fillColor: const Color(0xFF202020),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: const BorderSide(color: Color(0xFF3A3A3A)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(9),
            borderSide: const BorderSide(color: Color(0xFFFFB000), width: 1.5),
          ),
        ),
        onSubmitted: (text) {
          final parsed = double.tryParse(text);
          if (parsed == null) {
            return;
          }
          onChanged(parsed.clamp(min, max).toDouble());
        },
      ),
    );
  }
}
