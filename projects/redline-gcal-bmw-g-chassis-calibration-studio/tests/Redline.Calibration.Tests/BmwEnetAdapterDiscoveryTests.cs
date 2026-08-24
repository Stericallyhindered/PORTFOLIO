using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class BmwEnetAdapterDiscoveryTests
{
    [Fact]
    public void ProbeMatchesTheMhdAdapterDiscoveryFrame()
    {
        Assert.Equal(new byte[] { 0, 0, 0, 0, 0, 0x11 }, BmwEnetAdapterDiscovery.Probe.ToArray());
    }

    [Fact]
    public void RecognizesMhdStyleDiagnosticAdapterResponse()
    {
        var response = new HsfzFrame(
            HsfzMessageType.VehicleIdentification,
            System.Text.Encoding.ASCII.GetBytes("DIAGADR10BMWMACAABBCCDDEEFFBMWVINWBAXXXXXXX0000001")).Serialize();

        Assert.True(BmwEnetAdapterDiscovery.IsAdapterResponse(response));
        Assert.True(BmwEnetAdapterDiscovery.TryParseVehicleIdentification(response, out var identity));
        Assert.Equal("AABBCCDDEEFF", identity!.MacAddress);
        Assert.Equal("WBAXXXXXXX0000001", identity.Vin);
    }

    [Theory]
    [InlineData(43)]
    [InlineData(8)]
    public void RejectsShortDiscoveryResponses(int length)
    {
        Assert.False(BmwEnetAdapterDiscovery.IsAdapterResponse(new byte[length]));
    }

    [Fact]
    public void RejectsAFrameWithoutTheExactVehicleIdentificationMarker()
    {
        var response = new HsfzFrame(HsfzMessageType.VehicleIdentification, "DIAG"u8.ToArray()).Serialize();

        Assert.False(BmwEnetAdapterDiscovery.IsAdapterResponse(response));
    }
}
