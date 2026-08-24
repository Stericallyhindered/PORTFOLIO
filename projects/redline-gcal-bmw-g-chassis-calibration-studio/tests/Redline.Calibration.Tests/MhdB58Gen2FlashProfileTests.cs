using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class MhdB58Gen2FlashProfileTests
{
    [Fact]
    public void NormalSections_MatchC1ProfileRanges()
    {
        Assert.Collection(
            MhdB58Gen2FlashProfile.NormalSections,
            section =>
            {
                Assert.Equal("BTLD", section.Name);
                Assert.Equal(0x80028100u, section.Address);
                Assert.Equal(0x28100, section.SourceOffset);
                Assert.Equal(0x37F00, section.Length);
            },
            section =>
            {
                Assert.Equal("PRG", section.Name);
                Assert.Equal(0x80080100u, section.Address);
                Assert.Equal(0x80100, section.SourceOffset);
                Assert.Equal(0x67FEE0, section.Length);
            },
            section =>
            {
                Assert.Equal("CAL", section.Name);
                Assert.Equal(0x80700100u, section.Address);
                Assert.Equal(0x700100, section.SourceOffset);
                Assert.Equal(0xFFEE0, section.Length);
            });
    }

    [Fact]
    public void BuildSections_FemtoMhd_UsesCalOnlyAndInjectsExactC1Tail()
    {
        var bin = new byte[MhdB58Gen2FlashProfile.BinLength];

        var section = Assert.Single(MhdB58Gen2FlashProfile.BuildSections(bin, MhdFgUnlockStatus.FemtoMhd));

        Assert.Equal("CAL", section.Name);
        Assert.Equal(0x80700100u, section.Address);
        Assert.Equal(0x700100, section.SourceOffset);
        Assert.Equal(0xFFF00, section.Length);
        var prepared = MhdB58Gen2FlashProfile.PrepareImage(bin, MhdFgUnlockStatus.FemtoMhd);
        Assert.Equal(
            "FEAFEDFE000000000000000000000000000000000000000000000000BB820E18",
            Convert.ToHexString(prepared.AsSpan(0x7FFFE0, 32)));
    }

    [Fact]
    public void BuildSections_FemtoCustom_UsesUnmodifiedCalOnlyRange()
    {
        var bin = Enumerable.Repeat((byte)0x5A, MhdB58Gen2FlashProfile.BinLength).ToArray();

        var section = Assert.Single(MhdB58Gen2FlashProfile.BuildSections(bin, MhdFgUnlockStatus.FemtoCustom));

        Assert.Equal(0x80700100u, section.Address);
        Assert.Equal(0x700100, section.SourceOffset);
        Assert.Equal(0xFFEE0, section.Length);
        var prepared = MhdB58Gen2FlashProfile.PrepareImage(bin, MhdFgUnlockStatus.FemtoCustom);
        Assert.All(prepared, value => Assert.Equal(0x5A, value));
    }

    [Theory]
    [InlineData("BTLD", "3101FF0002408005FD00")]
    [InlineData("PRG", "3101FF000240806FFD00")]
    [InlineData("CAL", "3101FF000240807FFD00")]
    public void BuildFgEraseRequest_MatchesXiAndC1Templates(string section, string expectedHex)
    {
        Assert.Equal(expectedHex, Convert.ToHexString(MhdB58Gen2FlashProfile.BuildFgEraseRequest(section)));
    }

    [Theory]
    [InlineData("BTLD", "3101020212408005FD000000")]
    [InlineData("PRG", "310102021240806FFD000000")]
    [InlineData("CAL", "310102021240807FFD000000")]
    public void BuildFgVerifyRequest_MatchesXiAndC1Templates(string section, string expectedHex)
    {
        Assert.Equal(expectedHex, Convert.ToHexString(MhdB58Gen2FlashProfile.BuildFgVerifyRequest(section)));
    }
}
