class SignalReading {
  const SignalReading({
    required this.label,
    required this.value,
    required this.unit,
    required this.source,
  });

  final String label;
  final String value;
  final String unit;
  final String source;
}

class DerivedMetrics {
  const DerivedMetrics({
    required this.frontAxleSpeedKph,
    required this.rearAxleSpeedKph,
    required this.frontRearSpeedDeltaKph,
    required this.rearSlipRatio,
    required this.frontSlipRatio,
    required this.leftRightDeltaFrontKph,
    required this.leftRightDeltaRearKph,
    required this.turningState,
    required this.drivetrainState,
  });

  final double frontAxleSpeedKph;
  final double rearAxleSpeedKph;
  final double frontRearSpeedDeltaKph;
  final double rearSlipRatio;
  final double frontSlipRatio;
  final double leftRightDeltaFrontKph;
  final double leftRightDeltaRearKph;
  final String turningState;
  final String drivetrainState;
}

class AwdShadowOutput {
  const AwdShadowOutput({
    required this.awdRequestPct,
    required this.basePrechargePct,
    required this.slipAddPct,
    required this.shiftAddPct,
    required this.clampPct,
    required this.degraded,
  });

  final double awdRequestPct;
  final double basePrechargePct;
  final double slipAddPct;
  final double shiftAddPct;
  final double clampPct;
  final bool degraded;
}

class LiveSnapshot {
  const LiveSnapshot({
    required this.timestamp,
    required this.engineRpm,
    required this.throttlePct,
    required this.wheelSpeedFlKph,
    required this.wheelSpeedFrKph,
    required this.wheelSpeedRlKph,
    required this.wheelSpeedRrKph,
    required this.vehicleSpeedKph,
    required this.steeringAngleDeg,
    required this.brakeActive,
    required this.handbrakeActive,
    required this.reverseActive,
    required this.gearCurrent,
    required this.gearTarget,
    required this.gearboxMode,
    required this.gearboxProgram,
    required this.lockupPct,
    required this.wheelTorqueNm,
    required this.torqueReductionPct,
    required this.torqueReductionActive,
    required this.shiftActive,
    required this.inputShaftRpm,
    required this.outputShaftRpm,
    required this.clutchSlipPct,
    required this.converterSlipPct,
    required this.gearboxOilTempC,
    required this.brakePressureProxy,
    required this.metrics,
    required this.shadowOutput,
  });

  final DateTime timestamp;
  final double engineRpm;
  final double throttlePct;
  final double wheelSpeedFlKph;
  final double wheelSpeedFrKph;
  final double wheelSpeedRlKph;
  final double wheelSpeedRrKph;
  final double vehicleSpeedKph;
  final double steeringAngleDeg;
  final bool brakeActive;
  final bool handbrakeActive;
  final bool reverseActive;
  final int gearCurrent;
  final int gearTarget;
  final int gearboxMode;
  final int gearboxProgram;
  final double lockupPct;
  final double wheelTorqueNm;
  final double torqueReductionPct;
  final bool torqueReductionActive;
  final bool shiftActive;
  final double inputShaftRpm;
  final double outputShaftRpm;
  final double clutchSlipPct;
  final double converterSlipPct;
  final double gearboxOilTempC;
  final double brakePressureProxy;
  final DerivedMetrics metrics;
  final AwdShadowOutput shadowOutput;

  List<SignalReading> get signalRows => <SignalReading>[
    SignalReading(
      label: 'Engine RPM',
      value: engineRpm.toStringAsFixed(0),
      unit: 'rpm',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Throttle',
      value: throttlePct.toStringAsFixed(1),
      unit: '%',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Wheel Speed FL',
      value: wheelSpeedFlKph.toStringAsFixed(1),
      unit: 'km/h',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Wheel Speed FR',
      value: wheelSpeedFrKph.toStringAsFixed(1),
      unit: 'km/h',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Wheel Speed RL',
      value: wheelSpeedRlKph.toStringAsFixed(1),
      unit: 'km/h',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Wheel Speed RR',
      value: wheelSpeedRrKph.toStringAsFixed(1),
      unit: 'km/h',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Vehicle Speed',
      value: vehicleSpeedKph.toStringAsFixed(1),
      unit: 'km/h',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Steering Angle',
      value: steeringAngleDeg.toStringAsFixed(1),
      unit: 'deg',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Brake Active',
      value: brakeActive ? 'ON' : 'OFF',
      unit: '',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Handbrake',
      value: handbrakeActive ? 'ON' : 'OFF',
      unit: '',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Reverse',
      value: reverseActive ? 'ON' : 'OFF',
      unit: '',
      source: 'E90 CAN',
    ),
    SignalReading(
      label: 'Gear Current',
      value: '$gearCurrent',
      unit: '',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Gear Target',
      value: '$gearTarget',
      unit: '',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Gearbox Mode',
      value: '$gearboxMode',
      unit: '',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Gearbox Program',
      value: 'P$gearboxProgram',
      unit: '',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Lockup',
      value: lockupPct.toStringAsFixed(1),
      unit: '%',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Wheel Torque',
      value: wheelTorqueNm.toStringAsFixed(0),
      unit: 'Nm',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Torque Reduction',
      value: torqueReductionPct.toStringAsFixed(1),
      unit: '%',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Torque Reduction Flag',
      value: torqueReductionActive ? 'ON' : 'OFF',
      unit: '',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Shift Active',
      value: shiftActive ? 'ON' : 'OFF',
      unit: '',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Input Shaft',
      value: inputShaftRpm.toStringAsFixed(0),
      unit: 'rpm',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Output Shaft',
      value: outputShaftRpm.toStringAsFixed(0),
      unit: 'rpm',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Clutch Slip',
      value: clutchSlipPct.toStringAsFixed(1),
      unit: '%',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Converter Slip',
      value: converterSlipPct.toStringAsFixed(1),
      unit: '%',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Gearbox Oil Temp',
      value: gearboxOilTempC.toStringAsFixed(1),
      unit: 'C',
      source: 'TurboLamik',
    ),
    SignalReading(
      label: 'Brake Proxy',
      value: brakePressureProxy.toStringAsFixed(1),
      unit: '%',
      source: 'E90 CAN',
    ),
  ];
}
