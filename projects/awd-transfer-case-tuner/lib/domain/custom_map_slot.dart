import 'mode_bundle.dart';

class CustomMapSlot {
  CustomMapSlot({
    required this.slotId,
    required this.displayName,
    required this.bundle,
  }) : assert(slotId >= 1 && slotId <= 3);

  final int slotId;
  final String displayName;
  final ModeBundle bundle;

  CustomMapSlot copyWith({
    int? slotId,
    String? displayName,
    ModeBundle? bundle,
  }) {
    return CustomMapSlot(
      slotId: slotId ?? this.slotId,
      displayName: displayName ?? this.displayName,
      bundle: bundle ?? this.bundle,
    );
  }

  Map<String, dynamic> toJson() => {
        'slotId': slotId,
        'displayName': displayName,
        'bundle': bundle.toJson(),
      };

  factory CustomMapSlot.fromJson(Map<String, dynamic> json) {
    return CustomMapSlot(
      slotId: (json['slotId'] as num).toInt(),
      displayName: json['displayName'] as String? ?? 'Custom',
      bundle: ModeBundle.fromJson(Map<String, dynamic>.from(json['bundle'] as Map)),
    );
  }
}
