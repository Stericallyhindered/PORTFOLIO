enum PresetModeId {
  rain,
  snow,
  autoAwd,
  sportAwd,
  drag,
  driftRwd,
}

extension PresetModeIdX on PresetModeId {
  String get key => name;

  String get displayName {
    switch (this) {
      case PresetModeId.rain:
        return 'Rain';
      case PresetModeId.snow:
        return 'Snow';
      case PresetModeId.autoAwd:
        return 'Auto AWD';
      case PresetModeId.sportAwd:
        return 'Sport AWD';
      case PresetModeId.drag:
        return 'Drag';
      case PresetModeId.driftRwd:
        return 'Drift / RWD';
    }
  }

  static PresetModeId? fromKey(String? k) {
    if (k == null) return null;
    for (final v in PresetModeId.values) {
      if (v.name == k) return v;
    }
    return null;
  }
}
