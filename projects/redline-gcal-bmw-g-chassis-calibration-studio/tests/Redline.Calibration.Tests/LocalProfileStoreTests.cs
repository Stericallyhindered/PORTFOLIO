using Redline.Calibration.Domain;
using Redline.Calibration.Persistence;
using System.Text.Json;

namespace Redline.Calibration.Tests;

public sealed class LocalProfileStoreTests
{
    [Fact]
    public async Task Saves_and_restores_complete_b58_build_document_with_exact_measurements()
    {
        using var temporary = new TemporaryDirectory();
        var store = new LocalProfileStore(temporary.PathFor("vault"));
        await store.InitializeAsync();
        var document = CreateDocument();
        var measured = document.Measurements[2] with
        {
            TargetValue = 0.07m,
            ActualValue = 0.068m,
            MinimumValue = 0.06m,
            MaximumValue = 0.08m,
            Method = "Dial bore gauge",
            Instrument = "Mitutoyo set 42",
            Source = "Builder specification rev C"
        };
        var fastener = document.FastenerEvents[0] with
        {
            Manufacturer = "ARP",
            TorqueNm = 27.5m,
            StretchMm = 0.132m,
            Lubricant = "Fastener lubricant",
            PerformedUtc = DateTimeOffset.Parse("2026-08-22T12:00:00Z")
        };
        document = document with
        {
            Measurements = document.Measurements.Select(row => row.Id == measured.Id ? measured : row).ToArray(),
            FastenerEvents = document.FastenerEvents.Select(row => row.Id == fastener.Id ? fastener : row).ToArray()
        };

        await store.SaveDocumentAsync(document);
        var restored = await store.GetDocumentAsync(document.Build.Id);

        Assert.Equal("Track M340i", restored.Vehicle.DisplayName);
        Assert.Equal("B58B30O1", restored.Build.EngineCode);
        Assert.Equal(10.2m, restored.Build.CompressionRatio);
        Assert.Equal(66, restored.Measurements.Count);
        Assert.Equal(15, restored.FastenerEvents.Count);
        Assert.Equal(12, restored.Hardware.Count);
        Assert.Equal(0.068m, restored.Measurements.Single(row => row.Id == measured.Id).ActualValue);
        Assert.Equal("Builder specification rev C", restored.Measurements.Single(row => row.Id == measured.Id).Source);
        Assert.Equal(0.132m, restored.FastenerEvents.Single(row => row.Id == fastener.Id).StretchMm);
        Assert.Equal("ARP", restored.FastenerEvents.Single(row => row.Id == fastener.Id).Manufacturer);
        Assert.Single(await store.GetCustomersAsync());
        Assert.Single(await store.GetVehiclesAsync(document.Customer.Id));
        Assert.Single(await store.GetBuildsAsync(document.Vehicle.Id));

        var firstPath = temporary.PathFor("revision-a.bin");
        var secondPath = temporary.PathFor("same-bytes-different-name.bin");
        await File.WriteAllBytesAsync(firstPath, new byte[] { 1, 2, 3, 4, 5 });
        await File.WriteAllBytesAsync(secondPath, new byte[] { 1, 2, 3, 4, 5 });
        var firstAsset = await store.ImportAssetAsync(document.Vehicle.Id, document.Build.Id, firstPath, "bin", "00005D55504809");
        var secondAsset = await store.ImportAssetAsync(document.Vehicle.Id, document.Build.Id, secondPath, "bin", "00005D55504809");
        var assets = await store.GetAssetsAsync(document.Build.Id);

        Assert.Equal(2, assets.Count);
        Assert.Equal(firstAsset.Sha256, secondAsset.Sha256);
        Assert.Equal(firstAsset.RelativeObjectPath, secondAsset.RelativeObjectPath);
        Assert.True(File.Exists(store.GetAssetObjectPath(firstAsset)));

        var reviewPath = temporary.PathFor("build.gcal-review.json");
        await new ProfileReviewExporter().ExportAsync(restored, assets, reviewPath);
        await using var reviewStream = File.OpenRead(reviewPath);
        using var review = await JsonDocument.ParseAsync(reviewStream);
        Assert.Equal("gcal.calibration-review.v1", review.RootElement.GetProperty("schema_version").GetString());
        Assert.Equal(66, review.RootElement.GetProperty("measurements").GetArrayLength());
        Assert.Equal(2, review.RootElement.GetProperty("assets").GetArrayLength());
    }

    [Fact]
    public async Task Rejects_cross_linked_build_rows_before_writing()
    {
        using var temporary = new TemporaryDirectory();
        var store = new LocalProfileStore(temporary.PathFor("vault"));
        await store.InitializeAsync();
        var document = CreateDocument();
        document = document with
        {
            Measurements = document.Measurements
                .Select((row, index) => index == 0 ? row with { EngineBuildId = "wrong-build" } : row)
                .ToArray()
        };

        await Assert.ThrowsAsync<InvalidDataException>(() => store.SaveDocumentAsync(document));
        Assert.Empty(await store.GetCustomersAsync());
    }

    [Fact]
    public void B58_and_s58_templates_are_configurable_not_hardcoded_to_one_definition()
    {
        var b58 = EngineBuildTemplate.CreateMeasurements("b58", 6, 7);
        var custom = EngineBuildTemplate.CreateMeasurements("custom", 4, 5);

        Assert.Equal(66, b58.Count);
        Assert.Equal(46, custom.Count);
        Assert.Contains(b58, row => row.Position == "Cylinder 6" && row.Component == "Top ring" && row.Specification == "End gap");
        Assert.Contains(b58, row => row.Position == "Main 7" && row.Specification == "Main bearing oil clearance");
        Assert.DoesNotContain(custom, row => row.Position == "Cylinder 6");
    }

    private static EngineBuildDocument CreateDocument()
    {
        var now = DateTimeOffset.Parse("2026-08-22T10:00:00Z");
        var customerId = Guid.NewGuid().ToString("N");
        var vehicleId = Guid.NewGuid().ToString("N");
        var buildId = Guid.NewGuid().ToString("N");
        var customer = new CustomerProfile(customerId, "Apex Customer", "Apex Motorsport", "customer@example.com", "555-0100", null, now, now);
        var vehicle = new VehicleProfile(vehicleId, customerId, "Track M340i", "WBA00000000000001", 2021, "BMW", "M340i", "G20", "B58", "8HP51", "18,400 mi", null, now, now);
        var build = new EngineBuildProfile(
            buildId, vehicleId, 1, "B58 max-effort build", "Draft", "B58B30O1", 6, 7,
            2998m, 82m, 94.6m, 10.2m, "Closed-deck B58 block", "Ported B58 head", "OEM forged crank",
            "Aftermarket rods", "Forged pistons", "MLS gasket", 1.2m, "E85", "REDLINE Engine Shop", now, null, now, now);
        return new EngineBuildDocument(
            customer,
            vehicle,
            build,
            EngineBuildTemplate.CreateMeasurements(buildId),
            EngineBuildTemplate.CreateFasteners(buildId),
            EngineBuildTemplate.CreateHardware(buildId));
    }
}
