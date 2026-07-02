import 'package:flutter/material.dart';

class GaugeVisibilityProvider extends ChangeNotifier {
  final Map<String, bool> gaugeVisibility;

  GaugeVisibilityProvider({required this.gaugeVisibility});

  /// Returns whether a given gauge is visible.
  /// If the gauge isn’t explicitly set, it now defaults to false.
  bool isVisible(String gaugeName) {
    return gaugeVisibility[gaugeName] ?? false;
  }

  /// Sets the visibility for a given gauge and notifies listeners.
  void setVisibility(String gaugeName, bool value) {
    if (gaugeVisibility[gaugeName] != value) {
      gaugeVisibility[gaugeName] = value;
      notifyListeners();
    }
  }

  /// Toggles the visibility for a given gauge.
  void toggleVisibility(String gaugeName) {
    final current = gaugeVisibility[gaugeName] ?? false;
    setVisibility(gaugeName, !current);
  }
}
