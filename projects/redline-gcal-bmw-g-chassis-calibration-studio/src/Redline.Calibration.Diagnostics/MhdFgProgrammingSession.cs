using System.Formats.Asn1;
using System.Numerics;
using System.Reflection;
using System.Security.Cryptography;
using System.Xml.Linq;

namespace Redline.Calibration.Diagnostics;

public sealed record MhdFgAuthorizationResult(int BtldSgbmNumber, byte[] SeedResponse, byte[] KeyRequest, byte[] KeyResponse);

public sealed record MhdFgUifEntry(byte ProcessClass, int SgbmNumber, byte Major, byte Minor, byte Patch)
{
    public byte[] ToBin() =>
    [
        ProcessClass,
        (byte)(SgbmNumber >> 24),
        (byte)(SgbmNumber >> 16),
        (byte)(SgbmNumber >> 8),
        (byte)SgbmNumber,
        Major,
        Minor,
        Patch
    ];
}

public sealed record MhdFgUif(IReadOnlyList<MhdFgUifEntry> Entries)
{
    public MhdFgUifEntry Btld => Entries.FirstOrDefault(entry => entry.ProcessClass == 6)
        ?? throw new InvalidDataException("The MHD F101 SVK/UIF payload did not contain a BTLD entry.");

    public bool HasPrg => Entries.Any(entry => entry.ProcessClass == 8);
}

public sealed class MhdFgProgrammingSession
{
    private static readonly byte[] FunctionalTesterPresent = [0x3E, 0x80];
    private readonly BmwEnetUdsClient _client;
    private readonly MhdFgSecurityKeyRegistry _keys;

    public MhdFgProgrammingSession(BmwEnetUdsClient client, MhdFgSecurityKeyRegistry? keys = null)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _keys = keys ?? MhdFgSecurityKeyRegistry.LoadEmbedded();
    }

    public async Task<MhdFgAuthorizationResult> EnterAndAuthorizeAsync(CancellationToken cancellationToken = default)
    {
        var uifResponse = await RequestRequiredAsync(
            [0x22, 0xF1, 0x01],
            TimeSpan.FromMilliseconds(300),
            4,
            response => response.Length >= 3 && response[0] == 0x62 && response[1] == 0xF1 && response[2] == 0x01,
            "MHD FG UIF identification",
            cancellationToken).ConfigureAwait(false);
        var btld = ParseBtldSgbm(uifResponse);

        for (var sessionAttempt = 0; sessionAttempt < 2; sessionAttempt++)
        {
            try
            {
                await RequestRequiredAsync(
                    [0x10, 0x03], TimeSpan.FromMilliseconds(500), 2,
                    response => response.Length >= 2 && response[0] == 0x50 && response[1] == 0x03,
                    "MHD FG extended session", cancellationToken).ConfigureAwait(false);

                var state = await RequestWithAttemptsAsync(
                    [0x22, 0x10, 0x0A], TimeSpan.FromMilliseconds(300), 2, cancellationToken).ConfigureAwait(false);
                var alreadyPrepared = state.Length >= 4 &&
                    state[0] == 0x62 && state[1] == 0x10 && state[2] == 0x0A && state[3] == 0x03;
                if (!alreadyPrepared)
                {
                    await PrepareProgrammingSessionAsync(cancellationToken).ConfigureAwait(false);
                }

                var authorization = await AuthorizeAsync(btld, cancellationToken).ConfigureAwait(false);
                await RequestWithAttemptsAsync(
                    BuildProgrammingDateRequest(DateTime.Now),
                    TimeSpan.FromMilliseconds(300),
                    2,
                    cancellationToken).ConfigureAwait(false);
                return authorization;
            }
            catch (Exception exception) when (
                sessionAttempt == 0 &&
                exception is IOException or TimeoutException or UdsDiagnosticException or CryptographicException)
            {
                await RequestWithAttemptsAsync(
                    [0x11, 0x01], TimeSpan.FromMilliseconds(300), 4, CancellationToken.None).ConfigureAwait(false);
                await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken).ConfigureAwait(false);
            }
        }

        throw new UdsDiagnosticException("MHD FG programming session could not be established after two attempts.", 0x10);
    }

    public static int ParseBtldSgbm(ReadOnlySpan<byte> f101Response)
        => ParseUif(f101Response).Btld.SgbmNumber;

    public static MhdFgUif ParseUif(ReadOnlySpan<byte> f101Response)
    {
        if (f101Response.Length < 10 || f101Response[0] != 0x62 || f101Response[1] != 0xF1 || f101Response[2] != 0x01)
        {
            throw new InvalidDataException("The F101 response is not a valid MHD FG SVK/UIF payload.");
        }

        var index = 2;
        index += 3;
        var xweCount = (f101Response[index++] << 8) | f101Response[index++];
        var metadataLength = index + 13 + (xweCount * 8) <= f101Response.Length ? 13 : 4;
        index += metadataLength;

        var entries = new List<MhdFgUifEntry>(xweCount);
        for (var entry = 0; entry < xweCount; entry++)
        {
            if (index + 8 > f101Response.Length)
            {
                throw new InvalidDataException("The F101 response ended inside an MHD XWE entry.");
            }

            var processClass = f101Response[index++];
            var sgbm = (f101Response[index++] << 24) |
                       (f101Response[index++] << 16) |
                       (f101Response[index++] << 8) |
                       f101Response[index++];
            entries.Add(new MhdFgUifEntry(
                processClass,
                sgbm,
                f101Response[index++],
                f101Response[index++],
                f101Response[index++]));
        }

        return new MhdFgUif(entries);
    }

    public static byte[] BuildProgrammingDateRequest(DateTime localDate)
    {
        var request = new byte[]
        {
            0x2E, 0xF1, 0x5A, 0x17, 0x02, 0x10, 0x8F, 0x04,
            0xD2, 0x01, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00
        };
        request[3] = ToBcd((byte)((localDate.Year - 2000) & 0xFF));
        request[4] = ToBcd((byte)localDate.Month);
        request[5] = ToBcd((byte)localDate.Day);
        return request;
    }

    private async Task PrepareProgrammingSessionAsync(CancellationToken cancellationToken)
    {
        var setup = new byte[][]
        {
            [0x31, 0x01, 0x0F, 0x0C, 0x03],
            [0x85, 0x02],
            [0x28, 0x01, 0x01],
            [0x31, 0x01, 0x10, 0x03, 0x01],
            [0x10, 0x01],
            [0x10, 0x03]
        };

        foreach (var request in setup)
        {
            await RequestWithAttemptsAsync(request, TimeSpan.FromMilliseconds(500), 2, cancellationToken).ConfigureAwait(false);
        }

        await RequestRequiredAsync(
            [0x10, 0x02], TimeSpan.FromMilliseconds(500), 4,
            response => response.Length >= 2 && response[0] == 0x50 && response[1] == 0x02,
            "MHD FG programming session", cancellationToken).ConfigureAwait(false);
    }

    private async Task<MhdFgAuthorizationResult> AuthorizeAsync(int btld, CancellationToken cancellationToken)
    {
        var seedResponse = await RequestRequiredAsync(
            [0x27, 0x11, 0xFF, 0xFF, 0xFF, 0xFF],
            TimeSpan.FromMilliseconds(300),
            2,
            response => response.Length >= 10 && response[0] == 0x67 && response[1] == 0x11,
            "MHD FG security seed", cancellationToken).ConfigureAwait(false);

        var keyRequest = _keys.CreateKeyRequest(btld, seedResponse.AsSpan(2, 8));
        var keyResponse = await RequestRequiredAsync(
            keyRequest,
            TimeSpan.FromMilliseconds(1200),
            3,
            response => response.Length >= 2 && response[0] == 0x67 && response[1] == 0x12,
            "MHD FG security key", cancellationToken).ConfigureAwait(false);
        return new MhdFgAuthorizationResult(btld, seedResponse, keyRequest, keyResponse);
    }

    private async Task<byte[]> RequestRequiredAsync(
        byte[] request,
        TimeSpan timeout,
        int attempts,
        Func<byte[], bool> accepted,
        string operation,
        CancellationToken cancellationToken)
    {
        var response = await RequestWithAttemptsAsync(request, timeout, attempts, cancellationToken).ConfigureAwait(false);
        if (!accepted(response))
        {
            throw new UdsDiagnosticException($"{operation} failed; response {Convert.ToHexString(response)}.", request[0]);
        }
        return response;
    }

    private async Task<byte[]> RequestWithAttemptsAsync(
        byte[] request,
        TimeSpan timeout,
        int attempts,
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < attempts; attempt++)
        {
            try
            {
                var response = await _client.RequestRawAsync(
                    request, timeout, TimeSpan.FromSeconds(10), cancellationToken).ConfigureAwait(false);
                if (response.Length > 0)
                {
                    return response;
                }
            }
            catch (TimeoutException) when (attempt + 1 < attempts)
            {
            }
        }
        return [];
    }

    private static byte ToBcd(byte value) => (byte)(((value / 10) << 4) | (value % 10));
}

public sealed class MhdFgSecurityKeyRegistry
{
    private const string ResourceName = "Redline.Calibration.Diagnostics.Resources.Auth_l3.xml";
    private readonly IReadOnlyDictionary<int, byte[]> _pkcs8ByBtld;

    private MhdFgSecurityKeyRegistry(IReadOnlyDictionary<int, byte[]> pkcs8ByBtld)
    {
        _pkcs8ByBtld = pkcs8ByBtld;
    }

    public static MhdFgSecurityKeyRegistry LoadEmbedded()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Missing embedded MHD FG key registry {ResourceName}.");
        var document = XDocument.Load(stream, LoadOptions.None);
        var keys = document.Root?.Elements("KEY")
            .Select(element => new
            {
                Btld = int.Parse(element.Element("BTLD")?.Value ?? throw new InvalidDataException("MHD key entry has no BTLD.")),
                Key = Convert.FromHexString(element.Element("PKCS8")?.Value ?? throw new InvalidDataException("MHD key entry has no PKCS8 value."))
            })
            .GroupBy(entry => entry.Btld)
            .ToDictionary(group => group.Key, group => group.Last().Key)
            ?? throw new InvalidDataException("The embedded MHD FG key registry is empty.");
        return new MhdFgSecurityKeyRegistry(keys);
    }

    public byte[] CreateKeyRequest(int btld, ReadOnlySpan<byte> seed)
    {
        if (seed.Length != 8) throw new ArgumentException("MHD FG security seed must be eight bytes.", nameof(seed));
        if (!_pkcs8ByBtld.TryGetValue(btld, out var pkcs8))
        {
            throw new CryptographicException($"MHD FG key registry has no key for BTLD {btld} (0x{btld:X8}).");
        }

        Span<byte> material = stackalloc byte[16];
        material[..4].Fill(0xFF);
        material[4] = (byte)(btld >> 24);
        material[5] = (byte)(btld >> 16);
        material[6] = (byte)(btld >> 8);
        material[7] = (byte)btld;
        seed.CopyTo(material[8..]);
        var digest = MD5.HashData(material);
        var rsaOutput = RawPrivateRsa(pkcs8, digest);

        for (var offset = 0; offset < rsaOutput.Length; offset += 4)
        {
            Array.Reverse(rsaOutput, offset, 4);
        }
        Array.Reverse(rsaOutput);

        var request = new byte[6 + rsaOutput.Length];
        request[0] = 0x27;
        request[1] = 0x12;
        var wordCount = rsaOutput.Length / 4;
        request[2] = (byte)(wordCount >> 24);
        request[3] = (byte)(wordCount >> 16);
        request[4] = (byte)(wordCount >> 8);
        request[5] = (byte)wordCount;
        rsaOutput.CopyTo(request, 6);
        return request;
    }

    private static byte[] RawPrivateRsa(ReadOnlyMemory<byte> pkcs8, ReadOnlySpan<byte> digest)
    {
        var privateKeyInfo = new AsnReader(pkcs8, AsnEncodingRules.DER).ReadSequence();
        privateKeyInfo.ReadInteger();
        var algorithm = privateKeyInfo.ReadSequence();
        if (algorithm.ReadObjectIdentifier() != "1.2.840.113549.1.1.1")
        {
            throw new CryptographicException("The selected MHD FG BTLD key is not RSA.");
        }
        if (algorithm.HasData) algorithm.ReadEncodedValue();
        var rsaKey = new AsnReader(privateKeyInfo.ReadOctetString(), AsnEncodingRules.DER).ReadSequence();
        rsaKey.ReadInteger();
        var modulusBytes = TrimUnsignedInteger(rsaKey.ReadIntegerBytes().Span);
        rsaKey.ReadIntegerBytes();
        var privateExponentBytes = TrimUnsignedInteger(rsaKey.ReadIntegerBytes().Span);

        var input = new byte[modulusBytes.Length];
        for (var index = 0; index < digest.Length; index++)
        {
            input[input.Length - index - 1] = digest[index];
        }

        var value = new BigInteger(input, isUnsigned: true, isBigEndian: true);
        var modulus = new BigInteger(modulusBytes, isUnsigned: true, isBigEndian: true);
        var exponent = new BigInteger(privateExponentBytes, isUnsigned: true, isBigEndian: true);
        var result = BigInteger.ModPow(value, exponent, modulus).ToByteArray(isUnsigned: true, isBigEndian: true);
        if (result.Length > input.Length)
        {
            throw new CryptographicException("MHD FG RSA result exceeded the modulus length.");
        }

        var padded = new byte[input.Length];
        result.CopyTo(padded, padded.Length - result.Length);
        return padded;
    }

    private static ReadOnlySpan<byte> TrimUnsignedInteger(ReadOnlySpan<byte> value) =>
        value.Length > 1 && value[0] == 0 ? value[1..] : value;
}
