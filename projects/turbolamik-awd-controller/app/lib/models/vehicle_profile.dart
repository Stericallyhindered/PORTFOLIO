class VehicleProfile {
  const VehicleProfile({
    required this.id,
    required this.displayName,
    required this.busBitrate,
    required this.sharedBus,
    required this.supportsYawRate,
    required this.watchedIds,
    required this.requiredSignals,
    required this.optionalSignals,
    required this.notes,
  });

  final String id;
  final String displayName;
  final int busBitrate;
  final bool sharedBus;
  final bool supportsYawRate;
  final List<int> watchedIds;
  final List<String> requiredSignals;
  final List<String> optionalSignals;
  final List<String> notes;
}
