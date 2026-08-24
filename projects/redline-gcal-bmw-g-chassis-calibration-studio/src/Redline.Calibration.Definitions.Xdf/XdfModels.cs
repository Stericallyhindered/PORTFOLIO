using Redline.Calibration.Binary;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Definitions.Xdf;

public sealed record XdfDefinitionDocument(
    string FormatVersion,
    FileFingerprint Source,
    XdfHeader Header,
    IReadOnlyList<XdfTableDefinition> Tables,
    IReadOnlyList<XdfConstantDefinition> Constants,
    IReadOnlyList<XdfFlagDefinition> Flags,
    XdfCoverage Coverage,
    IReadOnlyList<ValidationDiagnostic> Diagnostics);

public sealed record XdfCoverage(int TableCount, int ConstantCount, int FlagCount, int PatchCount);

public sealed record XdfHeader(
    long BaseOffset,
    bool SubtractBaseOffset,
    XdfDefaults Defaults,
    XdfRegion? Region,
    IReadOnlyList<XdfCategoryDefinition> Categories,
    XdfCategoryReferenceMode CategoryReferenceMode);

public sealed record XdfCategoryDefinition(int SourceIndex, int MemberId, string Name);

public enum XdfCategoryReferenceMode
{
    OneBasedMemberId,
    DirectSourceIndex
}

public sealed record XdfDefaults(
    int DataSizeBits,
    bool Signed,
    bool LsbFirst,
    bool FloatingPoint);

public sealed record XdfRegion(long StartAddress, long SizeBytes, string Name);

public sealed record XdfTableDefinition(
    string Id,
    int SourceIndex,
    string? UniqueId,
    int? Flags,
    string Title,
    string? Description,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<string> CategoryNames,
    XdfAxisDefinition XAxis,
    XdfAxisDefinition YAxis,
    XdfAxisDefinition ZAxis,
    int RowCount,
    int ColumnCount,
    bool CanRead,
    bool CanWrite,
    IReadOnlyList<string> Limitations,
    XdfTableIdentity Identity);

public enum XdfTableShape
{
    Scalar,
    Curve,
    Map
}

public enum XdfTableRole
{
    Calibration,
    BreakpointAxis,
    DuplicateAlias
}

public enum XdfCalibrationSystem
{
    Boost,
    WastegateControl,
    Fueling,
    DirectInjection,
    PortInjection,
    LowPressureFuel,
    HighPressureFuel,
    Ignition,
    KnockControl,
    Torque,
    Load,
    Throttle,
    Vanos,
    Sensors,
    Idle,
    RevLimits,
    VehicleSpeedLimits,
    Transmission,
    Exhaust,
    Cooling,
    Airflow,
    OilPressure,
    LaunchControl,
    Safeties,
    Instrumentation,
    Configuration,
    Uncategorized
}

public sealed record XdfTableIdentity(
    string DisplayTitle,
    string? Symbol,
    XdfCalibrationSystem System,
    XdfTableShape Shape,
    XdfTableRole Role,
    string SourceClass,
    double Confidence,
    IReadOnlyList<string> Evidence,
    IReadOnlyList<string> ParentTableIds,
    IReadOnlyList<string> AliasTableIds,
    string SearchText,
    string SortKey);

public sealed record XdfFlagDefinition(
    string Id,
    int SourceIndex,
    string? UniqueId,
    int? Flags,
    string Title,
    string? Description,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<string> CategoryNames,
    long? Address,
    BinaryEncoding Encoding,
    ulong Mask,
    bool CanRead,
    bool CanWrite,
    IReadOnlyList<string> Limitations,
    XdfCalibrationSystem System,
    string SearchText);

public sealed record XdfConstantDefinition(
    string Id,
    int SourceIndex,
    string? UniqueId,
    int? Flags,
    string Title,
    string? Description,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<string> CategoryNames,
    long? Address,
    BinaryEncoding Encoding,
    string? Units,
    int DecimalPlaces,
    string Equation,
    AffineTransform? Transform,
    bool CanRead,
    bool CanWrite,
    IReadOnlyList<string> Limitations,
    XdfCalibrationSystem System,
    string SearchText);

public sealed record XdfAxisDefinition(
    string Id,
    long? Address,
    int ElementSizeBits,
    int Count,
    int? RowCount,
    int? ColumnCount,
    int MajorStrideBits,
    int MinorStrideBits,
    int? TypeFlags,
    BinaryEncoding Encoding,
    bool IsColumnMajor,
    string? Units,
    int DecimalPlaces,
    string Equation,
    AffineTransform? Transform,
    IReadOnlyList<double> Labels,
    int UnknownTypeFlags)
{
    public bool IsEmbedded => Address.HasValue;
}

public sealed record XdfTableData(
    XdfTableDefinition Definition,
    IReadOnlyList<double> XAxisValues,
    IReadOnlyList<double> YAxisValues,
    double[,] EngineeringValues,
    double[,] RawValues);
