import 'preset_mode_id.dart';

class CustomNameRef {
  const CustomNameRef(this.slotId, this.name);
  final int slotId;
  final String name;
}

sealed class SelectedMode {
  const SelectedMode();
}

class SelectedPreset extends SelectedMode {
  const SelectedPreset(this.preset);
  final PresetModeId preset;
}

class SelectedCustom extends SelectedMode {
  const SelectedCustom(this.slotId) : assert(slotId >= 1 && slotId <= 3);
  final int slotId;
}

bool modeEquals(SelectedMode a, SelectedMode b) {
  if (a is SelectedPreset && b is SelectedPreset) {
    return a.preset == b.preset;
  }
  if (a is SelectedCustom && b is SelectedCustom) {
    return a.slotId == b.slotId;
  }
  return false;
}

extension SelectedModeX on SelectedMode {
  String label({required List<CustomNameRef> customNames}) {
    return switch (this) {
      SelectedPreset(:final preset) => preset.displayName,
      SelectedCustom(:final slotId) =>
        customNames.firstWhere((e) => e.slotId == slotId, orElse: () => CustomNameRef(slotId, 'Custom $slotId')).name,
    };
  }
}
