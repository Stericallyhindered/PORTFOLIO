using System.Diagnostics;

namespace Redline.Calibration.Diagnostics;

public sealed class UdsDiagnosticException : IOException
{
    public UdsDiagnosticException(string message, byte service, byte? negativeResponseCode = null)
        : base(message)
    {
        Service = service;
        NegativeResponseCode = negativeResponseCode;
    }

    public byte Service { get; }

    public byte? NegativeResponseCode { get; }
}

public sealed class BmwEnetUdsClient : IUdsDiagnosticTransport
{
    private readonly BmwEnetDiagnosticSession _session;

    public BmwEnetUdsClient(BmwEnetDiagnosticSession session, byte testerAddress = 0xF4, byte ecuAddress = 0x12)
    {
        ArgumentNullException.ThrowIfNull(session);
        _session = session;
        TesterAddress = testerAddress;
        EcuAddress = ecuAddress;
    }

    public byte TesterAddress { get; }

    public byte EcuAddress { get; }

    public event EventHandler<UdsTrafficEventArgs>? Traffic;

    public async Task<byte[]> RequestAsync(
        ReadOnlyMemory<byte> request,
        TimeSpan responseTimeout,
        TimeSpan pendingTimeout,
        CancellationToken cancellationToken = default) =>
        await RequestCoreAsync(request, responseTimeout, pendingTimeout, throwOnNegativeResponse: true, EcuAddress, cancellationToken).ConfigureAwait(false);

    public async Task<byte[]> RequestRawAsync(
        ReadOnlyMemory<byte> request,
        TimeSpan responseTimeout,
        TimeSpan pendingTimeout,
        CancellationToken cancellationToken = default) =>
        await RequestCoreAsync(request, responseTimeout, pendingTimeout, throwOnNegativeResponse: false, EcuAddress, cancellationToken).ConfigureAwait(false);

    public async Task<byte[]> RequestRawAsync(
        ReadOnlyMemory<byte> request,
        byte ecuAddress,
        TimeSpan responseTimeout,
        TimeSpan pendingTimeout,
        CancellationToken cancellationToken = default) =>
        await RequestCoreAsync(request, responseTimeout, pendingTimeout, throwOnNegativeResponse: false, ecuAddress, cancellationToken).ConfigureAwait(false);

    public async Task SendWithoutResponseAsync(
        ReadOnlyMemory<byte> request,
        byte ecuAddress,
        CancellationToken cancellationToken = default)
    {
        if (request.IsEmpty) throw new ArgumentException("A UDS request is required.", nameof(request));
        await _session.SendAsync(HsfzFrame.Diagnostic(TesterAddress, ecuAddress, request.Span), cancellationToken).ConfigureAwait(false);
        Traffic?.Invoke(this, new UdsTrafficEventArgs(DateTimeOffset.UtcNow, UdsTrafficDirection.Request, request.ToArray()));
    }

    private async Task<byte[]> RequestCoreAsync(
        ReadOnlyMemory<byte> request,
        TimeSpan responseTimeout,
        TimeSpan pendingTimeout,
        bool throwOnNegativeResponse,
        byte ecuAddress,
        CancellationToken cancellationToken)
    {
        if (request.IsEmpty) throw new ArgumentException("A UDS request is required.", nameof(request));
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(responseTimeout, TimeSpan.Zero);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(pendingTimeout, TimeSpan.Zero);

        await _session.SendAsync(HsfzFrame.Diagnostic(TesterAddress, ecuAddress, request.Span), cancellationToken).ConfigureAwait(false);
        Traffic?.Invoke(this, new UdsTrafficEventArgs(DateTimeOffset.UtcNow, UdsTrafficDirection.Request, request.ToArray()));

        var stopwatch = Stopwatch.StartNew();
        var awaitingPendingCompletion = false;
        while (true)
        {
            var timeout = awaitingPendingCompletion ? pendingTimeout : responseTimeout;
            var remaining = timeout - stopwatch.Elapsed;
            if (remaining <= TimeSpan.Zero)
            {
                throw new TimeoutException($"Timed out waiting for UDS 0x{request.Span[0]:X2} response.");
            }

            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            deadline.CancelAfter(remaining);
            HsfzFrame frame;
            try
            {
                frame = await _session.ReceiveAsync(deadline.Token).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                throw new TimeoutException($"Timed out waiting for UDS 0x{request.Span[0]:X2} response.");
            }
            if (frame.Type == HsfzMessageType.AliveCheck)
            {
                await _session.SendAsync(HsfzFrame.AliveCheckResponse(TesterAddress, ecuAddress), cancellationToken).ConfigureAwait(false);
                continue;
            }

            if (frame.Type != HsfzMessageType.Diagnostic || frame.Body.Length < 3)
            {
                continue;
            }

            var payload = frame.Body.AsSpan(2).ToArray();
            Traffic?.Invoke(this, new UdsTrafficEventArgs(DateTimeOffset.UtcNow, UdsTrafficDirection.Response, payload));
            if (payload.Length >= 3 && payload[0] == 0x7F && payload[1] == request.Span[0])
            {
                if (payload[2] == 0x78)
                {
                    awaitingPendingCompletion = true;
                    stopwatch.Restart();
                    continue;
                }

                if (throwOnNegativeResponse)
                {
                    throw new UdsDiagnosticException(
                        $"DME rejected UDS 0x{request.Span[0]:X2} with NRC 0x{payload[2]:X2}.",
                        request.Span[0],
                        payload[2]);
                }

                return payload;
            }

            if (payload[0] != (byte)(request.Span[0] + 0x40))
            {
                continue;
            }

            return payload;
        }
    }
}

public enum UdsTrafficDirection
{
    Request,
    Response
}

public sealed class UdsTrafficEventArgs : EventArgs
{
    public UdsTrafficEventArgs(DateTimeOffset at, UdsTrafficDirection direction, byte[] payload)
    {
        At = at;
        Direction = direction;
        Payload = payload;
    }

    public DateTimeOffset At { get; }
    public UdsTrafficDirection Direction { get; }
    public byte[] Payload { get; }
}
