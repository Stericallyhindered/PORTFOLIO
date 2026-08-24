using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class MhdtChallengeResponseTests
{
    [Fact]
    public void CreatesSourceShapedAuthorizationRequest()
    {
        var challengeResponse = new byte[11];
        challengeResponse[7] = 0x01;
        challengeResponse[8] = 0x23;
        challengeResponse[9] = 0x45;
        challengeResponse[10] = 0x67;
        var tokenResponse = new byte[] { 0x71, 0x07, 0x89, 0xAB, 0xCD, 0xEF, 0x01, 0x23, 0x45, 0x67 };

        var request = MhdtChallengeResponse.CreateAuthorizationRequest(challengeResponse, tokenResponse);

        Assert.Equal(70, request.Length);
        Assert.Equal(new byte[] { 0x31, 0x08, 0x00, 0x00, 0x00, 0x10 }, request[..6]);
        Assert.Contains(request[6..], value => value != 0);
    }

    [Fact]
    public void ProducesDeterministicResponseForKnownInputs()
    {
        var first = MhdtChallengeResponse.ComputeResponse(new byte[] { 1, 2, 3, 4 }, new byte[] { 5, 6, 7, 8, 9, 10, 11, 12 });
        var second = MhdtChallengeResponse.ComputeResponse(new byte[] { 1, 2, 3, 4 }, new byte[] { 5, 6, 7, 8, 9, 10, 11, 12 });

        Assert.Equal(64, first.Length);
        Assert.Equal(first, second);
    }

    [Fact]
    public void ValidatesResponsesAndFinalAcknowledgement()
    {
        Assert.Throws<ArgumentException>(() => MhdtChallengeResponse.CreateAuthorizationRequest(new byte[10], new byte[10]));
        Assert.Throws<ArgumentException>(() => MhdtChallengeResponse.CreateAuthorizationRequest(new byte[11], new byte[9]));
        Assert.True(MhdtChallengeResponse.IsAuthorizationAccepted(new byte[] { 0x71, 0x08, 0x01 }));
        Assert.False(MhdtChallengeResponse.IsAuthorizationAccepted(new byte[] { 0x71, 0x08, 0x00 }));
    }
}
