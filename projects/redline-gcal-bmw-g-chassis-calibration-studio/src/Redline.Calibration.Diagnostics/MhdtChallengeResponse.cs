using System.Numerics;
using System.Security.Cryptography;

namespace Redline.Calibration.Diagnostics;

/// <summary>
/// Implements the MHD MHDT authorization exchange used by the non-Platform-54 branch
/// in the authorized MHD source. The caller owns the transport/session sequencing.
/// </summary>
public static class MhdtChallengeResponse
{
    private static readonly byte[] NormalPlatformModulus =
    [
        203, 62, 69, 228, 84, 203, 60, 75, 228, 85, 52, 125, 244, 249, 82, 9,
        121, 221, 255, 112, 15, 183, 81, 164, 218, 135, 78, 68, 158, 97, 144, 173,
        152, 153, 43, 128, 53, 178, 202, 167, 97, 26, 137, 214, 83, 8, 212, 192,
        31, 230, 8, 58, 181, 60, 33, 6, 201, 182, 95, 62, 16, 249, 76, 167
    ];

    private static readonly byte[] NormalPlatformExponent =
    [
        175, 185, 35, 77, 115, 100, 99, 187, 114, 26, 206, 186, 180, 138, 165, 182,
        135, 95, 131, 48, 94, 130, 6, 31, 48, 9, 75, 36, 177, 42, 230, 37,
        58, 168, 225, 54, 44, 135, 65, 170, 123, 113, 202, 103, 231, 110, 103, 210,
        150, 142, 147, 154, 135, 191, 4, 74, 65, 99, 123, 45, 185, 108, 230, 23
    ];

    private static readonly byte[] MhdtMarker = "MHDT"u8.ToArray();

    public static ReadOnlyMemory<byte> ChallengeRequest => new byte[] { 0x1A, 0x87 };

    public static ReadOnlyMemory<byte> TokenRequest => new byte[] { 0x31, 0x07, 0x03, 0x4D, 0x48, 0x44, 0x54 };

    public static byte[] CreateAuthorizationRequest(ReadOnlySpan<byte> challengeResponse, ReadOnlySpan<byte> tokenResponse)
    {
        var challenge = ExtractChallenge(challengeResponse);
        var token = ExtractToken(tokenResponse);
        var response = ComputeResponse(challenge, token);

        var request = new byte[6 + response.Length];
        request[0] = 0x31;
        request[1] = 0x08;
        request[5] = 0x10;
        response.CopyTo(request, 6);
        return request;
    }

    public static async Task<MhdtAuthorizationResult> AuthorizeAsync(
        BmwEnetUdsClient client,
        TimeSpan responseTimeout,
        TimeSpan pendingTimeout,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        var challengeResponse = await client.RequestAsync(
            ChallengeRequest,
            responseTimeout,
            pendingTimeout,
            cancellationToken).ConfigureAwait(false);
        var tokenResponse = await client.RequestAsync(
            TokenRequest,
            responseTimeout,
            pendingTimeout,
            cancellationToken).ConfigureAwait(false);
        var authorizationRequest = CreateAuthorizationRequest(challengeResponse, tokenResponse);
        var authorizationResponse = await client.RequestAsync(
            authorizationRequest,
            responseTimeout,
            pendingTimeout,
            cancellationToken).ConfigureAwait(false);

        if (!IsAuthorizationAccepted(authorizationResponse))
        {
            throw new UdsDiagnosticException(
                "MHDT authorization response was not accepted by the DME.",
                0x31);
        }

        return new MhdtAuthorizationResult(challengeResponse, tokenResponse, authorizationRequest, authorizationResponse);
    }

    public static bool IsAuthorizationAccepted(ReadOnlySpan<byte> response) =>
        response.Length == 3 && response[0] == 0x71 && response[2] == 0x01;

    public static byte[] ComputeResponse(ReadOnlySpan<byte> challenge, ReadOnlySpan<byte> token)
    {
        if (challenge.Length != 4) throw new ArgumentException("MHDT challenge must be exactly four bytes.", nameof(challenge));
        if (token.Length != 8) throw new ArgumentException("MHDT token must be exactly eight bytes.", nameof(token));

        Span<byte> material = stackalloc byte[16];
        MhdtMarker.CopyTo(material);
        challenge.CopyTo(material[4..]);
        token.CopyTo(material[8..]);
        var digest = MD5.HashData(material);

        var value = FromLittleEndianUnsigned(digest);
        var modulus = FromLittleEndianUnsigned(NormalPlatformModulus);
        var exponent = FromLittleEndianUnsigned(NormalPlatformExponent);
        var encrypted = BigInteger.ModPow(value, exponent, modulus);
        return ReverseWords(ToMhdIntegerBytes(encrypted));
    }

    private static byte[] ExtractChallenge(ReadOnlySpan<byte> response)
    {
        if (response.Length < 11) throw new ArgumentException("The 1A 87 response does not contain the four-byte MHDT challenge.", nameof(response));
        return response.Slice(7, 4).ToArray();
    }

    private static byte[] ExtractToken(ReadOnlySpan<byte> response)
    {
        if (response.Length < 10) throw new ArgumentException("The 31 07 response does not contain the eight-byte MHDT token.", nameof(response));
        return response.Slice(2, 8).ToArray();
    }

    private static BigInteger FromLittleEndianUnsigned(ReadOnlySpan<byte> value) => new(value, isUnsigned: true, isBigEndian: false);

    private static byte[] ToMhdIntegerBytes(BigInteger value)
    {
        var bytes = value.ToByteArray(isUnsigned: true, isBigEndian: false);
        var paddedLength = ((bytes.Length + 3) / 4) * 4;
        Array.Resize(ref bytes, paddedLength);
        return bytes;
    }

    private static byte[] ReverseWords(byte[] value)
    {
        for (var offset = 0; offset < value.Length; offset += 4)
        {
            Array.Reverse(value, offset, 4);
        }

        return value;
    }
}

public sealed record MhdtAuthorizationResult(
    byte[] ChallengeResponse,
    byte[] TokenResponse,
    byte[] AuthorizationRequest,
    byte[] AuthorizationResponse);
