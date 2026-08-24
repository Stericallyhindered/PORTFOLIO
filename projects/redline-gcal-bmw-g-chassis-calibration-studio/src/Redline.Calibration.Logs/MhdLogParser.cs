using System.Globalization;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Logs;

public sealed partial class MhdLogParser
{
    private static readonly IReadOnlyDictionary<string, string> CanonicalAliases =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["time"] = CanonicalChannelIds.TimeSeconds,
            ["rpm"] = CanonicalChannelIds.EngineSpeedRpm,
            ["ambpressure"] = CanonicalChannelIds.AmbientPressurePsi,
            ["accelpedpos"] = CanonicalChannelIds.AcceleratorPedalPercent,
            ["boost"] = CanonicalChannelIds.BoostActualPsi,
            ["boostmani"] = CanonicalChannelIds.ManifoldBoostPsi,
            ["boostdeviation"] = CanonicalChannelIds.BoostDeviationPsi,
            ["boosttarget"] = CanonicalChannelIds.BoostTargetPsi,
            ["gear"] = CanonicalChannelIds.Gear,
            ["iat"] = CanonicalChannelIds.IntakeAirTemperatureC,
            ["lambda1"] = CanonicalChannelIds.LambdaAfr,
            ["loadact"] = CanonicalChannelIds.LoadActualPercent,
            ["loadreq"] = CanonicalChannelIds.LoadRequestedPercent,
            ["maf"] = CanonicalChannelIds.MassAirflowGps,
            ["oiltemp"] = CanonicalChannelIds.OilTemperatureC,
            ["railpressuremean1"] = CanonicalChannelIds.RailPressurePsi,
            ["rawposewg"] = CanonicalChannelIds.ElectronicWastegatePositionMm,
            ["stft1"] = CanonicalChannelIds.ShortTermFuelTrimPercent,
            ["throttleposition"] = CanonicalChannelIds.ThrottlePositionPercent,
            ["torqueactclutch"] = CanonicalChannelIds.ClutchTorqueNm,
            ["transmissiontemp"] = CanonicalChannelIds.TransmissionTemperatureC,
            ["wgdc1"] = CanonicalChannelIds.WastegateDutyCyclePercent
        };

    public async Task<LogDataset> ParseAsync(string path, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        var fullPath = Path.GetFullPath(path);
        var fileBytes = await File.ReadAllBytesAsync(fullPath, cancellationToken).ConfigureAwait(false);
        var fingerprint = new FileFingerprint(
            Path.GetFileName(fullPath),
            fileBytes.LongLength,
            Convert.ToHexString(SHA256.HashData(fileBytes)));

        using var memory = new MemoryStream(fileBytes, writable: false);
        using var text = new StreamReader(memory, detectEncodingFromByteOrderMarks: true);
        var csv = new CsvRecordReader(text);
        var headers = await csv.ReadAsync(cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidDataException("The log is empty.");
        if (headers.Length < 2)
        {
            throw new InvalidDataException("The log does not contain a usable CSV header.");
        }

        var channels = headers.Select((header, index) => ParseChannel(header, index)).ToArray();
        var columns = channels.Select(_ => new List<double?>()).ToArray();
        var diagnostics = new List<ValidationDiagnostic>();
        var malformedRows = 0;
        var rowNumber = 1;

        while (await csv.ReadAsync(cancellationToken).ConfigureAwait(false) is { } record)
        {
            rowNumber++;
            if (record.Length == 1 && string.IsNullOrWhiteSpace(record[0])) continue;
            if (record.Length != headers.Length)
            {
                malformedRows++;
                continue;
            }

            for (var index = 0; index < record.Length; index++)
            {
                var value = record[index].Trim();
                columns[index].Add(double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
                    && double.IsFinite(parsed)
                        ? parsed
                        : null);
            }
        }

        if (malformedRows > 0)
        {
            diagnostics.Add(new ValidationDiagnostic(
                "LOG-CSV-001",
                DiagnosticSeverity.Warning,
                $"Skipped {malformedRows} rows whose field count did not match the {headers.Length}-column header."));
        }

        var series = channels.Select((channel, index) => new LogSeries(channel, columns[index])).ToArray();
        AddRequiredChannelDiagnostics(series, diagnostics);
        var timing = AnalyzeTiming(series, diagnostics);
        var metadataHeader = channels.FirstOrDefault(channel => channel.IsMetadata)?.OriginalHeader;
        var softwareId = metadataHeader is null ? null : SoftwareIdRegex().Match(metadataHeader).Value;
        if (string.IsNullOrWhiteSpace(softwareId)) softwareId = null;
        var loggerMatch = metadataHeader is null ? Match.Empty : LoggerVersionRegex().Match(metadataHeader);

        return new LogDataset(
            fingerprint,
            "MHD CSV",
            loggerMatch.Success ? loggerMatch.Groups[1].Value : null,
            softwareId,
            metadataHeader,
            series,
            new LogQualitySummary(columns[0].Count, timing.DurationSeconds, timing.MedianRateHz, diagnostics));
    }

    private static LogChannel ParseChannel(string header, int index)
    {
        var trimmed = header.Trim().TrimStart('\uFEFF');
        var isMetadata = trimmed.StartsWith("MHD ", StringComparison.OrdinalIgnoreCase);
        var unitMatch = UnitRegex().Match(trimmed);
        var displayName = unitMatch.Success ? trimmed[..unitMatch.Index].Trim() : trimmed;
        var unit = unitMatch.Success ? unitMatch.Groups[1].Value.Trim() : null;
        var normalized = Normalize(displayName);
        string? canonicalId = null;
        if (!isMetadata)
        {
            if (TimingCylinderRegex().IsMatch(normalized))
            {
                var cylinder = TimingCylinderRegex().Match(normalized).Groups[1].Value;
                canonicalId = $"ignition.timing.cylinder_{cylinder}.degrees";
            }
            else
            {
                CanonicalAliases.TryGetValue(normalized, out canonicalId);
            }
        }

        return new LogChannel(index, trimmed, displayName, unit, canonicalId, isMetadata);
    }

    private static string Normalize(string value) =>
        new(value.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());

    private static void AddRequiredChannelDiagnostics(
        IReadOnlyList<LogSeries> series,
        ICollection<ValidationDiagnostic> diagnostics)
    {
        foreach (var required in new[] { CanonicalChannelIds.TimeSeconds, CanonicalChannelIds.EngineSpeedRpm })
        {
            if (series.All(item => item.Channel.CanonicalId != required))
            {
                diagnostics.Add(new ValidationDiagnostic(
                    "LOG-SCHEMA-001",
                    DiagnosticSeverity.Error,
                    $"Required channel '{required}' is missing."));
            }
        }

        foreach (var item in series.Where(item => !item.Channel.IsMetadata))
        {
            var missing = item.Values.Count(value => !value.HasValue);
            if (missing > 0)
            {
                diagnostics.Add(new ValidationDiagnostic(
                    "LOG-DATA-001",
                    DiagnosticSeverity.Warning,
                    $"'{item.Channel.OriginalHeader}' has {missing} missing or non-numeric samples."));
            }
        }
    }

    private static (double? DurationSeconds, double? MedianRateHz) AnalyzeTiming(
        IReadOnlyList<LogSeries> series,
        ICollection<ValidationDiagnostic> diagnostics)
    {
        var time = series.FirstOrDefault(item => item.Channel.CanonicalId == CanonicalChannelIds.TimeSeconds);
        if (time is null) return (null, null);
        var samples = time.Values.Where(value => value.HasValue).Select(value => value!.Value).ToArray();
        if (samples.Length < 2) return (null, null);
        var deltas = new List<double>(samples.Length - 1);
        for (var index = 1; index < samples.Length; index++)
        {
            var delta = samples[index] - samples[index - 1];
            if (delta <= 0)
            {
                diagnostics.Add(new ValidationDiagnostic(
                    "LOG-TIME-001",
                    DiagnosticSeverity.Error,
                    $"Timestamp order is invalid at parsed sample {index + 1}."));
                continue;
            }

            deltas.Add(delta);
        }

        if (deltas.Count == 0) return (samples[^1] - samples[0], null);
        deltas.Sort();
        var median = deltas.Count % 2 == 0
            ? (deltas[(deltas.Count / 2) - 1] + deltas[deltas.Count / 2]) / 2
            : deltas[deltas.Count / 2];
        return (samples[^1] - samples[0], median > 0 ? 1 / median : null);
    }

    [GeneratedRegex(@"\(([^()]*)\)\s*$", RegexOptions.CultureInvariant)]
    private static partial Regex UnitRegex();

    [GeneratedRegex(@"^timingcyl(\d+)$", RegexOptions.CultureInvariant)]
    private static partial Regex TimingCylinderRegex();

    [GeneratedRegex(@"\b[0-9A-F]{14}\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SoftwareIdRegex();

    [GeneratedRegex(@"^MHD\s+([^\s]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex LoggerVersionRegex();
}
