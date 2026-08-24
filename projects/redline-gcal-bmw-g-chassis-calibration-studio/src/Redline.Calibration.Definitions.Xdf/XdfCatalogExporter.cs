using System.Text.Json;
using System.Text.Json.Serialization;

namespace Redline.Calibration.Definitions.Xdf;

public sealed class XdfCatalogExporter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
    };

    public async Task ExportAsync(
        XdfDefinitionDocument definition,
        string outputPath,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(definition);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);
        var fullPath = Path.GetFullPath(outputPath);
        if (File.Exists(fullPath)) throw new IOException($"Catalog output already exists: {fullPath}");
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        var stagingPath = $"{fullPath}.{Guid.NewGuid():N}.tmp";
        try
        {
            var catalog = new
            {
                SchemaVersion = "gcal.xdf-catalog.v1",
                ExportedUtc = DateTimeOffset.UtcNow,
                Definition = new
                {
                    definition.FormatVersion,
                    definition.Source,
                    definition.Header,
                    definition.Coverage,
                    definition.Diagnostics
                },
                Summary = new
                {
                    TableCount = definition.Tables.Count,
                    FlagCount = definition.Flags.Count,
                    CalibrationCount = definition.Tables.Count(table => table.Identity.Role == XdfTableRole.Calibration),
                    BreakpointCount = definition.Tables.Count(table => table.Identity.Role == XdfTableRole.BreakpointAxis),
                    DuplicateAliasCount = definition.Tables.Count(table => table.Identity.Role == XdfTableRole.DuplicateAlias),
                    Systems = definition.Tables
                        .GroupBy(table => table.Identity.System)
                        .OrderBy(group => group.Key)
                        .ToDictionary(group => group.Key.ToString(), group => group.Count())
                },
                definition.Tables,
                definition.Flags
            };

            await using (var stream = new FileStream(
                             stagingPath,
                             FileMode.CreateNew,
                             FileAccess.Write,
                             FileShare.None,
                             128 * 1024,
                             FileOptions.Asynchronous | FileOptions.WriteThrough))
            {
                await JsonSerializer.SerializeAsync(stream, catalog, JsonOptions, cancellationToken).ConfigureAwait(false);
                await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
                stream.Flush(flushToDisk: true);
            }

            await using (var validation = File.OpenRead(stagingPath))
            {
                using var json = await JsonDocument.ParseAsync(validation, cancellationToken: cancellationToken).ConfigureAwait(false);
                var schemaVersion = json.RootElement.GetProperty("schema_version").GetString();
            if (schemaVersion != "gcal.xdf-catalog.v1") throw new InvalidDataException("The exported catalog failed schema validation.");
            }

            File.Move(stagingPath, fullPath);
        }
        finally
        {
            if (File.Exists(stagingPath)) File.Delete(stagingPath);
        }
    }
}
