using System.Buffers.Binary;
using Redline.Calibration.Domain;

namespace Redline.Calibration.Binary;

// MG1_LE B58TU1 record tables and checksum primitives reproduced from the local MHD managed implementation.
// This profile deliberately accepts only the stock ROM validated by the regression fixture below.
public sealed class Mg1LeChecksumProvider : IBinaryChecksumProvider
{
    public const string B58Gen2StockSha256 = "FE92CDB4E9051703376286BC0D47A89870F89E4724E5EB1DE34B18C9C2AAC87D";
    private static readonly int[] RecordTableOffsets = [0x28150, 0x80150, 0x700150];

    public string ProviderId => "mhd-mg1-le-b58gen2-00005D55504809";

    public ChecksumValidation ValidateAndUpdate(Span<byte> image, FileFingerprint source)
    {
        if (image.Length != 8 * 1024 * 1024)
            return new ChecksumValidation("unsupported", false, "MG1_LE B58 Gen 2 requires an 8 MiB calibration image.");
        if (!string.Equals(source.Sha256, B58Gen2StockSha256, StringComparison.OrdinalIgnoreCase))
            return new ChecksumValidation("unsupported-source", false, "This checksum profile is validated only for the 00005D55504809 stock source ROM.");

        var records = ReadRecords(image);
        if (records.Count == 0)
            return new ChecksumValidation("invalid-layout", false, "MG1_LE checksum record tables were not found in the expected layout.");

        foreach (var record in records)
            WriteStoredChecksum(image, record, Compute(image, record));

        var after = Validate(image, records);
        return after.InvalidCount == 0
            ? new ChecksumValidation("corrected-and-validated", true, $"Corrected and validated {records.Count} MG1_LE checksum records for 00005D55504809.")
            : new ChecksumValidation("correction-failed", false, $"Checksum correction did not validate {after.InvalidCount} MG1_LE records.");
    }

    internal static IReadOnlyList<Mg1LeChecksumRecord> ReadRecords(ReadOnlySpan<byte> image)
    {
        var records = new List<Mg1LeChecksumRecord>();
        foreach (var tableOffset in RecordTableOffsets)
        {
            var startAddress = BinaryPrimitives.ReadUInt32LittleEndian(image[tableOffset..]);
            var endAddress = BinaryPrimitives.ReadUInt32LittleEndian(image[(tableOffset + 4)..]);
            var kind = image[tableOffset + 11];
            var storedAddress = BinaryPrimitives.ReadUInt32LittleEndian(image[(tableOffset + 12)..]);
            if (!TryCreateRecord(startAddress, endAddress, kind, storedAddress, out var record)) return Array.Empty<Mg1LeChecksumRecord>();
            if (record.EndOffset >= image.Length || record.StoredOffset > image.Length - 4) return Array.Empty<Mg1LeChecksumRecord>();
            records.Add(record);
        }
        return records;
    }

    private static bool TryCreateRecord(uint startAddress, uint endAddress, byte kind, uint storedAddress, out Mg1LeChecksumRecord record)
    {
        record = default;
        const uint baseAddress = 0x80000000;
        if (kind is not (1 or 2 or 16) || startAddress < baseAddress || endAddress < startAddress || storedAddress < baseAddress)
            return false;
        var start = checked((int)(startAddress - baseAddress));
        var end = checked((int)(endAddress - baseAddress));
        var stored = checked((int)(storedAddress - baseAddress));
        record = new Mg1LeChecksumRecord(start, end, stored, kind);
        return true;
    }

    private static Mg1LeValidation Validate(ReadOnlySpan<byte> image, IReadOnlyList<Mg1LeChecksumRecord> records)
    {
        var invalid = 0;
        var details = new List<string>();
        foreach (var record in records)
        {
            var stored = BinaryPrimitives.ReadUInt32LittleEndian(image[record.StoredOffset..]);
            var calculated = Compute(image, record);
            if (stored != calculated)
            {
                invalid++;
                details.Add($"type {record.Kind} 0x{record.StartOffset:X}-0x{record.EndOffset:X}: stored 0x{stored:X8}, calculated 0x{calculated:X8}");
            }
        }
        return new Mg1LeValidation(invalid, string.Join("; ", details));
    }

    private static void WriteStoredChecksum(Span<byte> image, Mg1LeChecksumRecord record, uint value) =>
        BinaryPrimitives.WriteUInt32LittleEndian(image[record.StoredOffset..], value);

    private static uint Compute(ReadOnlySpan<byte> image, Mg1LeChecksumRecord record) => record.Kind switch
    {
        1 => Add32(image, record.StartOffset, record.EndOffset),
        2 => Crc32(image[record.StartOffset..(record.EndOffset + 1)]),
        16 => Add16(image, record.StartOffset, record.EndOffset),
        _ => throw new InvalidOperationException($"Unsupported MG1_LE checksum type {record.Kind}.")
    };

    private static uint Add32(ReadOnlySpan<byte> image, int start, int end)
    {
        if ((end - start + 1) % 4 != 0) throw new InvalidDataException("MG1_LE 32-bit checksum range is not word aligned.");
        uint sum = 0;
        for (var index = start; index <= end; index += 4) sum += BinaryPrimitives.ReadUInt32LittleEndian(image[index..]);
        return unchecked(sum - 1);
    }

    private static uint Add16(ReadOnlySpan<byte> image, int start, int end)
    {
        if ((end - start + 1) % 2 != 0) throw new InvalidDataException("MG1_LE 16-bit checksum range is not word aligned.");
        uint sum = 0;
        for (var index = start; index <= end; index += 2) sum += BinaryPrimitives.ReadUInt16LittleEndian(image[index..]);
        return unchecked(sum - 1);
    }

    private static uint Crc32(ReadOnlySpan<byte> bytes)
    {
        uint crc = 0xFFFFFFFF;
        foreach (var value in bytes)
        {
            crc ^= value;
            for (var bit = 0; bit < 8; bit++) crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320 : crc >> 1;
        }
        return ~crc;
    }
}

internal readonly record struct Mg1LeChecksumRecord(int StartOffset, int EndOffset, int StoredOffset, byte Kind);
internal readonly record struct Mg1LeValidation(int InvalidCount, string Detail);
