namespace Redline.Calibration.Diagnostics;

public interface IUdsFlashTransport
{
    Task<byte[]> RequestAsync(ReadOnlyMemory<byte> payload, TimeSpan timeout, TimeSpan pendingTimeout, CancellationToken cancellationToken);

    Task SendWithoutResponseAsync(ReadOnlyMemory<byte> payload, byte ecuAddress, CancellationToken cancellationToken);
}

public sealed class BmwEnetUdsFlashTransport(BmwEnetUdsClient client) : IUdsFlashTransport
{
    public Task<byte[]> RequestAsync(ReadOnlyMemory<byte> payload, TimeSpan timeout, TimeSpan pendingTimeout, CancellationToken cancellationToken) =>
        client.RequestRawAsync(payload, timeout, pendingTimeout, cancellationToken);

    public Task SendWithoutResponseAsync(ReadOnlyMemory<byte> payload, byte ecuAddress, CancellationToken cancellationToken) =>
        client.SendWithoutResponseAsync(payload, ecuAddress, cancellationToken);
}

public sealed record UdsFlashTransferOptions(
    int BlockPayloadBytes,
    int MaxBlockRetries,
    TimeSpan BlockTimeout,
    TimeSpan PendingTimeout,
    TimeSpan InterBlockDelay,
    int BlockCounterBytes = 1,
    byte[]? TransferExitRequest = null,
    int MaxTransferExitAttempts = 1,
    TimeSpan RetryBackoffStep = default,
    TimeSpan TesterPresentInterval = default,
    byte[]? TesterPresentRequest = null,
    byte TesterPresentTarget = 0,
    bool TesterPresentSuppressResponse = false,
    TimeSpan TesterPresentDelay = default,
    TimeSpan TransferExitDelay = default,
    bool AllowConditionsNotCorrectOnExit = false)
{
    public static UdsFlashTransferOptions MhdCiDefaults { get; } = new(
        4094,
        9,
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(10),
        TimeSpan.FromMilliseconds(3),
        1,
        [0x37],
        5,
        TimeSpan.FromMilliseconds(30),
        TimeSpan.FromSeconds(2),
        [0x3E, 0x01],
        0,
        false,
        TimeSpan.Zero,
        TimeSpan.FromMilliseconds(3));

    public static UdsFlashTransferOptions MhdCtDefaults { get; } = new(
        4093,
        4,
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(10),
        TimeSpan.Zero,
        1,
        [0x37],
        10,
        TimeSpan.FromMilliseconds(30),
        TimeSpan.FromSeconds(2),
        [0x3E, 0x80],
        0xDF,
        true,
        TimeSpan.FromMilliseconds(50),
        TimeSpan.FromMilliseconds(3),
        true);

    public static UdsFlashTransferOptions MhdObservedDefaults => MhdCiDefaults;
}

public sealed class UdsFlashTransfer
{
    private readonly IUdsFlashTransport _transport;

    public UdsFlashTransfer(IUdsFlashTransport transport)
    {
        _transport = transport ?? throw new ArgumentNullException(nameof(transport));
    }

    public async Task TransferAsync(
        ReadOnlyMemory<byte> data,
        UdsFlashTransferOptions options,
        Action<int, int>? progress = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (data.IsEmpty) throw new ArgumentException("Flash data cannot be empty.", nameof(data));
        if (options.BlockPayloadBytes is <= 0 or > 0xFFFF) throw new ArgumentOutOfRangeException(nameof(options.BlockPayloadBytes));
        if (options.MaxBlockRetries < 0) throw new ArgumentOutOfRangeException(nameof(options.MaxBlockRetries));
        if (options.BlockCounterBytes is < 1 or > 3) throw new ArgumentOutOfRangeException(nameof(options.BlockCounterBytes));
        if (options.MaxTransferExitAttempts < 1) throw new ArgumentOutOfRangeException(nameof(options.MaxTransferExitAttempts));

        var blockCounter = 1u;
        var offset = 0;
        var lastTesterPresent = DateTimeOffset.MinValue;
        while (offset < data.Length)
        {
            if (options.TesterPresentRequest is not null &&
                options.TesterPresentInterval > TimeSpan.Zero &&
                DateTimeOffset.UtcNow - lastTesterPresent >= options.TesterPresentInterval)
            {
                if (options.TesterPresentSuppressResponse)
                {
                    await _transport.SendWithoutResponseAsync(
                        options.TesterPresentRequest,
                        options.TesterPresentTarget,
                        cancellationToken).ConfigureAwait(false);
                }
                else
                {
                    var testerResponse = await _transport.RequestAsync(
                        options.TesterPresentRequest,
                        options.BlockTimeout,
                        options.PendingTimeout,
                        cancellationToken).ConfigureAwait(false);
                    if (testerResponse.Length == 0 || testerResponse[0] != 0x7E)
                    {
                        throw new UdsDiagnosticException("DME did not confirm tester-present during transfer.", 0x3E);
                    }
                }

                if (options.TesterPresentDelay > TimeSpan.Zero)
                {
                    await Task.Delay(options.TesterPresentDelay, cancellationToken).ConfigureAwait(false);
                }
                lastTesterPresent = DateTimeOffset.UtcNow;
            }

            var count = Math.Min(options.BlockPayloadBytes, data.Length - offset);
            var request = new byte[count + 1 + options.BlockCounterBytes];
            request[0] = 0x36;
            for (var counterByte = 0; counterByte < options.BlockCounterBytes; counterByte++)
            {
                request[1 + counterByte] = (byte)(blockCounter >> (8 * (options.BlockCounterBytes - counterByte - 1)));
            }
            data.Span.Slice(offset, count).CopyTo(request.AsSpan(1 + options.BlockCounterBytes));

            var accepted = false;
            Exception? lastFailure = null;
            for (var attempt = 0; attempt <= options.MaxBlockRetries; attempt++)
            {
                try
                {
                    var response = await _transport.RequestAsync(request, options.BlockTimeout, options.PendingTimeout, cancellationToken).ConfigureAwait(false);
                    var acknowledgementMatches = response.Length >= 1 + options.BlockCounterBytes && response[0] == 0x76;
                    for (var counterByte = 0; acknowledgementMatches && counterByte < options.BlockCounterBytes; counterByte++)
                    {
                        acknowledgementMatches = response[1 + counterByte] == request[1 + counterByte];
                    }

                    if (acknowledgementMatches)
                    {
                        accepted = true;
                        break;
                    }

                    lastFailure = new UdsDiagnosticException($"Transfer block {blockCounter} acknowledgement did not match.", 0x36);
                }
                catch (Exception exception) when (exception is TimeoutException or UdsDiagnosticException)
                {
                    lastFailure = exception;
                }

            }

            if (!accepted)
            {
                throw new IOException($"DME did not confirm transfer block {blockCounter} after {options.MaxBlockRetries + 1} attempts.", lastFailure);
            }

            offset += count;
            progress?.Invoke(offset, data.Length);
            var counterLimit = options.BlockCounterBytes == 1 ? 0x100u : options.BlockCounterBytes == 2 ? 0x10000u : 0x1000000u;
            blockCounter = (blockCounter + 1) % counterLimit;
            if (offset < data.Length && options.InterBlockDelay > TimeSpan.Zero)
            {
                await Task.Delay(options.InterBlockDelay, cancellationToken).ConfigureAwait(false);
            }
        }

        if (options.TransferExitDelay > TimeSpan.Zero)
        {
            await Task.Delay(options.TransferExitDelay, cancellationToken).ConfigureAwait(false);
        }

        Exception? exitFailure = null;
        for (var attempt = 1; attempt <= options.MaxTransferExitAttempts; attempt++)
        {
            try
            {
                var exitResponse = await _transport.RequestAsync(
                    options.TransferExitRequest ?? [0x37],
                    options.BlockTimeout,
                    options.PendingTimeout,
                    cancellationToken).ConfigureAwait(false);
                if (exitResponse.Length > 0 && exitResponse[0] == 0x77) return;
                if (options.AllowConditionsNotCorrectOnExit &&
                    exitResponse.AsSpan().SequenceEqual(new byte[] { 0x7F, 0x37, 0x22 }))
                {
                    return;
                }
                exitFailure = new UdsDiagnosticException("DME did not confirm request-transfer-exit.", 0x37);
            }
            catch (UdsDiagnosticException exception) when (
                options.AllowConditionsNotCorrectOnExit &&
                exception.Service == 0x37 &&
                exception.NegativeResponseCode == 0x22)
            {
                return;
            }
            catch (Exception exception) when (exception is TimeoutException or UdsDiagnosticException)
            {
                exitFailure = exception;
            }

            if (attempt < options.MaxTransferExitAttempts && options.RetryBackoffStep > TimeSpan.Zero)
            {
                await Task.Delay(options.RetryBackoffStep * attempt, cancellationToken).ConfigureAwait(false);
            }
        }

        throw new IOException(
            $"DME did not confirm request-transfer-exit after {options.MaxTransferExitAttempts} attempts.",
            exitFailure);
    }
}
