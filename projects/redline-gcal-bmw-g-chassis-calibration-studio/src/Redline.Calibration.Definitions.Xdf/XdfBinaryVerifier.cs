using Redline.Calibration.Binary;

namespace Redline.Calibration.Definitions.Xdf;

public sealed class XdfBinaryVerifier
{
    public XdfBinaryVerificationReport Verify(XdfDefinitionDocument definition, CalibrationBinaryDocument binary)
    {
        ArgumentNullException.ThrowIfNull(definition);
        ArgumentNullException.ThrowIfNull(binary);
        var findings = new List<XdfBinaryVerificationFinding>();
        var ranges = new List<XdfDefinitionByteRange>();

        if (definition.Header.Region is { SizeBytes: > 0 } region && region.SizeBytes != binary.Length)
        {
            findings.Add(new(XdfVerificationSeverity.Error, "XDF-BIN-REGION-001",
                $"XDF region '{region.Name}' declares {region.SizeBytes:N0} bytes but the BIN contains {binary.Length:N0} bytes.", null));
        }

        foreach (var table in definition.Tables)
        {
            AddTableRange(table, binary.Length, ranges, findings);
        }
        foreach (var constant in definition.Constants)
        {
            AddScalarRange(constant.Id, constant.Title, constant.Address, constant.Encoding, constant.CanWrite, constant.Limitations, binary.Length, ranges, findings);
        }
        foreach (var flag in definition.Flags)
        {
            AddScalarRange(flag.Id, flag.Title, flag.Address, flag.Encoding, flag.CanWrite, flag.Limitations, binary.Length, ranges, findings);
        }

        var ordered = ranges.OrderBy(range => range.Offset).ThenBy(range => range.Length).ToArray();
        for (var index = 1; index < ordered.Length; index++)
        {
            var previous = ordered[index - 1];
            var current = ordered[index];
            if (current.Offset < previous.EndExclusive && previous.DefinitionId != current.DefinitionId)
            {
                findings.Add(new(XdfVerificationSeverity.Warning, "XDF-BIN-OVERLAP-001",
                    $"'{current.Title}' overlaps '{previous.Title}' at 0x{current.Offset:X}-0x{Math.Min(current.EndExclusive, previous.EndExclusive) - 1:X}. Shared axes and aliases require tuner review.", current.DefinitionId));
            }
        }

        return new XdfBinaryVerificationReport(
            definition.Source.Sha256,
            binary.SourceFingerprint.Sha256,
            binary.Length,
            ranges,
            findings,
            findings.All(finding => finding.Severity != XdfVerificationSeverity.Error));
    }

    private static void AddTableRange(XdfTableDefinition table, int binaryLength, ICollection<XdfDefinitionByteRange> ranges, ICollection<XdfBinaryVerificationFinding> findings)
    {
        if (!table.CanWrite || !table.ZAxis.Address.HasValue)
        {
            findings.Add(new(XdfVerificationSeverity.Information, "XDF-BIN-TABLE-001", $"'{table.Title}' is excluded from verified writing: {string.Join(" ", table.Limitations)}", table.Id));
            return;
        }
        if (table.ZAxis.MajorStrideBits != 0 || table.ZAxis.MinorStrideBits != 0)
        {
            findings.Add(new(XdfVerificationSeverity.Error, "XDF-BIN-TABLE-STRIDE-001", $"'{table.Title}' uses a stride layout that has not been proven for write access.", table.Id));
            return;
        }
        try
        {
            var length = checked(table.RowCount * table.ColumnCount * table.ZAxis.Encoding.SizeBytes);
            AddRange(table.Id, table.Title, checked((int)table.ZAxis.Address.Value), length, binaryLength, ranges, findings);
        }
        catch (Exception exception) when (exception is OverflowException or NotSupportedException)
        {
            findings.Add(new(XdfVerificationSeverity.Error, "XDF-BIN-TABLE-RANGE-001", $"'{table.Title}' has an invalid byte range: {exception.Message}", table.Id));
        }
    }

    private static void AddScalarRange(string id, string title, long? address, BinaryEncoding encoding, bool canWrite, IReadOnlyList<string> limitations, int binaryLength, ICollection<XdfDefinitionByteRange> ranges, ICollection<XdfBinaryVerificationFinding> findings)
    {
        if (!canWrite || !address.HasValue)
        {
            findings.Add(new(XdfVerificationSeverity.Information, "XDF-BIN-SCALAR-001", $"'{title}' is excluded from verified writing: {string.Join(" ", limitations)}", id));
            return;
        }
        try { AddRange(id, title, checked((int)address.Value), encoding.SizeBytes, binaryLength, ranges, findings); }
        catch (Exception exception) when (exception is OverflowException or NotSupportedException)
        {
            findings.Add(new(XdfVerificationSeverity.Error, "XDF-BIN-SCALAR-RANGE-001", $"'{title}' has an invalid byte range: {exception.Message}", id));
        }
    }

    private static void AddRange(string id, string title, int offset, int length, int binaryLength, ICollection<XdfDefinitionByteRange> ranges, ICollection<XdfBinaryVerificationFinding> findings)
    {
        if (offset < 0 || length <= 0 || offset > binaryLength - length)
        {
            findings.Add(new(XdfVerificationSeverity.Error, "XDF-BIN-BOUNDS-001", $"'{title}' resolves to [{offset}, {offset + (long)length}), outside the {binaryLength:N0}-byte BIN.", id));
            return;
        }
        ranges.Add(new XdfDefinitionByteRange(id, title, offset, length));
    }
}

public enum XdfVerificationSeverity { Information, Warning, Error }
public sealed record XdfDefinitionByteRange(string DefinitionId, string Title, int Offset, int Length)
{
    public int EndExclusive => checked(Offset + Length);
}
public sealed record XdfBinaryVerificationFinding(XdfVerificationSeverity Severity, string Code, string Message, string? DefinitionId);
public sealed record XdfBinaryVerificationReport(string DefinitionSha256, string BinarySha256, int BinaryLength, IReadOnlyList<XdfDefinitionByteRange> WritableRanges, IReadOnlyList<XdfBinaryVerificationFinding> Findings, bool IsCompatible);
