using System.Text;

namespace Redline.Calibration.Diagnostics;

public sealed record MhdFgDmeProfile(
    MhdFgUnlockStatus UnlockStatus,
    int BootControlVersion,
    int BtldSgbmNumber,
    bool HasPrg,
    string Evidence);

public sealed class MhdFgDmeProfileDetector
{
    private const int FemtoBootControlThreshold = 0x040003;
    private static readonly byte[] ReadBtldMarker = [0x23, 0x14, 0x80, 0x05, 0xF7, 0xDC, 0x04];
    private static readonly byte[] ReadFemtoRegion = [0x23, 0x14, 0x80, 0x78, 0x00, 0x00, 0x04];
    private readonly BmwEnetUdsClient _client;

    public MhdFgDmeProfileDetector(BmwEnetUdsClient client)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
    }

    public async Task<MhdFgDmeProfile> DetectAsync(CancellationToken cancellationToken = default)
    {
        var uifResponse = await RequestRequiredAsync(
            [0x22, 0xF1, 0x01], 4, cancellationToken).ConfigureAwait(false);
        var uif = MhdFgProgrammingSession.ParseUif(uifResponse);

        var devInfoRequest = new byte[] { 0x31, 0x01, 0x02, 0x05 }
            .Concat(uif.Btld.ToBin())
            .ToArray();
        var btldDevInfo = await RequestRequiredAsync(devInfoRequest, 4, cancellationToken).ConfigureAwait(false);
        if (ContainsBenchUnlockMarker(btldDevInfo))
        {
            return Profile(MhdFgUnlockStatus.BenchUnlocked, 0, uif, "BTLD development info contains the MHD bench-unlock marker.");
        }

        var btldMarkerResponse = await RequestRequiredAsync(ReadBtldMarker, 2, cancellationToken).ConfigureAwait(false);
        if (HasDirectBenchUnlockMarker(btldMarkerResponse))
        {
            return Profile(MhdFgUnlockStatus.BenchUnlocked, 0, uif, "Memory 0x8005F7DC contains the MHD bench-unlock marker.");
        }

        var bootControlResponse = await RequestRequiredAsync(
            [0x22, 0x40, 0x98], 4, cancellationToken).ConfigureAwait(false);
        var bootControlVersion = ParseBootControlVersion(bootControlResponse);
        if (bootControlVersion < FemtoBootControlThreshold)
        {
            return Profile(MhdFgUnlockStatus.Locked, bootControlVersion, uif, "BOOTCTRL_V is below MHD's 4.0.3 Femto threshold.");
        }

        var f18cResponse = await RequestRequiredAsync(
            [0x22, 0xF1, 0x8C], 4, cancellationToken).ConfigureAwait(false);
        if (HasFemtoCustomMarker(f18cResponse))
        {
            return Profile(MhdFgUnlockStatus.FemtoCustom, bootControlVersion, uif, "F18C contains MHD's 1769 custom-Femto marker.");
        }

        var femtoRegionResponse = await RequestRequiredAsync(ReadFemtoRegion, 2, cancellationToken).ConfigureAwait(false);
        var status = ClassifyFemtoRegionResponse(femtoRegionResponse, uif.HasPrg);
        var evidence = status == MhdFgUnlockStatus.FemtoMhd
            ? "ReadMemoryByAddress at 0x80780000 was denied and UIF contains PRG, matching MHD's Femto-MHD branch."
            : "ReadMemoryByAddress at 0x80780000 succeeded, matching MHD's locked branch.";
        return Profile(status, bootControlVersion, uif, evidence);
    }

    public static bool ContainsBenchUnlockMarker(ReadOnlySpan<byte> response) =>
        response.IndexOf("ATAT"u8) >= 0 || response.IndexOf("MHDun"u8) >= 0;

    public static bool HasDirectBenchUnlockMarker(ReadOnlySpan<byte> response) =>
        response.Length >= 5 && response[0] == 0x63 &&
        response[1] == 0 && response[2] == 0 && response[3] == 0 && response[4] != 0;

    public static bool HasFemtoCustomMarker(ReadOnlySpan<byte> response) =>
        response.Length >= 7 && response.Slice(3, 4).SequenceEqual("1769"u8);

    public static int ParseBootControlVersion(ReadOnlySpan<byte> response)
    {
        if (response.Length < 4 || response[0] != 0x62 || response[1] != 0x40 || response[2] != 0x98)
        {
            throw new InvalidDataException($"MHD BOOTCTRL_V response is invalid: {Convert.ToHexString(response)}.");
        }

        var text = Encoding.ASCII.GetString(response[3..]);
        const string marker = "BOOTCTRL_V";
        var markerIndex = text.IndexOf(marker, StringComparison.Ordinal);
        if (markerIndex < 0)
        {
            throw new InvalidDataException($"MHD BOOTCTRL_V marker is absent from 4098: {Convert.ToHexString(response)}.");
        }

        var versionStart = markerIndex + marker.Length;
        var versionEnd = text.IndexOf('/', versionStart);
        if (versionEnd < 0) versionEnd = text.Length;
        var components = text[versionStart..versionEnd].TrimStart('_', ' ', 'V', 'v').Split('.');
        if (components.Length < 3 || components.Take(3).Any(component => !byte.TryParse(component, out _)))
        {
            throw new InvalidDataException($"MHD BOOTCTRL_V version is invalid: {text}.");
        }

        return (byte.Parse(components[0]) << 16) |
               (byte.Parse(components[1]) << 8) |
               byte.Parse(components[2]);
    }

    public static MhdFgUnlockStatus ClassifyFemtoRegionResponse(ReadOnlySpan<byte> response, bool hasPrg)
    {
        if (response.Length >= 1 && response[0] == 0x63)
        {
            return MhdFgUnlockStatus.Locked;
        }

        if (response.Length >= 2 && response[0] == 0x7F && response[1] == 0x23)
        {
            return hasPrg ? MhdFgUnlockStatus.FemtoMhd : MhdFgUnlockStatus.Locked;
        }

        throw new InvalidDataException(
            $"MHD could not classify the FG unlock profile from 0x80780000 response {Convert.ToHexString(response)}.");
    }

    private static MhdFgDmeProfile Profile(MhdFgUnlockStatus status, int version, MhdFgUif uif, string evidence) =>
        new(status, version, uif.Btld.SgbmNumber, uif.HasPrg, evidence);

    private async Task<byte[]> RequestRequiredAsync(
        byte[] request,
        int attempts,
        CancellationToken cancellationToken)
    {
        byte[] response = [];
        for (var attempt = 0; attempt < attempts; attempt++)
        {
            try
            {
                response = await _client.RequestRawAsync(
                    request,
                    TimeSpan.FromMilliseconds(300),
                    TimeSpan.FromSeconds(10),
                    cancellationToken).ConfigureAwait(false);
                if (response.Length > 0) return response;
            }
            catch (TimeoutException) when (attempt + 1 < attempts)
            {
            }
        }

        throw new TimeoutException($"MHD FG profile request {Convert.ToHexString(request)} returned no response after {attempts} attempts.");
    }
}
