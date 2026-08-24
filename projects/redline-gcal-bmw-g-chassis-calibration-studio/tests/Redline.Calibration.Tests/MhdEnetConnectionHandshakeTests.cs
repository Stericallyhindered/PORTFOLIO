using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class MhdEnetConnectionHandshakeTests
{
    [Fact]
    public async Task DetectAsync_SelectsCtFromMhdEnetTesterPresentResponse()
    {
        var transport = new ScriptedTransport([new byte[] { 0x7E, 0x00 }]);

        var result = await MhdEnetConnectionHandshake.DetectAsync(transport);

        Assert.Equal(MhdCommunicationMode.Ct, result.Communication.Mode);
        Assert.Equal(1, result.Attempts);
        Assert.Single(transport.Requests);
        Assert.Equal(new byte[] { 0x3E, 0x00 }, transport.Requests[0]);
    }

    [Fact]
    public async Task DetectAsync_RetriesOnceLikeMhdConnectionClassifier()
    {
        var transport = new ScriptedTransport(
        [
            new TimeoutException("first attempt timed out"),
            new byte[] { 0x7E, 0x00 }
        ]);

        var result = await MhdEnetConnectionHandshake.DetectAsync(transport);

        Assert.Equal(MhdCommunicationMode.Ct, result.Communication.Mode);
        Assert.Equal(2, result.Attempts);
        Assert.Equal(2, transport.Requests.Count);
    }

    [Fact]
    public async Task DetectAsync_FailsClosedAfterTwoRejectedAttempts()
    {
        var transport = new ScriptedTransport(
        [
            new UdsDiagnosticException("rejected", 0x3E, 0x22),
            new TimeoutException("timed out")
        ]);

        await Assert.ThrowsAsync<IOException>(() => MhdEnetConnectionHandshake.DetectAsync(transport));
        Assert.Equal(2, transport.Requests.Count);
    }

    private sealed class ScriptedTransport(IReadOnlyList<object> script) : IUdsDiagnosticTransport
    {
        private int index;

        public List<byte[]> Requests { get; } = [];

        public Task<byte[]> RequestAsync(
            ReadOnlyMemory<byte> request,
            TimeSpan responseTimeout,
            TimeSpan pendingTimeout,
            CancellationToken cancellationToken = default)
        {
            Requests.Add(request.ToArray());
            var item = script[index++];
            return item is Exception exception
                ? Task.FromException<byte[]>(exception)
                : Task.FromResult((byte[])item);
        }
    }
}
