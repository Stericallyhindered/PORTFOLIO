class AxisDefinition {
  const AxisDefinition({
    required this.label,
    required this.unit,
    required this.breakpoints,
  });

  final String label;
  final String unit;
  final List<double> breakpoints;

  int get cellCount {
    if (breakpoints.length < 2) return 0;
    return breakpoints.length - 1;
  }

  AxisDefinition copyWith({
    String? label,
    String? unit,
    List<double>? breakpoints,
  }) {
    return AxisDefinition(
      label: label ?? this.label,
      unit: unit ?? this.unit,
      breakpoints: breakpoints ?? List<double>.from(this.breakpoints),
    );
  }

  Map<String, dynamic> toJson() => {
        'label': label,
        'unit': unit,
        'breakpoints': breakpoints,
      };

  factory AxisDefinition.fromJson(Map<String, dynamic> json) {
    return AxisDefinition(
      label: json['label'] as String? ?? 'Axis',
      unit: json['unit'] as String? ?? '',
      breakpoints: (json['breakpoints'] as List<dynamic>? ?? const [])
          .map((e) => (e as num).toDouble())
          .toList(),
    );
  }
}
