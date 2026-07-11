class BiasMap2D {
  BiasMap2D({
    required this.cells,
    this.revision = 1,
  }) : assert(cells.isNotEmpty && cells.every((r) => r.isNotEmpty));

  /// Row = slip (Y), Col = torque (X). Values are PWM percent [0, 40].
  final List<List<double>> cells;
  final int revision;

  int get rows => cells.length;
  int get cols => cells.first.length;

  BiasMap2D copyResize({
    required int newRows,
    required int newCols,
    double fill = 0,
  }) {
    final next = List.generate(
      newRows,
      (i) => List<double>.generate(
        newCols,
        (j) =>
            i < rows && j < cols ? cells[i][j] : fill,
      ),
    );
    return BiasMap2D(cells: next, revision: revision + 1);
  }

  Map<String, dynamic> toJson() => {
        'revision': revision,
        'cells': cells,
      };

  factory BiasMap2D.fromJson(Map<String, dynamic> json) {
    final raw = json['cells'] as List<dynamic>? ?? const [];
    final cells = raw
        .map(
          (row) => (row as List<dynamic>).map((e) => (e as num).toDouble()).toList(),
        )
        .toList();
    return BiasMap2D(
      cells: cells,
      revision: (json['revision'] as num?)?.toInt() ?? 1,
    );
  }
}
