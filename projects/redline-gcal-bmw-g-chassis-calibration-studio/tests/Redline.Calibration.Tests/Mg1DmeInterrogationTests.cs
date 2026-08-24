using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class Mg1DmeInterrogationTests
{
    [Fact]
    public async Task ReadsAndValidatesEveryMhdObservedMg1Identifier()
    {
        var transport = new RecordingTransport();

        var result = await Mg1DmeInterrogation.ReadAsync(transport, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));

        Assert.True(result.Succeeded);
        Assert.Equal(6, result.Responses.Count);
        Assert.Equal(new byte[] { 0x22, 0x30, 0x10 }, transport.Requests[0]);
        Assert.Equal(new byte[] { 0x22, 0x37, 0xFE }, transport.Requests[5]);
    }

    [Fact]
    public async Task PreservesAReadFailureWithoutFakingAnIdentity()
    {
        var result = await Mg1DmeInterrogation.ReadAsync(new RejectingTransport(), TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));

        Assert.False(result.Succeeded);
        Assert.All(result.Responses, response => Assert.NotNull(response.Failure));
    }

    private sealed class RecordingTransport : IUdsDiagnosticTransport
    {
        public List<byte[]> Requests { get; } = [];

        public Task<byte[]> RequestAsync(ReadOnlyMemory<byte> request, TimeSpan responseTimeout, TimeSpan pendingTimeout, CancellationToken cancellationToken = default)
        {
            var payload = request.ToArray();
            Requests.Add(payload);
            return Task.FromResult(new byte[] { 0x62, payload[1], payload[2], 0xAA });
        }
    }

    private sealed class RejectingTransport : IUdsDiagnosticTransport
    {
        public Task<byte[]> RequestAsync(ReadOnlyMemory<byte> request, TimeSpan responseTimeout, TimeSpan pendingTimeout, CancellationToken cancellationToken = default) =>
            throw new UdsDiagnosticException("Rejected for test.", request.Span[0], 0x22);
    }
}
