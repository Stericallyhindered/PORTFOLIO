namespace Redline.Calibration.Diagnostics;

public sealed record MhdEnetHandshakeResult(
    MhdCommunicationProfile Communication,
    int Attempts,
    byte[] Response);

public static class MhdEnetConnectionHandshake
{
    private static readonly byte[] TesterPresent = [0x3E, 0x00];

    public static async Task<MhdEnetHandshakeResult> DetectAsync(
        IUdsDiagnosticTransport transport,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transport);

        Exception? lastFailure = null;
        for (var attempt = 1; attempt <= 2; attempt++)
        {
            try
            {
                var response = await transport.RequestAsync(
                    TesterPresent,
                    TimeSpan.FromMilliseconds(500),
                    TimeSpan.FromSeconds(10),
                    cancellationToken).ConfigureAwait(false);

                if (response.Length >= 1 && response[0] == 0x7E)
                {
                    return new MhdEnetHandshakeResult(MhdCommunicationProfile.Ct, attempt, response);
                }

                lastFailure = new UdsDiagnosticException(
                    "MHD ENET handshake returned an unexpected tester-present response.",
                    TesterPresent[0]);
            }
            catch (Exception exception) when (exception is TimeoutException or UdsDiagnosticException)
            {
                lastFailure = exception;
            }
        }

        throw new IOException(
            "MHD ENET handshake failed after two attempts; communication profile was not detected.",
            lastFailure);
    }
}
