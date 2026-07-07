class HealthStatus {
  const HealthStatus({
    required this.bleConnected,
    required this.captureActive,
    required this.busBitrate,
    required this.uptime,
    required this.totalFrames,
    required this.decoderErrors,
    required this.staleSignals,
    required this.frameRatesHz,
  });

  final bool bleConnected;
  final bool captureActive;
  final int busBitrate;
  final Duration uptime;
  final int totalFrames;
  final int decoderErrors;
  final List<String> staleSignals;
  final Map<int, double> frameRatesHz;

  HealthStatus copyWith({
    bool? bleConnected,
    bool? captureActive,
    int? busBitrate,
    Duration? uptime,
    int? totalFrames,
    int? decoderErrors,
    List<String>? staleSignals,
    Map<int, double>? frameRatesHz,
  }) {
    return HealthStatus(
      bleConnected: bleConnected ?? this.bleConnected,
      captureActive: captureActive ?? this.captureActive,
      busBitrate: busBitrate ?? this.busBitrate,
      uptime: uptime ?? this.uptime,
      totalFrames: totalFrames ?? this.totalFrames,
      decoderErrors: decoderErrors ?? this.decoderErrors,
      staleSignals: staleSignals ?? this.staleSignals,
      frameRatesHz: frameRatesHz ?? this.frameRatesHz,
    );
  }
}
