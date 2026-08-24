using Redline.Calibration.Binary;
using Redline.Calibration.Definitions.Xdf;
using System.Text.Json;

namespace Redline.Calibration.Tests;

public sealed class XdfParserTests
{
    [Fact]
    public async Task Parses_type_flags_dimensions_and_scaled_table_values()
    {
        using var temporary = new TemporaryDirectory();
        var xdfPath = temporary.PathFor("fixture.xdf");
        var binPath = temporary.PathFor("fixture.bin");
        await File.WriteAllTextAsync(xdfPath, """
            <?xml version="1.0" encoding="utf-8"?>
            <XDFFORMAT version="1.70">
              <XDFHEADER>
                <BASEOFFSET offset="0" subtract="0" />
                <DEFAULTS datasizeinbits="16" signed="0" lsbfirst="1" float="0" />
                <REGION startaddress="0x0" size="0x20" name="Binary" />
                <CATEGORY index="0x0" name="Fuel" />
              </XDFHEADER>
              <XDFTABLE uniqueid="0x42">
                <title>Fuel target</title>
                <CATEGORYMEM category="1" />
                <XDFAXIS id="x"><indexcount>2</indexcount><LABEL index="0" value="1000" /><LABEL index="1" value="2000" /></XDFAXIS>
                <XDFAXIS id="y"><indexcount>2</indexcount><LABEL index="0" value="10" /><LABEL index="1" value="20" /></XDFAXIS>
                <XDFAXIS id="z">
                  <EMBEDDEDDATA mmedtypeflags="0x3" mmedaddress="0x4" mmedelementsizebits="16" mmedrowcount="2" mmedcolcount="2" />
                  <units>lambda</units><decimalpl>2</decimalpl><MATH equation="X*0.01"><VAR id="X" /></MATH>
                </XDFAXIS>
              </XDFTABLE>
            </XDFFORMAT>
            """);
        await File.WriteAllBytesAsync(binPath, new byte[] { 0, 0, 0, 0, 100, 0, 200, 0, 44, 1, 144, 1 });

        var definition = await new XdfParser().ParseAsync(xdfPath);
        var table = Assert.Single(definition.Tables);
        var binary = await CalibrationBinaryDocument.OpenAsync(binPath);
        var data = new XdfTableAccessor().Read(binary, table);

        Assert.True(table.CanWrite);
        Assert.Equal(BinaryByteOrder.LittleEndian, table.ZAxis.Encoding.ByteOrder);
        Assert.Equal(BinaryValueKind.SignedInteger, table.ZAxis.Encoding.ValueKind);
        Assert.Equal(2, table.RowCount);
        Assert.Equal(2, table.ColumnCount);
        Assert.Equal(new[] { "Fuel" }, table.CategoryNames);
        Assert.Equal(XdfCalibrationSystem.Fueling, table.Identity.System);
        Assert.Equal(XdfTableShape.Map, table.Identity.Shape);
        Assert.Equal(1, data.EngineeringValues[0, 0], 8);
        Assert.Equal(4, data.EngineeringValues[1, 1], 8);
    }

    [Fact]
    public async Task Write_cell_round_trips_through_equation_and_binary_encoding()
    {
        using var temporary = new TemporaryDirectory();
        var xdfPath = temporary.PathFor("fixture.xdf");
        var binPath = temporary.PathFor("fixture.bin");
        await File.WriteAllTextAsync(xdfPath, """
            <XDFFORMAT version="1.70"><XDFHEADER><BASEOFFSET offset="0" subtract="0" />
            <DEFAULTS datasizeinbits="16" signed="0" lsbfirst="1" float="0" /><REGION startaddress="0" size="8" name="Binary" />
            </XDFHEADER><XDFTABLE><title>Target</title><XDFAXIS id="z"><EMBEDDEDDATA mmedtypeflags="0x2" mmedaddress="0" mmedelementsizebits="16" mmedrowcount="1" mmedcolcount="1" />
            <MATH equation="X*0.1" /></XDFAXIS></XDFTABLE></XDFFORMAT>
            """);
        await File.WriteAllBytesAsync(binPath, new byte[8]);
        var table = Assert.Single((await new XdfParser().ParseAsync(xdfPath)).Tables);
        var binary = await CalibrationBinaryDocument.OpenAsync(binPath);
        var accessor = new XdfTableAccessor();

        accessor.WriteCell(binary, table, 0, 0, 12.3);

        Assert.Equal(new byte[] { 123, 0 }, binary.ReadBytes(0, 2));
        Assert.Equal(12.3, accessor.Read(binary, table).EngineeringValues[0, 0], 8);
    }

    [Fact]
    public async Task Constants_and_flags_are_verified_and_edit_only_their_declared_storage()
    {
        using var temporary = new TemporaryDirectory();
        var xdfPath = temporary.PathFor("scalar.xdf");
        var binPath = temporary.PathFor("scalar.bin");
        await File.WriteAllTextAsync(xdfPath, """
            <XDFFORMAT version="1.70"><XDFHEADER><BASEOFFSET offset="0" subtract="0" />
            <DEFAULTS datasizeinbits="8" signed="0" lsbfirst="1" float="0" /><REGION startaddress="0" size="8" name="Binary" /></XDFHEADER>
            <XDFCONSTANT><title>Load limit</title><EMBEDDEDDATA mmedtypeflags="0x2" mmedaddress="0" mmedelementsizebits="16" /><units>load</units><MATH equation="X*0.1" /></XDFCONSTANT>
            <XDFFLAG><title>Overrun enabled</title><EMBEDDEDDATA mmedtypeflags="0x0" mmedaddress="2" mmedelementsizebits="8" /><mask>0x04</mask></XDFFLAG>
            </XDFFORMAT>
            """);
        await File.WriteAllBytesAsync(binPath, new byte[] { 100, 0, 0xA3, 0, 0, 0, 0, 0 });
        var definition = await new XdfParser().ParseAsync(xdfPath);
        var binary = await CalibrationBinaryDocument.OpenAsync(binPath);
        var scalars = new XdfScalarAccessor();

        var constant = Assert.Single(definition.Constants);
        var flag = Assert.Single(definition.Flags);
        Assert.Equal(10, scalars.ReadConstant(binary, constant));
        Assert.False(scalars.ReadFlag(binary, flag));
        scalars.WriteConstant(binary, constant, 12.3);
        scalars.WriteFlag(binary, flag, true);

        Assert.Equal(new byte[] { 123, 0, 0xA7 }, binary.ReadBytes(0, 3));
        Assert.True(scalars.ReadFlag(binary, flag));
        var report = new XdfBinaryVerifier().Verify(definition, binary);
        Assert.True(report.IsCompatible);
        Assert.Equal(2, report.WritableRanges.Count);
    }

    [Fact]
    public async Task Verification_rejects_out_of_bounds_definitions_and_reports_overlaps()
    {
        using var temporary = new TemporaryDirectory();
        var xdfPath = temporary.PathFor("invalid.xdf");
        var binPath = temporary.PathFor("invalid.bin");
        await File.WriteAllTextAsync(xdfPath, """
            <XDFFORMAT version="1.70"><XDFHEADER><BASEOFFSET offset="0" subtract="0" /><DEFAULTS datasizeinbits="8" signed="0" lsbfirst="1" float="0" /><REGION startaddress="0" size="4" name="Binary" /></XDFHEADER>
            <XDFTABLE><title>First</title><XDFAXIS id="z"><EMBEDDEDDATA mmedaddress="0" mmedelementsizebits="8" mmedrowcount="1" mmedcolcount="2" /><MATH equation="X" /></XDFAXIS></XDFTABLE>
            <XDFTABLE><title>Second</title><XDFAXIS id="z"><EMBEDDEDDATA mmedaddress="1" mmedelementsizebits="8" mmedrowcount="1" mmedcolcount="2" /><MATH equation="X" /></XDFAXIS></XDFTABLE>
            <XDFCONSTANT><title>Outside</title><EMBEDDEDDATA mmedaddress="4" mmedelementsizebits="8" /><MATH equation="X" /></XDFCONSTANT>
            </XDFFORMAT>
            """);
        await File.WriteAllBytesAsync(binPath, new byte[4]);
        var report = new XdfBinaryVerifier().Verify(await new XdfParser().ParseAsync(xdfPath), await CalibrationBinaryDocument.OpenAsync(binPath));

        Assert.False(report.IsCompatible);
        Assert.Contains(report.Findings, finding => finding.Code == "XDF-BIN-BOUNDS-001");
        Assert.Contains(report.Findings, finding => finding.Code == "XDF-BIN-OVERLAP-001");
    }

    [Fact]
    public async Task Detects_direct_category_references_and_does_not_assume_a_fixed_table_count()
    {
        using var temporary = new TemporaryDirectory();
        var xdfPath = temporary.PathFor("variant.xdf");
        await File.WriteAllTextAsync(xdfPath, """
            <XDFFORMAT version="1.70"><XDFHEADER><BASEOFFSET offset="0" subtract="0" />
            <DEFAULTS datasizeinbits="8" signed="0" lsbfirst="1" float="0" />
            <CATEGORY index="0x7" name="Variant category" /></XDFHEADER>
            <XDFTABLE><title>First item</title><CATEGORYMEM category="7" /><XDFAXIS id="z"><EMBEDDEDDATA mmedaddress="0" mmedelementsizebits="8" mmedrowcount="1" mmedcolcount="1" /><MATH equation="X" /></XDFAXIS></XDFTABLE>
            <XDFTABLE><title>Second item</title><CATEGORYMEM category="7" /><XDFAXIS id="z"><EMBEDDEDDATA mmedaddress="1" mmedelementsizebits="8" mmedrowcount="1" mmedcolcount="1" /><MATH equation="X" /></XDFAXIS></XDFTABLE>
            </XDFFORMAT>
            """);

        var definition = await new XdfParser().ParseAsync(xdfPath);

        Assert.Equal(XdfCategoryReferenceMode.DirectSourceIndex, definition.Header.CategoryReferenceMode);
        Assert.Equal(2, definition.Tables.Count);
        Assert.All(definition.Tables, table => Assert.Equal(new[] { "Variant category" }, table.CategoryNames));
    }

    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Real_b58_gen2_definition_and_binary_are_readable_when_fixture_is_present()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        var xdfPath = Path.Combine(fixture, "00005D55504809.xdf");
        var binPath = Path.Combine(fixture, "00005D55504809_b58o1_original.bin");
        var definition = await new XdfParser().ParseAsync(xdfPath);
        var binary = await CalibrationBinaryDocument.OpenAsync(binPath);

        Assert.Equal("607A1BBA0D79C9A69FAAAE0AFC81108452A6D82852F806708CE5F0D59FD7EAC4", definition.Source.Sha256);
        Assert.Equal(8_388_608, definition.Header.Region?.SizeBytes);
        Assert.True(definition.Tables.Count > 500);
        var table = definition.Tables.First(item => item.CanRead);
        var data = new XdfTableAccessor().Read(binary, table);
        Assert.Equal(table.RowCount, data.EngineeringValues.GetLength(0));
        Assert.Equal(table.ColumnCount, data.EngineeringValues.GetLength(1));
        Assert.True(double.IsFinite(data.EngineeringValues[0, 0]));
    }

    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Real_b58_gen2_inventory_labels_every_definition_without_losing_axes_or_aliases()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        var definition = await new XdfParser().ParseAsync(Path.Combine(fixture, "00005D55504809.xdf"));

        Assert.Equal(1_351, definition.Tables.Count);
        Assert.Equal(3, definition.Flags.Count);
        Assert.Equal(453, definition.Tables.Count(table => table.Flags == 0x30));
        Assert.Equal(550, definition.Tables.Count(table => table.Flags == 0x0));
        Assert.Equal(345, definition.Tables.Count(table => table.Identity.SourceClass == "Generated axis definition"));
        Assert.Equal(676, definition.Tables.Count(table => table.Identity.Role == XdfTableRole.BreakpointAxis));
        Assert.Equal(2, definition.Tables.Count(table => table.Identity.Role == XdfTableRole.DuplicateAlias));
        Assert.DoesNotContain(definition.Tables, table => table.Identity.System == XdfCalibrationSystem.Uncategorized);
        Assert.DoesNotContain(definition.Tables.SelectMany(table => table.CategoryNames), name => name.StartsWith("Unknown category", StringComparison.Ordinal));

        var oilPressure = Assert.Single(definition.Tables.Where(table => table.Title == "Oil pressure target adder factor"));
        Assert.Equal(new[] { "Oil Pressure" }, oilPressure.CategoryNames);
        Assert.Equal("KF_POELSOLL_ADP_FAK", oilPressure.Identity.Symbol);
        Assert.Equal(XdfCalibrationSystem.OilPressure, oilPressure.Identity.System);

        var generatedAxes = definition.Tables.Where(table => table.Title.EndsWith("(autogen)", StringComparison.OrdinalIgnoreCase)).ToArray();
        Assert.All(generatedAxes, table =>
        {
            Assert.Equal(XdfTableRole.BreakpointAxis, table.Identity.Role);
            Assert.NotEmpty(table.Identity.ParentTableIds);
        });

        Assert.All(definition.Flags, flag =>
        {
            Assert.NotNull(flag.Address);
            Assert.NotEqual(0UL, flag.Mask);
            Assert.Contains("MHD Error Codes", flag.CategoryNames);
        });

        using var temporary = new TemporaryDirectory();
        var catalogPath = temporary.PathFor("definition.xdf-catalog.json");
        await new XdfCatalogExporter().ExportAsync(definition, catalogPath);
        await using var catalogStream = File.OpenRead(catalogPath);
        using var catalog = await JsonDocument.ParseAsync(catalogStream);
        Assert.Equal("gcal.xdf-catalog.v1", catalog.RootElement.GetProperty("schema_version").GetString());
        Assert.Equal(1_351, catalog.RootElement.GetProperty("summary").GetProperty("table_count").GetInt32());
        Assert.Equal(3, catalog.RootElement.GetProperty("summary").GetProperty("flag_count").GetInt32());
    }
}
