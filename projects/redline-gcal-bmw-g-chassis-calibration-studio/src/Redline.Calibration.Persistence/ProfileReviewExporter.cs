using System.Text.Json;
using System.Text.Json.Serialization;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Persistence;

public sealed class ProfileReviewExporter
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
    };

    public async Task ExportAsync(
        EngineBuildDocument document,
        IReadOnlyList<ProfileAsset> assets,
        string outputPath,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentNullException.ThrowIfNull(assets);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);
        var fullPath = Path.GetFullPath(outputPath);
        if (File.Exists(fullPath)) throw new IOException($"Review export already exists: {fullPath}");
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        var staging = $"{fullPath}.{Guid.NewGuid():N}.tmp";
        try
        {
            var package = new
            {
                SchemaVersion = "gcal.calibration-review.v1",
                ExportedUtc = DateTimeOffset.UtcNow,
                document.Customer,
                document.Vehicle,
                EngineBuild = document.Build,
                document.Measurements,
                document.FastenerEvents,
                document.Hardware,
                Assets = assets.Select(asset => new
                {
                    asset.Id,
                    asset.Kind,
                    asset.OriginalFileName,
                    asset.Sha256,
                    asset.SizeBytes,
                    asset.SoftwareId,
                    asset.Notes,
                    asset.ImportedUtc
                })
            };
            await using (var stream = new FileStream(staging, FileMode.CreateNew, FileAccess.Write, FileShare.None, 128 * 1024, FileOptions.Asynchronous | FileOptions.WriteThrough))
            {
                await JsonSerializer.SerializeAsync(stream, package, Options, cancellationToken).ConfigureAwait(false);
                await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
                stream.Flush(flushToDisk: true);
            }
            await using (var validation = File.OpenRead(staging))
            {
                using var json = await JsonDocument.ParseAsync(validation, cancellationToken: cancellationToken).ConfigureAwait(false);
                if (json.RootElement.GetProperty("schema_version").GetString() != "gcal.calibration-review.v1")
                    throw new InvalidDataException("Review export schema validation failed.");
            }
            File.Move(staging, fullPath);
        }
        finally
        {
            if (File.Exists(staging)) File.Delete(staging);
        }
    }
}
