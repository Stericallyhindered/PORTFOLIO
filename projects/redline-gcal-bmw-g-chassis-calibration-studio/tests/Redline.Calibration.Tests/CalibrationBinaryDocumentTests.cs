using System.Text.Json;
using Redline.Calibration.Binary;

namespace Redline.Calibration.Tests;

public sealed class CalibrationBinaryDocumentTests
{
    [Fact]
    public async Task Edit_undo_redo_and_changed_ranges_are_exact()
    {
        using var temporary = new TemporaryDirectory();
        var source = temporary.PathFor("source.bin");
        await File.WriteAllBytesAsync(source, Enumerable.Range(0, 32).Select(value => (byte)value).ToArray());
        var document = await CalibrationBinaryDocument.OpenAsync(source);

        Assert.True(document.ApplyBytes(4, new byte[] { 90, 91 }, "test edit"));
        Assert.True(document.ApplyBytes(8, new byte[] { 92 }, "second test edit"));

        Assert.Equal(new[] { new ChangedByteRange(4, 2), new ChangedByteRange(8, 1) }, document.GetChangedRanges());
        Assert.True(document.Undo());
        Assert.Equal(new[] { new ChangedByteRange(4, 2) }, document.GetChangedRanges());
        Assert.True(document.Redo());
        Assert.Equal(92, document.ReadBytes(8, 1)[0]);
    }

    [Fact]
    public async Task No_op_edit_does_not_create_history()
    {
        using var temporary = new TemporaryDirectory();
        var source = temporary.PathFor("source.bin");
        await File.WriteAllBytesAsync(source, new byte[] { 1, 2, 3 });
        var document = await CalibrationBinaryDocument.OpenAsync(source);

        Assert.False(document.ApplyBytes(1, new byte[] { 2 }, "no change"));
        Assert.False(document.CanUndo);
        Assert.False(document.IsModified);
    }

    [Fact]
    public async Task Reads_and_writes_fail_when_range_is_outside_binary()
    {
        using var temporary = new TemporaryDirectory();
        var source = temporary.PathFor("source.bin");
        await File.WriteAllBytesAsync(source, new byte[8]);
        var document = await CalibrationBinaryDocument.OpenAsync(source);

        Assert.Throws<ArgumentOutOfRangeException>(() => document.ReadBytes(7, 2));
        Assert.Throws<ArgumentOutOfRangeException>(() => document.ApplyBytes(-1, new byte[] { 1 }, "invalid"));
    }

    [Fact]
    public async Task Export_is_read_back_and_manifested_without_overwriting_source()
    {
        using var temporary = new TemporaryDirectory();
        var source = temporary.PathFor("source.bin");
        var output = temporary.PathFor("revision-002.bin");
        await File.WriteAllBytesAsync(source, new byte[] { 1, 2, 3, 4 });
        var document = await CalibrationBinaryDocument.OpenAsync(source);
        document.ApplyBytes(2, new byte[] { 99 }, "verified edit");

        var result = await document.ExportNewAsync(output, "DEFINITIONHASH");

        Assert.Equal(new byte[] { 1, 2, 99, 4 }, await File.ReadAllBytesAsync(output));
        Assert.Equal(result.Sha256, Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(await File.ReadAllBytesAsync(output))));
        var manifest = JsonSerializer.Deserialize<BinaryExportManifest>(await File.ReadAllTextAsync(result.ManifestPath));
        Assert.NotNull(manifest);
        Assert.Equal("DEFINITIONHASH", manifest.DefinitionSha256);
        Assert.Contains("compatibility", manifest.CompatibilityEvidence, StringComparison.OrdinalIgnoreCase);
        Assert.False(manifest.Checksum.FlashReady);
        Assert.Equal("not-configured", manifest.Checksum.Status);
        Assert.Equal(new ChangedByteRange(2, 1), Assert.Single(manifest.ChangedRanges));
        Assert.Equal(new byte[] { 1, 2, 3, 4 }, await File.ReadAllBytesAsync(source));
        await Assert.ThrowsAsync<InvalidOperationException>(() => document.ExportNewAsync(source));
    }

    [Fact]
    public async Task Flash_ready_checksum_requires_explicit_compatibility_approval()
    {
        using var temporary = new TemporaryDirectory();
        var source = temporary.PathFor("source.bin");
        await File.WriteAllBytesAsync(source, new byte[] { 1, 2, 3, 4 });
        var document = await CalibrationBinaryDocument.OpenAsync(source);
        document.ApplyBytes(0, new byte[] { 9 }, "test");
        var approval = new BinaryExportApproval(false, "mismatched ROM", new ReadyChecksumProvider());

        await Assert.ThrowsAsync<InvalidOperationException>(() => document.ExportNewAsync(temporary.PathFor("blocked.bin"), approval: approval));
    }

    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Mg1_le_b58_gen2_stock_rom_validates_before_any_checksum_correction()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        var source = Path.Combine(fixture, "00005D55504809_b58o1_original.bin");
        var document = await CalibrationBinaryDocument.OpenAsync(source);
        var provider = new Mg1LeChecksumProvider();
        var image = document.ReadBytes(0, document.Length);

        var result = provider.ValidateAndUpdate(image, document.SourceFingerprint);

        Assert.True(result.FlashReady, result.Message);
        Assert.Equal("corrected-and-validated", result.Status);
    }

    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Mg1_le_b58_gen2_checksum_correction_repairs_an_edited_copy()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        var source = Path.Combine(fixture, "00005D55504809_b58o1_original.bin");
        var document = await CalibrationBinaryDocument.OpenAsync(source);
        var image = document.ReadBytes(0, document.Length);
        image[0x7189E8] ^= 0x01;

        var result = new Mg1LeChecksumProvider().ValidateAndUpdate(image, document.SourceFingerprint);

        Assert.True(result.FlashReady, result.Message);
    }

    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Mg1_le_b58_gen2_save_copy_as_writes_a_revalidated_binary()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        using var temporary = new TemporaryDirectory();
        var source = Path.Combine(fixture, "00005D55504809_b58o1_original.bin");
        var document = await CalibrationBinaryDocument.OpenAsync(source);
        document.ApplyBytes(0x7189E8, new byte[] { (byte)(document.ReadBytes(0x7189E8, 1)[0] ^ 0x01) }, "fixture calibration change");

        var result = await document.ExportNewAsync(
            temporary.PathFor("b58gen2_revised.bin"),
            "fixture-xdf",
            new BinaryExportApproval(true, "fixture XDF/BIN compatibility verified", new Mg1LeChecksumProvider()));

        Assert.True(result.Checksum.FlashReady, result.Checksum.Message);
        Assert.Equal("corrected-and-validated", result.Checksum.Status);
        Assert.True(File.Exists(result.BinaryPath));
        Assert.Contains(result.ChangedRanges, range => range.Offset == 0x7189E8);
        Assert.Contains(result.ChangedRanges, range => range.Offset == 0x7FFCF8);
    }

    private sealed class ReadyChecksumProvider : IBinaryChecksumProvider
    {
        public string ProviderId => "test";
        public ChecksumValidation ValidateAndUpdate(Span<byte> image, Redline.Calibration.Domain.FileFingerprint source) => new("verified", true, "test only");
    }
}
