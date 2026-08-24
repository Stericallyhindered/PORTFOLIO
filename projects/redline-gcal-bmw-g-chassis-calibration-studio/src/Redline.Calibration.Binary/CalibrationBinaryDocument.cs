using System.Security.Cryptography;
using System.Text.Json;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Binary;

public sealed class CalibrationBinaryDocument
{
    private readonly byte[] _original;
    private readonly byte[] _current;
    private readonly Stack<BinaryEdit> _undo = new();
    private readonly Stack<BinaryEdit> _redo = new();

    private CalibrationBinaryDocument(string sourcePath, byte[] bytes, FileFingerprint fingerprint)
    {
        SourcePath = sourcePath;
        _original = bytes;
        _current = bytes.ToArray();
        SourceFingerprint = fingerprint;
    }

    public string SourcePath { get; }

    public FileFingerprint SourceFingerprint { get; }

    public int Length => _current.Length;

    public bool IsModified => GetChangedRanges().Count > 0;

    public bool CanUndo => _undo.Count > 0;

    public bool CanRedo => _redo.Count > 0;

    public static async Task<CalibrationBinaryDocument> OpenAsync(string path, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        var fullPath = Path.GetFullPath(path);
        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken).ConfigureAwait(false);
        var hash = Convert.ToHexString(SHA256.HashData(bytes));
        var fingerprint = new FileFingerprint(Path.GetFileName(fullPath), bytes.LongLength, hash);
        return new CalibrationBinaryDocument(fullPath, bytes, fingerprint);
    }

    public byte[] ReadBytes(int offset, int count)
    {
        ValidateRange(offset, count);
        return _current.AsSpan(offset, count).ToArray();
    }

    public double ReadValue(int offset, BinaryEncoding encoding)
    {
        ArgumentNullException.ThrowIfNull(encoding);
        ValidateRange(offset, encoding.SizeBytes);
        return PrimitiveCodec.Read(_current.AsSpan(offset, encoding.SizeBytes), encoding);
    }

    public bool ApplyBytes(int offset, ReadOnlySpan<byte> replacement, string reason)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);
        ValidateRange(offset, replacement.Length);
        var before = _current.AsSpan(offset, replacement.Length).ToArray();
        if (before.AsSpan().SequenceEqual(replacement))
        {
            return false;
        }

        var after = replacement.ToArray();
        after.CopyTo(_current.AsSpan(offset));
        _undo.Push(new BinaryEdit(offset, before, after, reason, DateTimeOffset.UtcNow));
        _redo.Clear();
        return true;
    }

    public bool ApplyValue(int offset, double value, BinaryEncoding encoding, string reason) =>
        ApplyBytes(offset, PrimitiveCodec.Encode(value, encoding), reason);

    public bool Undo()
    {
        if (!_undo.TryPop(out var edit))
        {
            return false;
        }

        edit.Before.CopyTo(_current.AsSpan(edit.Offset));
        _redo.Push(edit);
        return true;
    }

    public bool Redo()
    {
        if (!_redo.TryPop(out var edit))
        {
            return false;
        }

        edit.After.CopyTo(_current.AsSpan(edit.Offset));
        _undo.Push(edit);
        return true;
    }

    public IReadOnlyList<ChangedByteRange> GetChangedRanges()
    {
        var ranges = new List<ChangedByteRange>();
        var rangeStart = -1;

        for (var index = 0; index < _current.Length; index++)
        {
            var changed = _current[index] != _original[index];
            if (changed && rangeStart < 0)
            {
                rangeStart = index;
            }
            else if (!changed && rangeStart >= 0)
            {
                ranges.Add(new ChangedByteRange(rangeStart, index - rangeStart));
                rangeStart = -1;
            }
        }

        if (rangeStart >= 0)
        {
            ranges.Add(new ChangedByteRange(rangeStart, _current.Length - rangeStart));
        }

        return ranges;
    }

    public async Task<BinaryExportResult> ExportNewAsync(
        string destinationPath,
        string? definitionSha256 = null,
        BinaryExportApproval? approval = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationPath);
        var destination = Path.GetFullPath(destinationPath);
        if (string.Equals(destination, SourcePath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("The immutable source binary cannot be overwritten.");
        }

        if (File.Exists(destination))
        {
            throw new IOException($"The export target already exists: {destination}");
        }

        var directory = Path.GetDirectoryName(destination)
            ?? throw new InvalidOperationException("The export target has no parent directory.");
        Directory.CreateDirectory(directory);

        var temporaryPath = Path.Combine(directory, $".{Path.GetFileName(destination)}.{Guid.NewGuid():N}.tmp");
        try
        {
            var exportBytes = _current.ToArray();
            approval ??= BinaryExportApproval.Draft();
            var checksum = approval.ChecksumProvider?.ValidateAndUpdate(exportBytes, SourceFingerprint)
                ?? new ChecksumValidation("not-configured", false, "No ROM-specific checksum provider was selected. This export is draft-only and is not approved for flashing.");
            if (checksum.FlashReady && !approval.DefinitionCompatible)
            {
                throw new InvalidOperationException("A flash-ready checksum result requires a verified XDF-to-BIN compatibility approval.");
            }
            await using (var stream = new FileStream(
                temporaryPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                1024 * 1024,
                FileOptions.Asynchronous | FileOptions.WriteThrough))
            {
                await stream.WriteAsync(exportBytes, cancellationToken).ConfigureAwait(false);
                await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
                stream.Flush(flushToDisk: true);
            }

            var written = await File.ReadAllBytesAsync(temporaryPath, cancellationToken).ConfigureAwait(false);
            if (!written.AsSpan().SequenceEqual(exportBytes))
            {
                throw new IOException("Export readback did not match the in-memory calibration.");
            }

            var outputHash = Convert.ToHexString(SHA256.HashData(written));
            File.Move(temporaryPath, destination);

            var manifest = new BinaryExportManifest(
                1,
                DateTimeOffset.UtcNow,
                SourceFingerprint,
                new FileFingerprint(Path.GetFileName(destination), written.LongLength, outputHash),
                definitionSha256,
                approval.CompatibilityEvidence,
                checksum,
                GetChangedRanges(exportBytes));
            var manifestPath = destination + ".manifest.json";
            await WriteManifestNewAsync(manifestPath, manifest, cancellationToken).ConfigureAwait(false);
            return new BinaryExportResult(destination, manifestPath, outputHash, manifest.Checksum, manifest.ChangedRanges);
        }
        finally
        {
            if (File.Exists(temporaryPath))
            {
                File.Delete(temporaryPath);
            }
        }
    }

    private static async Task WriteManifestNewAsync(
        string path,
        BinaryExportManifest manifest,
        CancellationToken cancellationToken)
    {
        await using var stream = new FileStream(
            path,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            16 * 1024,
            FileOptions.Asynchronous | FileOptions.WriteThrough);
        await JsonSerializer.SerializeAsync(stream, manifest, new JsonSerializerOptions { WriteIndented = true }, cancellationToken)
            .ConfigureAwait(false);
        await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
        stream.Flush(flushToDisk: true);
    }

    private void ValidateRange(int offset, int count)
    {
        if (offset < 0 || count < 0 || offset > _current.Length - count)
        {
            throw new ArgumentOutOfRangeException(nameof(offset), $"Range [{offset}, {offset + (long)count}) exceeds binary length {_current.Length}.");
        }
    }

    private IReadOnlyList<ChangedByteRange> GetChangedRanges(ReadOnlySpan<byte> output)
    {
        var ranges = new List<ChangedByteRange>();
        var rangeStart = -1;
        for (var index = 0; index < output.Length; index++)
        {
            var changed = output[index] != _original[index];
            if (changed && rangeStart < 0) rangeStart = index;
            else if (!changed && rangeStart >= 0)
            {
                ranges.Add(new ChangedByteRange(rangeStart, index - rangeStart));
                rangeStart = -1;
            }
        }
        if (rangeStart >= 0) ranges.Add(new ChangedByteRange(rangeStart, output.Length - rangeStart));
        return ranges;
    }

    private sealed record BinaryEdit(
        int Offset,
        byte[] Before,
        byte[] After,
        string Reason,
        DateTimeOffset TimestampUtc);
}

public sealed record ChangedByteRange(int Offset, int Length);

public sealed record BinaryExportManifest(
    int SchemaVersion,
    DateTimeOffset CreatedUtc,
    FileFingerprint Source,
    FileFingerprint Output,
    string? DefinitionSha256,
    string CompatibilityEvidence,
    ChecksumValidation Checksum,
    IReadOnlyList<ChangedByteRange> ChangedRanges);

public sealed record ChecksumValidation(string Status, bool FlashReady, string Message);

public sealed record BinaryExportResult(
    string BinaryPath,
    string ManifestPath,
    string Sha256,
    ChecksumValidation Checksum,
    IReadOnlyList<ChangedByteRange> ChangedRanges);
