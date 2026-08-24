using Redline.Calibration.Logs;

namespace Redline.Calibration.Tests;

public sealed class MhdLogParserTests
{
    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Parses_real_mhd_log_with_software_id_channels_and_timing_quality()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        var path = Path.Combine(fixture, "2024-01-20_M340i_MHD_00005D55504809.csv");

        var log = await new MhdLogParser().ParseAsync(path);

        Assert.Equal("4104E96A324FEF105A7BCEB55DB26F56E878BDA4E9CA5B144B67F30E8A736DE3", log.Source.Sha256);
        Assert.Equal("00005D55504809", log.SoftwareId);
        Assert.Equal("4.1.6", log.LoggerVersion);
        Assert.True(log.Quality.SampleCount > 100);
        Assert.InRange(log.Quality.MedianSampleRateHz!.Value, 20, 30);
        Assert.Equal(1796, log.FindCanonical(CanonicalChannelIds.EngineSpeedRpm)!.Values[0]);
        Assert.Equal(100, log.FindCanonical(CanonicalChannelIds.WastegateDutyCyclePercent)!.Values[0]);
        Assert.DoesNotContain(log.Quality.Diagnostics, diagnostic => diagnostic.Severity == Redline.Calibration.Domain.DiagnosticSeverity.Error);
    }
}

