using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class HsfzFrameTests
{
    [Fact]
    public void SerializesTheDocumentedAliveCheckFrame()
    {
        var frame = HsfzFrame.AliveCheck();

        Assert.Equal(new byte[] { 0, 0, 0, 2, 0, 0x12, 0xF4, 0x10 }, frame.Serialize());
    }

    [Fact]
    public void UsesBigEndianLengthAndRoundTripsDiagnosticPayload()
    {
        var source = HsfzFrame.Diagnostic(0xF4, 0x12, new byte[] { 0x22, 0xF1, 0x90 });
        var bytes = source.Serialize();

        Assert.Equal(new byte[] { 0, 0, 0, 5, 0, 1, 0xF4, 0x12, 0x22, 0xF1, 0x90 }, bytes);
        Assert.True(HsfzFrame.TryParse(bytes, out var parsed));
        Assert.NotNull(parsed);
        Assert.Equal(source.Type, parsed!.Type);
        Assert.Equal(source.Body, parsed.Body);
    }
}
