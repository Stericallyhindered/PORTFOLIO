using Redline.Calibration.Domain;

namespace Redline.Calibration.Logs;

public static class CanonicalChannelIds
{
    public const string TimeSeconds = "log.time.seconds";
    public const string EngineSpeedRpm = "engine.speed.rpm";
    public const string AmbientPressurePsi = "pressure.ambient.psi";
    public const string AcceleratorPedalPercent = "driver.accelerator.percent";
    public const string BoostActualPsi = "boost.actual.psi";
    public const string ManifoldBoostPsi = "boost.manifold.psi";
    public const string BoostDeviationPsi = "boost.deviation.psi";
    public const string BoostTargetPsi = "boost.target.psi";
    public const string Gear = "drivetrain.gear";
    public const string IntakeAirTemperatureC = "temperature.intake_air.c";
    public const string LambdaAfr = "fuel.lambda_1.afr";
    public const string LoadActualPercent = "load.actual.percent";
    public const string LoadRequestedPercent = "load.requested.percent";
    public const string MassAirflowGps = "air.mass_flow.g_per_s";
    public const string OilTemperatureC = "temperature.oil.c";
    public const string RailPressurePsi = "fuel.rail_pressure.actual.psi";
    public const string ElectronicWastegatePositionMm = "wastegate.position.mm";
    public const string ShortTermFuelTrimPercent = "fuel.trim.short_term.percent";
    public const string ThrottlePositionPercent = "throttle.position.percent";
    public const string ClutchTorqueNm = "torque.clutch.actual.nm";
    public const string TransmissionTemperatureC = "temperature.transmission.c";
    public const string WastegateDutyCyclePercent = "wastegate.duty_cycle.percent";
}

public sealed record LogChannel(
    int SourceIndex,
    string OriginalHeader,
    string DisplayName,
    string? Unit,
    string? CanonicalId,
    bool IsMetadata);

public sealed record LogSeries(LogChannel Channel, IReadOnlyList<double?> Values);

public sealed record LogQualitySummary(
    int SampleCount,
    double? DurationSeconds,
    double? MedianSampleRateHz,
    IReadOnlyList<ValidationDiagnostic> Diagnostics);

public sealed record LogDataset(
    FileFingerprint Source,
    string Format,
    string? LoggerVersion,
    string? SoftwareId,
    string? CalibrationLabel,
    IReadOnlyList<LogSeries> Series,
    LogQualitySummary Quality)
{
    public LogSeries? FindCanonical(string canonicalId) =>
        Series.FirstOrDefault(series => string.Equals(series.Channel.CanonicalId, canonicalId, StringComparison.Ordinal));
}

