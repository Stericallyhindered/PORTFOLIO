using System.Buffers.Binary;
using System.Security.Cryptography;

namespace Redline.Calibration.Diagnostics;

public sealed record MhdDmeReadProgress(uint Address, int BytesRead, int TotalBytes);

public sealed record MhdDmeBaseMap(string Path, int Length, string Sha256);

public sealed class MhdDmeBaseMapExtractor
{
    private readonly IUdsDiagnosticTransport _transport;

    public MhdDmeBaseMapExtractor(IUdsDiagnosticTransport transport)
    {
        _transport = transport ?? throw new ArgumentNullException(nameof(transport));
    }

    public async Task<MhdDmeBaseMap> ReadB58Gen2Async(
        string destinationPath,
        IProgress<MhdDmeReadProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationPath);
        var destination = Path.GetFullPath(destinationPath);
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        var temporaryPath = destination + ".tmp";
        const int totalBytes = MhdB58Gen2FlashProfile.BinLength;
        const int chunkBytes = 0x1000;
        const uint baseAddress = 0x80000000;

        try
        {
            await using (var output = new FileStream(temporaryPath, FileMode.Create, FileAccess.Write, FileShare.None, 65536, FileOptions.SequentialScan | FileOptions.WriteThrough))
            {
                var buffer = new byte[chunkBytes];
                for (var offset = 0; offset < totalBytes; offset += chunkBytes)
                {
                    var count = Math.Min(chunkBytes, totalBytes - offset);
                    var request = new byte[8];
                    request[0] = 0x23;
                    request[1] = 0x24;
                    BinaryPrimitives.WriteUInt32BigEndian(request.AsSpan(2, 4), baseAddress + (uint)offset);
                    BinaryPrimitives.WriteUInt16BigEndian(request.AsSpan(6, 2), checked((ushort)count));
                    var response = await _transport.RequestAsync(request, TimeSpan.FromMilliseconds(500), TimeSpan.FromSeconds(3), cancellationToken).ConfigureAwait(false);
                    if (response.Length < count + 1 || response[0] != 0x63)
                    {
                        throw new UdsDiagnosticException($"MHD DME read-memory response was invalid at 0x{baseAddress + (uint)offset:X8}.", 0x23);
                    }

                    response.AsSpan(1, count).CopyTo(buffer);
                    await output.WriteAsync(buffer.AsMemory(0, count), cancellationToken).ConfigureAwait(false);
                    progress?.Report(new(baseAddress + (uint)offset, offset + count, totalBytes));
                }

                await output.FlushAsync(cancellationToken).ConfigureAwait(false);
                output.Flush(flushToDisk: true);
            }

            var bytes = await File.ReadAllBytesAsync(temporaryPath, cancellationToken).ConfigureAwait(false);
            if (bytes.Length != totalBytes)
            {
                throw new IOException($"OEM BIN readback length was {bytes.Length:N0}; expected {totalBytes:N0}.");
            }

            File.Move(temporaryPath, destination, true);
            return new MhdDmeBaseMap(destination, bytes.Length, Convert.ToHexString(SHA256.HashData(bytes)));
        }
        finally
        {
            if (File.Exists(temporaryPath)) File.Delete(temporaryPath);
        }
    }
}
