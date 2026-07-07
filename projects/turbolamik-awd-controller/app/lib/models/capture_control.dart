enum CaptureFilterMode { selectedProfile, fullBus }

class CaptureControl {
  const CaptureControl({
    required this.active,
    required this.maxFrames,
    required this.filterMode,
    required this.bufferedFrames,
  });

  final bool active;
  final int maxFrames;
  final CaptureFilterMode filterMode;
  final int bufferedFrames;

  CaptureControl copyWith({
    bool? active,
    int? maxFrames,
    CaptureFilterMode? filterMode,
    int? bufferedFrames,
  }) {
    return CaptureControl(
      active: active ?? this.active,
      maxFrames: maxFrames ?? this.maxFrames,
      filterMode: filterMode ?? this.filterMode,
      bufferedFrames: bufferedFrames ?? this.bufferedFrames,
    );
  }
}
