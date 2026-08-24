using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class MhdFgProgrammingSessionTests
{
    [Fact]
    public void ParseBtldSgbm_UsesMhdF101XweLayout()
    {
        var response = new byte[36];
        response[0] = 0x62;
        response[1] = 0xF1;
        response[2] = 0x01;
        response[3] = 0x01;
        response[4] = 0x00;
        response[5] = 0x00;
        response[6] = 0x02;
        response[20] = 0x08;
        response[21] = 0x00;
        response[22] = 0x00;
        response[23] = 0x5D;
        response[24] = 0x55;
        response[28] = 0x06;
        response[29] = 0x00;
        response[30] = 0x00;
        response[31] = 0x5B;
        response[32] = 0xA6;

        Assert.Equal(0x00005BA6, MhdFgProgrammingSession.ParseBtldSgbm(response));
    }

    [Fact]
    public void BuildProgrammingDateRequest_MatchesMhdFgTemplate()
    {
        Assert.Equal(
            "2EF15A2608228F04D201000000100000",
            Convert.ToHexString(MhdFgProgrammingSession.BuildProgrammingDateRequest(new DateTime(2026, 8, 22))));
    }

    [Fact]
    public void EmbeddedRegistry_CreatesMhdSecurityAccessRequest()
    {
        var request = MhdFgSecurityKeyRegistry.LoadEmbedded().CreateKeyRequest(
            31375,
            new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 });

        Assert.Equal(0x27, request[0]);
        Assert.Equal(0x12, request[1]);
        Assert.Equal("00000020", Convert.ToHexString(request.AsSpan(2, 4)));
        Assert.Equal(134, request.Length);
        Assert.Equal(
            "03AB1178CFD797234C44FC65E7E4FC58C37F47E0C3F92480B18C8845A086B9CC",
            Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(request)));
    }
}
