class TelemetrySnapshot {
  const TelemetrySnapshot({
    this.timestampMs,
    this.engineRpm,
    this.engineTorqueNm,
    this.tpsPercent,
    this.vFl,
    this.vFr,
    this.vRl,
    this.vRr,
    this.gear,
    this.steeringAngleDeg,
    this.yawDegPerSec,
    this.lateralAccelG,
    this.vehicleSpeedKmh,
  });

  final int? timestampMs;
  final double? engineRpm;
  final double? engineTorqueNm;
  final double? tpsPercent;
  final double? vFl;
  final double? vFr;
  final double? vRl;
  final double? vRr;
  final int? gear;
  final double? steeringAngleDeg;
  final double? yawDegPerSec;
  final double? lateralAccelG;
  final double? vehicleSpeedKmh;

  bool get hasWheelSpeeds =>
      vFl != null && vFr != null && vRl != null && vRr != null;

  /// Rear average minus front average (km/h).
  double? get slipKmh {
    if (!hasWheelSpeeds) return null;
    final front = (vFl! + vFr!) / 2.0;
    final rear = (vRl! + vRr!) / 2.0;
    return rear - front;
  }
}
