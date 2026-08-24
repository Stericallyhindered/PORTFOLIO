namespace Redline.Calibration.Domain;

public sealed record CustomerProfile(
    string Id,
    string DisplayName,
    string? Company,
    string? Email,
    string? Phone,
    string? Notes,
    DateTimeOffset CreatedUtc,
    DateTimeOffset ModifiedUtc);

public sealed record VehicleProfile(
    string Id,
    string CustomerId,
    string DisplayName,
    string? Vin,
    int? ModelYear,
    string Make,
    string Model,
    string? Chassis,
    string EngineFamily,
    string? Transmission,
    string? Odometer,
    string? Notes,
    DateTimeOffset CreatedUtc,
    DateTimeOffset ModifiedUtc);

public sealed record EngineBuildProfile(
    string Id,
    string VehicleId,
    int Revision,
    string Name,
    string Status,
    string EngineCode,
    int CylinderCount,
    int MainJournalCount,
    decimal? DisplacementCc,
    decimal? BoreMm,
    decimal? StrokeMm,
    decimal? CompressionRatio,
    string? Block,
    string? CylinderHead,
    string? Crankshaft,
    string? ConnectingRods,
    string? Pistons,
    string? HeadGasket,
    decimal? HeadGasketThicknessMm,
    string? Fuel,
    string? Builder,
    DateTimeOffset? AssemblyDateUtc,
    string? Notes,
    DateTimeOffset CreatedUtc,
    DateTimeOffset ModifiedUtc);

public sealed record BuildMeasurement(
    string Id,
    string EngineBuildId,
    string System,
    string Component,
    string Position,
    string Specification,
    decimal? TargetValue,
    decimal? ActualValue,
    decimal? MinimumValue,
    decimal? MaximumValue,
    string Unit,
    string? Method,
    string? Instrument,
    string? Source,
    string? Notes,
    int SortOrder);

public sealed record BuildFastenerEvent(
    string Id,
    string EngineBuildId,
    string FastenerGroup,
    string Position,
    string? Manufacturer,
    string? PartNumber,
    int InstallationCycle,
    decimal? TorqueNm,
    decimal? AngleDegrees,
    decimal? StretchMm,
    string? Lubricant,
    string? ProcedureSource,
    DateTimeOffset? PerformedUtc,
    string? Technician,
    string? Notes,
    int SortOrder);

public sealed record BuildHardwareComponent(
    string Id,
    string EngineBuildId,
    string System,
    string ComponentType,
    string? Manufacturer,
    string? Model,
    string? PartNumber,
    string? SerialNumber,
    decimal? RatedValue,
    string? RatedUnit,
    string? CalibrationData,
    string? Notes,
    int SortOrder);

public sealed record EngineBuildDocument(
    CustomerProfile Customer,
    VehicleProfile Vehicle,
    EngineBuildProfile Build,
    IReadOnlyList<BuildMeasurement> Measurements,
    IReadOnlyList<BuildFastenerEvent> FastenerEvents,
    IReadOnlyList<BuildHardwareComponent> Hardware);

public sealed record ProfileAsset(
    string Id,
    string VehicleId,
    string? EngineBuildId,
    string Kind,
    string Sha256,
    long SizeBytes,
    string OriginalFileName,
    string RelativeObjectPath,
    string? SoftwareId,
    string? Notes,
    DateTimeOffset ImportedUtc);

public static class EngineBuildTemplate
{
    public static IReadOnlyList<BuildMeasurement> CreateMeasurements(
        string engineBuildId,
        int cylinderCount = 6,
        int mainJournalCount = 7)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(engineBuildId);
        if (cylinderCount <= 0) throw new ArgumentOutOfRangeException(nameof(cylinderCount));
        if (mainJournalCount <= 0) throw new ArgumentOutOfRangeException(nameof(mainJournalCount));
        var rows = new List<BuildMeasurement>();

        void Add(string system, string component, string position, string specification, string unit)
        {
            rows.Add(new BuildMeasurement(
                Guid.NewGuid().ToString("N"), engineBuildId, system, component, position, specification,
                null, null, null, null, unit, null, null, null, null, rows.Count));
        }

        for (var cylinder = 1; cylinder <= cylinderCount; cylinder++)
        {
            var position = $"Cylinder {cylinder}";
            Add("Short block", "Cylinder bore", position, "Measured bore diameter", "mm");
            Add("Short block", "Piston", position, "Piston diameter", "mm");
            Add("Short block", "Piston", position, "Piston-to-wall clearance", "mm");
            Add("Rotating assembly", "Connecting rod", position, "Rod bearing oil clearance", "mm");
            Add("Rotating assembly", "Connecting rod", position, "Rod side clearance", "mm");
            Add("Piston rings", "Top ring", position, "End gap", "mm");
            Add("Piston rings", "Second ring", position, "End gap", "mm");
            Add("Piston rings", "Oil ring", position, "Rail end gap", "mm");
            Add("Compression", "Piston", position, "Deck clearance / protrusion", "mm");
        }

        for (var journal = 1; journal <= mainJournalCount; journal++)
        {
            Add("Rotating assembly", "Main bearing", $"Main {journal}", "Main bearing oil clearance", "mm");
        }

        Add("Rotating assembly", "Crankshaft", "Thrust bearing", "Crankshaft endplay", "mm");
        Add("Block", "Deck", "Bank / inline deck", "Deck flatness", "mm");
        Add("Cylinder head", "Deck surface", "Cylinder head", "Head flatness", "mm");
        Add("Compression", "Combustion chamber", "Engine", "Measured compression ratio", ":1");
        Add("Lubrication", "Oil pump", "Engine", "Oil-pump clearance / verification", "mm");
        return rows;
    }

    public static IReadOnlyList<BuildFastenerEvent> CreateFasteners(
        string engineBuildId,
        int cylinderCount = 6,
        int rodBoltsPerCylinder = 2)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(engineBuildId);
        var rows = new List<BuildFastenerEvent>();
        for (var cylinder = 1; cylinder <= cylinderCount; cylinder++)
        {
            for (var bolt = 1; bolt <= rodBoltsPerCylinder; bolt++)
            {
                rows.Add(NewFastener(engineBuildId, "Rod bolts", $"Cylinder {cylinder} / Bolt {bolt}", rows.Count));
            }
        }

        rows.Add(NewFastener(engineBuildId, "Main fasteners", "Main set / initial assembly", rows.Count));
        rows.Add(NewFastener(engineBuildId, "Cylinder-head fasteners", "Head set / initial assembly", rows.Count));
        rows.Add(NewFastener(engineBuildId, "Cylinder-head fasteners", "Head set / retorque 1", rows.Count));
        return rows;
    }

    public static IReadOnlyList<BuildHardwareComponent> CreateHardware(string engineBuildId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(engineBuildId);
        var types = new (string System, string Type, string Unit)[]
        {
            ("Air", "Turbocharger", ""),
            ("Fuel - low pressure", "LPFP", "lph"),
            ("Fuel - high pressure", "HPFP", "bar"),
            ("Fuel - direct injection", "DI injectors", "cc/min"),
            ("Fuel - port injection", "PI injectors", "cc/min"),
            ("Fuel - port injection", "PI controller", ""),
            ("Ignition", "Spark plugs", "mm gap"),
            ("Ignition", "Coils", ""),
            ("Sensors", "TMAP sensor", "bar"),
            ("Sensors", "Flex-fuel sensor", ""),
            ("Driveline", "Transmission", ""),
            ("Driveline", "Clutch / torque converter", "")
        };
        return types.Select((item, index) => new BuildHardwareComponent(
            Guid.NewGuid().ToString("N"), engineBuildId, item.System, item.Type,
            null, null, null, null, null, item.Unit, null, null, index)).ToArray();
    }

    private static BuildFastenerEvent NewFastener(string buildId, string group, string position, int order) => new(
        Guid.NewGuid().ToString("N"), buildId, group, position, null, null, 1,
        null, null, null, null, null, null, null, null, order);
}
