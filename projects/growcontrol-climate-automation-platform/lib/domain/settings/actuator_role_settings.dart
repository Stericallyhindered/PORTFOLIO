import 'package:flutter/foundation.dart';

import '../models/grow_device.dart';

/// How humidifier / dehumidifier loads are driven when role is climate-related.
enum HumidityLoadMode {
  /// Use [ClimateControlService] VPD → RH logic.
  automated,

  /// Interval pulse (same math as water pump duty).
  timer,

  /// Ignore automation; use [manualOutletCommands] or stay off until changed.
  manual,
}

@immutable
class HumidityLoadSettings {
  const HumidityLoadSettings({
    this.mode = HumidityLoadMode.automated,
    this.timerRunMinutes = 5,
    this.timerIntervalHours = 2,
  });

  final HumidityLoadMode mode;
  final int timerRunMinutes;
  final int timerIntervalHours;

  Map<String, dynamic> toJson() => {
        'mode': mode.name,
        'timerRunMinutes': timerRunMinutes,
        'timerIntervalHours': timerIntervalHours,
      };

  factory HumidityLoadSettings.fromJson(Map<String, dynamic> j) {
    return HumidityLoadSettings(
      mode: HumidityLoadMode.values.byName(
        j['mode'] as String? ?? HumidityLoadMode.automated.name,
      ),
      timerRunMinutes: (j['timerRunMinutes'] as num?)?.toInt() ?? 5,
      timerIntervalHours: (j['timerIntervalHours'] as num?)?.toInt() ?? 2,
    );
  }

  static HumidityLoadSettings defaultFor(GrowDeviceRole role) {
    return const HumidityLoadSettings();
  }
}

/// Wall-clock photoperiod for a light outlet (minutes from midnight, local time).
@immutable
class LightOutletSettings {
  const LightOutletSettings({
    this.onMinuteOfDay = 6 * 60,
    this.offMinuteOfDay = 0,
  });

  /// Default 06:00 → midnight (18h on); adjust in UI.
  final int onMinuteOfDay;
  final int offMinuteOfDay;

  Map<String, dynamic> toJson() => {
        'onMinuteOfDay': onMinuteOfDay,
        'offMinuteOfDay': offMinuteOfDay,
      };

  factory LightOutletSettings.fromJson(Map<String, dynamic> j) {
    return LightOutletSettings(
      onMinuteOfDay: (j['onMinuteOfDay'] as num?)?.toInt() ?? 6 * 60,
      offMinuteOfDay: (j['offMinuteOfDay'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Pulse pump: run [runMinutes] every [intervalHours] from [anchor].
@immutable
class WaterPumpSettings {
  const WaterPumpSettings({
    this.runMinutes = 5,
    this.intervalHours = 12,
    this.anchorIso,
  });

  final int runMinutes;
  final int intervalHours;
  final String? anchorIso;

  DateTime? get anchor =>
      anchorIso != null ? DateTime.tryParse(anchorIso!) : null;

  Map<String, dynamic> toJson() => {
        'runMinutes': runMinutes,
        'intervalHours': intervalHours,
        if (anchorIso != null) 'anchorIso': anchorIso,
      };

  factory WaterPumpSettings.fromJson(Map<String, dynamic> j) {
    return WaterPumpSettings(
      runMinutes: (j['runMinutes'] as num?)?.toInt() ?? 5,
      intervalHours: (j['intervalHours'] as num?)?.toInt() ?? 12,
      anchorIso: j['anchorIso'] as String?,
    );
  }
}

enum FanAutomationMode {
  timer,
  humidityAssist,
}

@immutable
class FanOutletSettings {
  const FanOutletSettings({
    this.mode = FanAutomationMode.timer,
    this.onMinutes = 10,
    this.offMinutes = 5,
    this.phaseAnchorIso,
    this.rhOnAbove = 70,
    this.rhOffBelow = 65,
  });

  final FanAutomationMode mode;
  final int onMinutes;
  final int offMinutes;
  final String? phaseAnchorIso;

  /// Humidity assist: turn on when RH above this (%).
  final double rhOnAbove;

  /// Turn off when RH below this (simple hysteresis band).
  final double rhOffBelow;

  DateTime? get phaseAnchor =>
      phaseAnchorIso != null ? DateTime.tryParse(phaseAnchorIso!) : null;

  Map<String, dynamic> toJson() => {
        'mode': mode.name,
        'onMinutes': onMinutes,
        'offMinutes': offMinutes,
        if (phaseAnchorIso != null) 'phaseAnchorIso': phaseAnchorIso,
        'rhOnAbove': rhOnAbove,
        'rhOffBelow': rhOffBelow,
      };

  factory FanOutletSettings.fromJson(Map<String, dynamic> j) {
    return FanOutletSettings(
      mode: FanAutomationMode.values.byName(
        j['mode'] as String? ?? FanAutomationMode.timer.name,
      ),
      onMinutes: (j['onMinutes'] as num?)?.toInt() ?? 10,
      offMinutes: (j['offMinutes'] as num?)?.toInt() ?? 5,
      phaseAnchorIso: j['phaseAnchorIso'] as String?,
      rhOnAbove: (j['rhOnAbove'] as num?)?.toDouble() ?? 70,
      rhOffBelow: (j['rhOffBelow'] as num?)?.toDouble() ?? 65,
    );
  }
}

/// Generic outlet (heater, etc.): simple timer duty optional.
@immutable
class GenericOutletSettings {
  const GenericOutletSettings({
    this.onMinutes = 15,
    this.offMinutes = 15,
    this.phaseAnchorIso,
    this.enabled = false,
  });

  final int onMinutes;
  final int offMinutes;
  final String? phaseAnchorIso;
  final bool enabled;

  DateTime? get phaseAnchor =>
      phaseAnchorIso != null ? DateTime.tryParse(phaseAnchorIso!) : null;

  Map<String, dynamic> toJson() => {
        'onMinutes': onMinutes,
        'offMinutes': offMinutes,
        if (phaseAnchorIso != null) 'phaseAnchorIso': phaseAnchorIso,
        'enabled': enabled,
      };

  factory GenericOutletSettings.fromJson(Map<String, dynamic> j) {
    return GenericOutletSettings(
      onMinutes: (j['onMinutes'] as num?)?.toInt() ?? 15,
      offMinutes: (j['offMinutes'] as num?)?.toInt() ?? 15,
      phaseAnchorIso: j['phaseAnchorIso'] as String?,
      enabled: j['enabled'] as bool? ?? false,
    );
  }
}

/// Per-device actuator payload keyed by role kind in JSON.
@immutable
class ActuatorRoleSettings {
  const ActuatorRoleSettings({
    this.humidityLoad,
    this.light,
    this.pump,
    this.fan,
    this.generic,
  });

  final HumidityLoadSettings? humidityLoad;
  final LightOutletSettings? light;
  final WaterPumpSettings? pump;
  final FanOutletSettings? fan;
  final GenericOutletSettings? generic;

  Map<String, dynamic> toJson() => {
        if (humidityLoad != null) 'humidityLoad': humidityLoad!.toJson(),
        if (light != null) 'light': light!.toJson(),
        if (pump != null) 'pump': pump!.toJson(),
        if (fan != null) 'fan': fan!.toJson(),
        if (generic != null) 'generic': generic!.toJson(),
      };

  factory ActuatorRoleSettings.fromJson(Map<String, dynamic> j) {
    return ActuatorRoleSettings(
      humidityLoad: j['humidityLoad'] != null
          ? HumidityLoadSettings.fromJson(
              Map<String, dynamic>.from(j['humidityLoad'] as Map),
            )
          : null,
      light: j['light'] != null
          ? LightOutletSettings.fromJson(
              Map<String, dynamic>.from(j['light'] as Map),
            )
          : null,
      pump: j['pump'] != null
          ? WaterPumpSettings.fromJson(
              Map<String, dynamic>.from(j['pump'] as Map),
            )
          : null,
      fan: j['fan'] != null
          ? FanOutletSettings.fromJson(
              Map<String, dynamic>.from(j['fan'] as Map),
            )
          : null,
      generic: j['generic'] != null
          ? GenericOutletSettings.fromJson(
              Map<String, dynamic>.from(j['generic'] as Map),
            )
          : null,
    );
  }

  /// Defaults for a role (used when user has not saved settings yet).
  static ActuatorRoleSettings defaultsFor(GrowDeviceRole role) {
    switch (role) {
      case GrowDeviceRole.humidifier:
      case GrowDeviceRole.dehumidifier:
        return ActuatorRoleSettings(
          humidityLoad: HumidityLoadSettings.defaultFor(role),
        );
      case GrowDeviceRole.lightOutlet:
        return const ActuatorRoleSettings(light: LightOutletSettings());
      case GrowDeviceRole.waterPump:
        return const ActuatorRoleSettings(pump: WaterPumpSettings());
      case GrowDeviceRole.exhaustFan:
      case GrowDeviceRole.intakeFan:
      case GrowDeviceRole.circulationFan:
        return const ActuatorRoleSettings(fan: FanOutletSettings());
      case GrowDeviceRole.heater:
      case GrowDeviceRole.genericOutlet:
        return const ActuatorRoleSettings(generic: GenericOutletSettings());
      default:
        return const ActuatorRoleSettings();
    }
  }

  ActuatorRoleSettings mergeOverride(ActuatorRoleSettings? other) {
    if (other == null) return this;
    return ActuatorRoleSettings(
      humidityLoad: other.humidityLoad ?? humidityLoad,
      light: other.light ?? light,
      pump: other.pump ?? pump,
      fan: other.fan ?? fan,
      generic: other.generic ?? generic,
    );
  }
}

/// Manual override: null = no override; true/fixed = force relay state until cleared.
enum ManualOutletCommand {
  none,
  forceOn,
  forceOff,
}
