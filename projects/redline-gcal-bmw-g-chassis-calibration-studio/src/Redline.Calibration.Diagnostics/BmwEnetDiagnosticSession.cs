using System.Net.Sockets;

namespace Redline.Calibration.Diagnostics;

public sealed class BmwEnetDiagnosticSession : IAsyncDisposable
{
    private readonly TcpClient client;

    private BmwEnetDiagnosticSession(TcpClient client, BmwEnetAdapter adapter)
    {
        this.client = client;
        Adapter = adapter;
        Stream = client.GetStream();
    }

    public BmwEnetAdapter Adapter { get; }

    public NetworkStream Stream { get; }

    public Task SendAsync(HsfzFrame frame, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(frame);
        return Stream.WriteAsync(frame.Serialize(), cancellationToken).AsTask();
    }

    public async Task<HsfzFrame> ReceiveAsync(CancellationToken cancellationToken = default)
    {
        var header = new byte[HsfzFrame.HeaderLength];
        await Stream.ReadExactlyAsync(header, cancellationToken);
        var bodyLength = System.Buffers.Binary.BinaryPrimitives.ReadUInt32BigEndian(header);
        if (bodyLength > 65536)
        {
            throw new InvalidDataException($"HSFZ frame body is too large: {bodyLength} bytes.");
        }

        var fullFrame = new byte[HsfzFrame.HeaderLength + (int)bodyLength];
        header.CopyTo(fullFrame, 0);
        await Stream.ReadExactlyAsync(fullFrame.AsMemory(HsfzFrame.HeaderLength), cancellationToken);
        if (!HsfzFrame.TryParse(fullFrame, out var frame))
        {
            throw new InvalidDataException("Malformed HSFZ frame.");
        }

        return frame ?? throw new InvalidDataException("Malformed HSFZ frame.");
    }

    public static async Task<BmwEnetDiagnosticSession> ConnectAsync(
        BmwEnetAdapter adapter,
        TimeSpan timeout,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(adapter);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(timeout, TimeSpan.Zero);

        var client = new TcpClient(adapter.Address.AddressFamily) { NoDelay = true };
        try
        {
            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            deadline.CancelAfter(timeout);
            await client.ConnectAsync(adapter.Address, BmwEnetAdapter.DefaultDiagnosticPort, deadline.Token);
            return new BmwEnetDiagnosticSession(client, adapter);
        }
        catch
        {
            client.Dispose();
            throw;
        }
    }

    public ValueTask DisposeAsync()
    {
        client.Dispose();
        return ValueTask.CompletedTask;
    }
}
