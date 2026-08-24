using System.Globalization;
using System.Security.Cryptography;
using System.Xml;
using System.Xml.Linq;
using Redline.Calibration.Binary;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Definitions.Xdf;

public sealed class XdfParser
{
    private const int KnownTypeFlagMask = 0xF;

    public async Task<XdfDefinitionDocument> ParseAsync(string path, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        var fullPath = Path.GetFullPath(path);
        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken).ConfigureAwait(false);
        var fingerprint = new FileFingerprint(
            Path.GetFileName(fullPath),
            bytes.LongLength,
            Convert.ToHexString(SHA256.HashData(bytes)));

        using var memory = new MemoryStream(bytes, writable: false);
        using var reader = XmlReader.Create(memory, new XmlReaderSettings
        {
            Async = true,
            DtdProcessing = DtdProcessing.Prohibit,
            XmlResolver = null,
            MaxCharactersInDocument = 64L * 1024 * 1024,
            IgnoreComments = true
        });
        var xml = await XDocument.LoadAsync(reader, LoadOptions.SetLineInfo, cancellationToken).ConfigureAwait(false);
        return ParseDocument(xml, fingerprint);
    }

    private static XdfDefinitionDocument ParseDocument(XDocument xml, FileFingerprint fingerprint)
    {
        var root = xml.Root ?? throw new InvalidDataException("The XDF document has no root element.");
        if (!string.Equals(root.Name.LocalName, "XDFFORMAT", StringComparison.Ordinal))
        {
            throw new InvalidDataException("The XDF root element must be XDFFORMAT.");
        }

        var diagnostics = new List<ValidationDiagnostic>();
        var headerElement = Child(root, "XDFHEADER")
            ?? throw new InvalidDataException("The XDF document has no XDFHEADER element.");
        var header = ParseHeader(headerElement);
        header = header with { CategoryReferenceMode = DetectCategoryReferenceMode(root, header.Categories) };
        var parsedTables = root.Elements().Where(element => element.Name.LocalName == "XDFTABLE")
            .Select((element, index) => ParseTable(element, index, header, diagnostics))
            .ToArray();
        var tables = XdfDefinitionIntelligence.Classify(parsedTables);
        var constants = root.Elements().Where(element => element.Name.LocalName == "XDFCONSTANT")
            .Select((element, index) => ParseConstant(element, index, header, diagnostics))
            .ToArray();
        var flags = root.Elements().Where(element => element.Name.LocalName == "XDFFLAG")
            .Select((element, index) => ParseFlag(element, index, header, diagnostics))
            .ToArray();

        var coverage = new XdfCoverage(
            tables.Count,
            root.Elements().Count(element => element.Name.LocalName == "XDFCONSTANT"),
            root.Elements().Count(element => element.Name.LocalName == "XDFFLAG"),
            root.Elements().Count(element => element.Name.LocalName == "XDFPATCH"));

        if (coverage.PatchCount > 0)
        {
            diagnostics.Add(new ValidationDiagnostic(
                "XDF-COVERAGE-001",
                DiagnosticSeverity.Information,
                $"This build indexes {coverage.TableCount} tables, {coverage.ConstantCount} constants, and {coverage.FlagCount} flags. {coverage.PatchCount} patches are present but are not editable."));
        }

        return new XdfDefinitionDocument(
            Attribute(root, "version") ?? "unknown",
            fingerprint,
            header,
            tables,
            constants,
            flags,
            coverage,
            diagnostics);
    }

    private static XdfHeader ParseHeader(XElement header)
    {
        var defaultsElement = Child(header, "DEFAULTS");
        var defaults = new XdfDefaults(
            ParseInt(Attribute(defaultsElement, "datasizeinbits"), 16),
            ParseInt(Attribute(defaultsElement, "signed"), 0) != 0,
            ParseInt(Attribute(defaultsElement, "lsbfirst"), 1) != 0,
            ParseInt(Attribute(defaultsElement, "float"), 0) != 0);

        var baseOffsetElement = Child(header, "BASEOFFSET");
        var baseOffset = ParseLong(Attribute(baseOffsetElement, "offset"), 0);
        var subtract = ParseInt(Attribute(baseOffsetElement, "subtract"), 0) != 0;
        var regionElement = Child(header, "REGION");
        XdfRegion? region = null;
        if (regionElement is not null)
        {
            region = new XdfRegion(
                ParseLong(Attribute(regionElement, "startaddress"), 0),
                ParseLong(Attribute(regionElement, "size"), 0),
                Attribute(regionElement, "name") ?? "Binary File");
        }

        var categories = header.Elements()
            .Where(element => element.Name.LocalName == "CATEGORY")
            .Select(element =>
            {
                var sourceIndex = checked((int)ParseLong(Attribute(element, "index"), 0));
                return new XdfCategoryDefinition(
                    sourceIndex,
                    checked(sourceIndex + 1),
                    Attribute(element, "name")?.Trim() ?? string.Empty);
            })
            .GroupBy(category => category.MemberId)
            .Select(group => group.Last())
            .OrderBy(category => category.SourceIndex)
            .ToArray();

        return new XdfHeader(baseOffset, subtract, defaults, region, categories, XdfCategoryReferenceMode.OneBasedMemberId);
    }

    private static XdfTableDefinition ParseTable(
        XElement table,
        int index,
        XdfHeader header,
        ICollection<ValidationDiagnostic> diagnostics)
    {
        var uniqueId = Attribute(table, "uniqueid");
        var id = $"table-{index:D5}-{uniqueId ?? "none"}";
        var flags = ParseNullableInt(Attribute(table, "flags"));
        var title = Value(table, "title")?.Trim();
        if (string.IsNullOrWhiteSpace(title)) title = $"Untitled table {index + 1}";

        var axes = table.Elements()
            .Where(element => element.Name.LocalName == "XDFAXIS")
            .Select(element => ParseAxis(element, header))
            .ToDictionary(axis => axis.Id, StringComparer.OrdinalIgnoreCase);
        var xAxis = axes.GetValueOrDefault("x") ?? CreateVirtualAxis("x", 1, header.Defaults);
        var yAxis = axes.GetValueOrDefault("y") ?? CreateVirtualAxis("y", 1, header.Defaults);
        var zAxis = axes.GetValueOrDefault("z") ?? CreateVirtualAxis("z", 1, header.Defaults);
        var rowCount = zAxis.RowCount ?? yAxis.Count;
        var columnCount = zAxis.ColumnCount ?? xAxis.Count;
        rowCount = Math.Max(1, rowCount);
        columnCount = Math.Max(1, columnCount);

        var limitations = new List<string>();
        if (!zAxis.Address.HasValue) limitations.Add("Z-axis data has no binary address.");
        if (zAxis.Transform is null) limitations.Add("Z-axis conversion equation is not an invertible affine expression.");
        if (zAxis.UnknownTypeFlags != 0) limitations.Add($"Unknown XDF type flags 0x{zAxis.UnknownTypeFlags:X} are set.");
        if (zAxis.MajorStrideBits != 0 || zAxis.MinorStrideBits != 0) limitations.Add("Non-contiguous XDF stride modes are not enabled for writing yet.");
        if (zAxis.ElementSizeBits is not (8 or 16 or 32 or 64)) limitations.Add($"Unsupported {zAxis.ElementSizeBits}-bit element width.");

        var extentValid = ValidateExtent(zAxis, rowCount, columnCount, header.Region);
        if (!extentValid) limitations.Add("The table extent is outside the XDF binary region.");
        var canRead = zAxis.Address.HasValue
            && zAxis.ElementSizeBits is 8 or 16 or 32 or 64
            && zAxis.MajorStrideBits == 0
            && zAxis.MinorStrideBits == 0
            && extentValid;
        var canWrite = canRead && zAxis.Transform is not null && zAxis.UnknownTypeFlags == 0;

        if (!canRead)
        {
            diagnostics.Add(new ValidationDiagnostic(
                "XDF-TABLE-READ-001",
                DiagnosticSeverity.Warning,
                $"'{title}' cannot be read by the current table engine: {string.Join(" ", limitations)}",
                id));
        }

        var categoryIds = ParseCategoryIds(table);
        var categoryNames = ResolveCategoryNames(categoryIds, header);

        return new XdfTableDefinition(
            id,
            index,
            uniqueId,
            flags,
            title,
            Value(table, "description")?.Trim(),
            categoryIds,
            categoryNames,
            xAxis,
            yAxis,
            zAxis,
            rowCount,
            columnCount,
            canRead,
            canWrite,
            limitations,
            XdfDefinitionIntelligence.UnclassifiedIdentity(title));
    }

    private static XdfFlagDefinition ParseFlag(XElement flag, int index, XdfHeader header, ICollection<ValidationDiagnostic> diagnostics)
    {
        var uniqueId = Attribute(flag, "uniqueid");
        var id = $"flag-{index:D5}-{uniqueId ?? "none"}";
        var title = Value(flag, "title")?.Trim();
        if (string.IsNullOrWhiteSpace(title)) title = $"Untitled flag {index + 1}";
        var description = Value(flag, "description")?.Trim();
        var embedded = Child(flag, "EMBEDDEDDATA");
        var rawAddress = Attribute(embedded, "mmedaddress");
        long? address = rawAddress is null ? null : TranslateAddress(ParseLong(rawAddress, 0), header);
        var typeFlagsText = Attribute(embedded, "mmedtypeflags");
        int? typeFlags = typeFlagsText is null ? null : checked((int)ParseLong(typeFlagsText, 0));
        var rawFlags = typeFlags ?? 0;
        var signed = typeFlags.HasValue ? (rawFlags & 0x1) != 0 : header.Defaults.Signed;
        var littleEndian = typeFlags.HasValue ? (rawFlags & 0x2) != 0 : header.Defaults.LsbFirst;
        var floatingPoint = typeFlags.HasValue ? (rawFlags & 0x8) != 0 : header.Defaults.FloatingPoint;
        var elementSizeBits = ParseInt(Attribute(embedded, "mmedelementsizebits"), header.Defaults.DataSizeBits);
        var encoding = new BinaryEncoding(
            floatingPoint ? BinaryValueKind.Ieee754Float : signed ? BinaryValueKind.SignedInteger : BinaryValueKind.UnsignedInteger,
            elementSizeBits,
            littleEndian ? BinaryByteOrder.LittleEndian : BinaryByteOrder.BigEndian);
        var categoryIds = ParseCategoryIds(flag);
        var categoryNames = ResolveCategoryNames(categoryIds, header);
        var system = XdfDefinitionIntelligence.ClassifySystem(title, description, categoryNames, out _, out _);
        var mask = ParseUnsignedLong(Value(flag, "mask"), 0);
        var limitations = new List<string>();
        if (!address.HasValue) limitations.Add("Flag data has no binary address.");
        if (mask == 0) limitations.Add("Flag mask is zero.");
        if (elementSizeBits is not (8 or 16 or 32 or 64)) limitations.Add($"Unsupported {elementSizeBits}-bit element width.");
        if (floatingPoint) limitations.Add("Flags cannot use floating-point storage.");
        if ((rawFlags & ~KnownTypeFlagMask) != 0) limitations.Add($"Unknown XDF type flags 0x{rawFlags & ~KnownTypeFlagMask:X} are set.");
        var maxMask = elementSizeBits == 64 ? ulong.MaxValue : (1UL << elementSizeBits) - 1;
        if ((mask & ~maxMask) != 0) limitations.Add("Flag mask exceeds its storage width.");
        var canRead = limitations.Count == 0;
        var canWrite = canRead;
        if (!canRead)
        {
            diagnostics.Add(new ValidationDiagnostic("XDF-FLAG-READ-001", DiagnosticSeverity.Warning,
                $"'{title}' cannot be safely edited: {string.Join(" ", limitations)}", id));
        }
        var searchText = string.Join(' ', new[]
        {
            title,
            description,
            string.Join(' ', categoryNames),
            system.ToString(),
            address.HasValue ? $"0x{address.Value:X}" : null
        }.Where(value => !string.IsNullOrWhiteSpace(value)));

        return new XdfFlagDefinition(
            id,
            index,
            uniqueId,
            ParseNullableInt(Attribute(flag, "flags")),
            title,
            description,
            categoryIds,
            categoryNames,
            address,
            encoding,
            mask,
            canRead,
            canWrite,
            limitations,
            system,
            searchText);
    }

    private static XdfConstantDefinition ParseConstant(XElement constant, int index, XdfHeader header, ICollection<ValidationDiagnostic> diagnostics)
    {
        var uniqueId = Attribute(constant, "uniqueid");
        var id = $"constant-{index:D5}-{uniqueId ?? "none"}";
        var title = Value(constant, "title")?.Trim();
        if (string.IsNullOrWhiteSpace(title)) title = $"Untitled constant {index + 1}";
        var description = Value(constant, "description")?.Trim();
        var embedded = Child(constant, "EMBEDDEDDATA");
        var rawAddress = Attribute(embedded, "mmedaddress");
        long? address = rawAddress is null ? null : TranslateAddress(ParseLong(rawAddress, 0), header);
        var rawFlags = checked((int)ParseLong(Attribute(embedded, "mmedtypeflags"), 0));
        var elementSizeBits = ParseInt(Attribute(embedded, "mmedelementsizebits"), header.Defaults.DataSizeBits);
        var encoding = new BinaryEncoding(
            (rawFlags & 0x8) != 0 ? BinaryValueKind.Ieee754Float : (rawFlags & 0x1) != 0 ? BinaryValueKind.SignedInteger : BinaryValueKind.UnsignedInteger,
            elementSizeBits,
            (rawFlags & 0x2) != 0 ? BinaryByteOrder.LittleEndian : BinaryByteOrder.BigEndian);
        var equation = Attribute(Child(constant, "MATH"), "equation") ?? "X";
        AffineTransform? transform = AffineTransform.TryParse(equation, out var parsed, out _) ? parsed : null;
        var limitations = new List<string>();
        if (!address.HasValue) limitations.Add("Constant data has no binary address.");
        if (elementSizeBits is not (8 or 16 or 32 or 64)) limitations.Add($"Unsupported {elementSizeBits}-bit element width.");
        if (transform is null) limitations.Add("Constant conversion equation is not an invertible affine expression.");
        if ((rawFlags & ~KnownTypeFlagMask) != 0) limitations.Add($"Unknown XDF type flags 0x{rawFlags & ~KnownTypeFlagMask:X} are set.");
        var canRead = limitations.All(item => !item.Contains("conversion equation", StringComparison.Ordinal));
        var canWrite = limitations.Count == 0;
        if (!canRead)
        {
            diagnostics.Add(new ValidationDiagnostic("XDF-CONSTANT-READ-001", DiagnosticSeverity.Warning,
                $"'{title}' cannot be safely read: {string.Join(" ", limitations)}", id));
        }
        var categoryIds = ParseCategoryIds(constant);
        var categoryNames = ResolveCategoryNames(categoryIds, header);
        var system = XdfDefinitionIntelligence.ClassifySystem(title, description, categoryNames, out _, out _);
        var searchText = string.Join(' ', new[] { title, description, string.Join(' ', categoryNames), system.ToString(), address.HasValue ? $"0x{address.Value:X}" : null }.Where(value => !string.IsNullOrWhiteSpace(value)));
        return new XdfConstantDefinition(id, index, uniqueId, ParseNullableInt(Attribute(constant, "flags")), title, description,
            categoryIds, categoryNames, address, encoding, Value(constant, "units")?.Trim(), Math.Clamp(ParseInt(Value(constant, "decimalpl"), 0), 0, 15),
            equation, transform, canRead, canWrite, limitations, system, searchText);
    }

    private static XdfAxisDefinition ParseAxis(XElement axis, XdfHeader header)
    {
        var id = Attribute(axis, "id") ?? "unknown";
        var embedded = Child(axis, "EMBEDDEDDATA");
        var rawAddress = Attribute(embedded, "mmedaddress");
        long? address = rawAddress is null ? null : TranslateAddress(ParseLong(rawAddress, 0), header);
        var typeFlagsText = Attribute(embedded, "mmedtypeflags");
        int? typeFlags = typeFlagsText is null ? null : checked((int)ParseLong(typeFlagsText, 0));
        var flags = typeFlags ?? 0;
        var signed = typeFlags.HasValue ? (flags & 0x1) != 0 : header.Defaults.Signed;
        var littleEndian = typeFlags.HasValue ? (flags & 0x2) != 0 : header.Defaults.LsbFirst;
        var floatingPoint = typeFlags.HasValue ? (flags & 0x8) != 0 : header.Defaults.FloatingPoint;
        var columnMajor = typeFlags.HasValue && (flags & 0x4) != 0;
        var elementSizeBits = ParseInt(Attribute(embedded, "mmedelementsizebits"), header.Defaults.DataSizeBits);
        var encoding = new BinaryEncoding(
            floatingPoint ? BinaryValueKind.Ieee754Float : signed ? BinaryValueKind.SignedInteger : BinaryValueKind.UnsignedInteger,
            elementSizeBits,
            littleEndian ? BinaryByteOrder.LittleEndian : BinaryByteOrder.BigEndian);
        var equation = Attribute(Child(axis, "MATH"), "equation") ?? "X";
        AffineTransform? transform = AffineTransform.TryParse(equation, out var parsed, out _) ? parsed : null;
        var labels = axis.Elements()
            .Where(element => element.Name.LocalName == "LABEL")
            .OrderBy(element => ParseInt(Attribute(element, "index"), 0))
            .Select(element => ParseDouble(Attribute(element, "value")))
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .ToArray();
        var rowCount = ParseNullableInt(Attribute(embedded, "mmedrowcount"));
        var columnCount = ParseNullableInt(Attribute(embedded, "mmedcolcount"));
        var count = ParseNullableInt(Value(axis, "indexcount"))
            ?? (rowCount.HasValue && columnCount.HasValue ? checked(rowCount.Value * columnCount.Value) : (int?)null)
            ?? labels.Length;

        return new XdfAxisDefinition(
            id,
            address,
            elementSizeBits,
            Math.Max(1, count),
            rowCount,
            columnCount,
            ParseInt(Attribute(embedded, "mmedmajorstridebits"), 0),
            ParseInt(Attribute(embedded, "mmedminorstridebits"), 0),
            typeFlags,
            encoding,
            columnMajor,
            Value(axis, "units")?.Trim(),
            Math.Clamp(ParseInt(Value(axis, "decimalpl"), 0), 0, 15),
            equation,
            transform,
            labels,
            flags & ~KnownTypeFlagMask);
    }

    private static XdfAxisDefinition CreateVirtualAxis(string id, int count, XdfDefaults defaults) => new(
        id,
        null,
        defaults.DataSizeBits,
        count,
        null,
        null,
        0,
        0,
        null,
        new BinaryEncoding(
            defaults.FloatingPoint ? BinaryValueKind.Ieee754Float : defaults.Signed ? BinaryValueKind.SignedInteger : BinaryValueKind.UnsignedInteger,
            defaults.DataSizeBits,
            defaults.LsbFirst ? BinaryByteOrder.LittleEndian : BinaryByteOrder.BigEndian),
        false,
        null,
        0,
        "X",
        AffineTransform.Identity,
        Array.Empty<double>(),
        0);

    private static IReadOnlyList<int> ParseCategoryIds(XElement element) => element.Elements()
        .Where(child => child.Name.LocalName == "CATEGORYMEM")
        .Select(child => checked((int)ParseLong(Attribute(child, "category"), 0)))
        .Distinct()
        .ToArray();

    private static IReadOnlyList<string> ResolveCategoryNames(IReadOnlyList<int> memberIds, XdfHeader header)
    {
        var byMemberId = header.Categories.ToDictionary(category => category.MemberId);
        var bySourceIndex = header.Categories.ToDictionary(category => category.SourceIndex);
        return memberIds
            .Select(reference =>
            {
                var preferred = header.CategoryReferenceMode == XdfCategoryReferenceMode.OneBasedMemberId
                    ? byMemberId
                    : bySourceIndex;
                var fallback = header.CategoryReferenceMode == XdfCategoryReferenceMode.OneBasedMemberId
                    ? bySourceIndex
                    : byMemberId;
                return preferred.TryGetValue(reference, out var category) || fallback.TryGetValue(reference, out category)
                    ? category.Name
                    : $"Unknown category {reference}";
            })
            .ToArray();
    }

    private static XdfCategoryReferenceMode DetectCategoryReferenceMode(
        XElement root,
        IReadOnlyList<XdfCategoryDefinition> categories)
    {
        var references = root.Descendants()
            .Where(element => element.Name.LocalName == "CATEGORYMEM")
            .Select(element => checked((int)ParseLong(Attribute(element, "category"), 0)))
            .ToArray();
        var memberIds = categories.Select(category => category.MemberId).ToHashSet();
        var sourceIndexes = categories.Select(category => category.SourceIndex).ToHashSet();
        var oneBasedMatches = references.Count(memberIds.Contains);
        var directMatches = references.Count(sourceIndexes.Contains);
        return directMatches > oneBasedMatches
            ? XdfCategoryReferenceMode.DirectSourceIndex
            : XdfCategoryReferenceMode.OneBasedMemberId;
    }

    private static bool ValidateExtent(XdfAxisDefinition axis, int rows, int columns, XdfRegion? region)
    {
        if (!axis.Address.HasValue || axis.ElementSizeBits <= 0 || axis.ElementSizeBits % 8 != 0) return false;
        if (region is null || region.SizeBytes <= 0) return true;
        var byteCount = checked((long)rows * columns * (axis.ElementSizeBits / 8));
        var regionEnd = checked(region.StartAddress + region.SizeBytes);
        return axis.Address.Value >= region.StartAddress && axis.Address.Value <= regionEnd - byteCount;
    }

    private static long TranslateAddress(long address, XdfHeader header) =>
        header.SubtractBaseOffset ? checked(address - header.BaseOffset) : checked(address + header.BaseOffset);

    private static XElement? Child(XElement? parent, string name) =>
        parent?.Elements().FirstOrDefault(element => element.Name.LocalName == name);

    private static string? Value(XElement? parent, string name) => Child(parent, name)?.Value;

    private static string? Attribute(XElement? element, string name) => element?.Attribute(name)?.Value;

    private static int ParseInt(string? value, int fallback) =>
        value is null ? fallback : checked((int)ParseLong(value, fallback));

    private static int? ParseNullableInt(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : checked((int)ParseLong(value, 0));

    private static long ParseLong(string? value, long fallback)
    {
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        var trimmed = value.Trim();
        if (trimmed.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
        {
            return long.Parse(trimmed[2..], NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        }

        return long.Parse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture);
    }

    private static ulong ParseUnsignedLong(string? value, ulong fallback)
    {
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        var trimmed = value.Trim();
        return trimmed.StartsWith("0x", StringComparison.OrdinalIgnoreCase)
            ? ulong.Parse(trimmed[2..], NumberStyles.HexNumber, CultureInfo.InvariantCulture)
            : ulong.Parse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture);
    }

    private static double? ParseDouble(string? value) =>
        double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) ? parsed : null;
}
