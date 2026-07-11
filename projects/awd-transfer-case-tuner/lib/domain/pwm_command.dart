class PwmCommand {
  const PwmCommand({required this.dutyPercent});

  /// 0 = full RWD, 40 = full effective front lock (per project definition).
  final double dutyPercent;
}
