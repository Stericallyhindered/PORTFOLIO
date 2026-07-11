/// Rolling windows for chart / log review (aligned to [DateTime.now]).
enum TelemetryWindow {
  /// Last 60 minutes
  oneHour,

  /// Last 24 hours
  twentyFourHours,

  /// Last 7 days
  sevenDays,

  /// Last 30 days (approx. month)
  thirtyDays,

  /// Last 365 days — charts aggregate to daily buckets
  oneYear,
}

extension TelemetryWindowX on TelemetryWindow {
  String get label {
    switch (this) {
      case TelemetryWindow.oneHour:
        return '1h';
      case TelemetryWindow.twentyFourHours:
        return '24h';
      case TelemetryWindow.sevenDays:
        return '7d';
      case TelemetryWindow.thirtyDays:
        return '30d';
      case TelemetryWindow.oneYear:
        return '1y';
    }
  }

  Duration get duration {
    switch (this) {
      case TelemetryWindow.oneHour:
        return const Duration(hours: 1);
      case TelemetryWindow.twentyFourHours:
        return const Duration(hours: 24);
      case TelemetryWindow.sevenDays:
        return const Duration(days: 7);
      case TelemetryWindow.thirtyDays:
        return const Duration(days: 30);
      case TelemetryWindow.oneYear:
        return const Duration(days: 365);
    }
  }

  /// Whether RH/temp series should be aggregated for readability.
  bool get prefersAggregation =>
      this == TelemetryWindow.thirtyDays || this == TelemetryWindow.oneYear;
}
