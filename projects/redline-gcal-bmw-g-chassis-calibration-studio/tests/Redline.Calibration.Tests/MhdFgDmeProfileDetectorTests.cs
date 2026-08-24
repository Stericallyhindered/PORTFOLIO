using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class MhdFgDmeProfileDetectorTests
{
    [Theory]
    [InlineData("624098424F4F544354524C5F56342E302E332F", 0x040003)]
    [InlineData("6240987878424F4F544354524C5F56332E3235352E312F", 0x03FF01)]
    public void ParsesMhdBootControlVersion(string hex, int expected)
    {
        Assert.Equal(expected, MhdFgDmeProfileDetector.ParseBootControlVersion(Convert.FromHexString(hex)));
    }

    [Fact]
    public void DetectsBothMhdBenchUnlockMarkers()
    {
        Assert.True(MhdFgDmeProfileDetector.ContainsBenchUnlockMarker("xxATATxx"u8));
        Assert.True(MhdFgDmeProfileDetector.ContainsBenchUnlockMarker("xxMHDunxx"u8));
        Assert.False(MhdFgDmeProfileDetector.ContainsBenchUnlockMarker("stock"u8));
    }

    [Theory]
    [InlineData("6300000001", true)]
    [InlineData("6300000000", false)]
    [InlineData("7F2331", false)]
    public void DetectsMhdDirectBenchUnlockMarker(string hex, bool expected)
    {
        Assert.Equal(expected, MhdFgDmeProfileDetector.HasDirectBenchUnlockMarker(Convert.FromHexString(hex)));
    }

    [Fact]
    public void DetectsMhdFemtoCustomMarkerAtPayloadOffsetThree()
    {
        Assert.True(MhdFgDmeProfileDetector.HasFemtoCustomMarker(Convert.FromHexString("62F18C31373639")));
        Assert.False(MhdFgDmeProfileDetector.HasFemtoCustomMarker(Convert.FromHexString("62F18C31373730")));
    }

    [Theory]
    [InlineData("6301020304", true, MhdFgUnlockStatus.Locked)]
    [InlineData("7F2331", true, MhdFgUnlockStatus.FemtoMhd)]
    [InlineData("7F2331", false, MhdFgUnlockStatus.Locked)]
    public void ClassifiesMhdFemtoMemoryProbe(string hex, bool hasPrg, MhdFgUnlockStatus expected)
    {
        Assert.Equal(expected, MhdFgDmeProfileDetector.ClassifyFemtoRegionResponse(Convert.FromHexString(hex), hasPrg));
    }
}
