using System.Buffers.Binary;
using System.Security.Cryptography;

namespace Redline.Calibration.Diagnostics;

public enum MhdCommunicationMode
{
    Ci,
    Ct
}

public sealed record MhdCommunicationProfile(
    MhdCommunicationMode Mode,
    byte[] TesterPresent,
    byte[] RequestDownloadTemplate,
    int AddressOffset,
    int LengthOffset,
    byte[] TransferExitTemplate,
    int BlockCounterBytes,
    byte[] EraseRoutine)
{
    public static MhdCommunicationProfile Ci { get; } = new(
        MhdCommunicationMode.Ci,
        [0x3E, 0x01],
        [0x34, 0x80, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00],
        1,
        6,
        [0x37, 0x80, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00],
        1,
        [0x31, 0x02, 0x80, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00]);

    public static MhdCommunicationProfile Ct { get; } = new(
        MhdCommunicationMode.Ct,
        [0x3E, 0x00],
        [0x34, 0x00, 0x44, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00],
        3,
        7,
        [0x37],
        1,
        [0x31, 0x02, 0x80, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00]);
}

public sealed record MhdFlashSectionDefinition(string Name, uint Address, int SourceOffset, int Length);

public enum MhdFgUnlockStatus
{
    Locked = 0,
    BenchUnlocked = 1,
    FemtoMhd = 2,
    FemtoCustom = 3
}

public static class MhdB58Gen2FlashProfile
{
    public const int BinLength = 0x800000;
    public const string M1SoftwareFamily = "b58tu1_M1";
    public const string O1SoftwareFamily = "b58tu1_O1";

    public static IReadOnlyList<MhdFlashSectionDefinition> NormalSections { get; } =
    [
        new("BTLD", 0x80028100, 0x28100, 0x37F00),
        new("PRG", 0x80080100, 0x80100, 0x67FEE0),
        new("CAL", 0x80700100, 0x700100, 0xFFEE0)
    ];

    public static MhdFlashSectionDefinition FemtoMhdCalSection { get; } =
        new("CAL", 0x80700100, 0x700100, 0xFFF00);

    public static MhdFlashSectionDefinition FemtoCustomCalSection { get; } =
        new("CAL", 0x80700100, 0x700100, 0xFFEE0);

    private static readonly byte[] FemtoMhdTail = Convert.FromHexString(
        "FEAFEDFE000000000000000000000000000000000000000000000000BB820E18");

    public static IReadOnlyList<FlashSection> BuildSections(
        ReadOnlySpan<byte> bin,
        MhdFgUnlockStatus unlockStatus = MhdFgUnlockStatus.Locked)
    {
        var bytes = PrepareImage(bin, unlockStatus);
        var definitions = GetSectionDefinitions(unlockStatus);

        return definitions.Select(section => FlashTransactionJournalStore.CreateSection(
            section.Name,
            section.Address,
            section.SourceOffset,
            bytes.AsSpan(section.SourceOffset, section.Length))).ToArray();
    }

    public static byte[] PrepareImage(
        ReadOnlySpan<byte> bin,
        MhdFgUnlockStatus unlockStatus = MhdFgUnlockStatus.Locked)
    {
        if (bin.Length != BinLength)
        {
            throw new InvalidDataException($"MHD B58 Gen 2 BIN must be exactly {BinLength:N0} bytes; received {bin.Length:N0}.");
        }

        _ = GetSectionDefinitions(unlockStatus);
        var bytes = bin.ToArray();
        if (unlockStatus == MhdFgUnlockStatus.FemtoMhd)
        {
            FemtoMhdTail.CopyTo(bytes, 0x7FFFE0);
        }
        return bytes;
    }

    private static IReadOnlyList<MhdFlashSectionDefinition> GetSectionDefinitions(MhdFgUnlockStatus unlockStatus) =>
        unlockStatus switch
        {
            MhdFgUnlockStatus.Locked or MhdFgUnlockStatus.BenchUnlocked => NormalSections,
            MhdFgUnlockStatus.FemtoMhd => [FemtoMhdCalSection],
            MhdFgUnlockStatus.FemtoCustom => [FemtoCustomCalSection],
            _ => throw new InvalidDataException($"Unsupported MHD FG unlock status {(int)unlockStatus}.")
        };

    public static byte[] BuildFgEraseRequest(string sectionName)
    {
        var selector = sectionName switch
        {
            "BTLD" => new byte[] { 0x80, 0x05, 0xFD, 0x00 },
            "PRG" => new byte[] { 0x80, 0x6F, 0xFD, 0x00 },
            "CAL" => new byte[] { 0x80, 0x7F, 0xFD, 0x00 },
            _ => throw new InvalidDataException($"MHD B58 Gen 2 has no FG erase selector for section {sectionName}.")
        };
        var request = new byte[] { 0x31, 0x01, 0xFF, 0x00, 0x02, 0x40, 0, 0, 0, 0 };
        selector.CopyTo(request, 6);
        return request;
    }

    public static byte[] BuildFgVerifyRequest(string sectionName)
    {
        var selector = sectionName switch
        {
            "BTLD" => new byte[] { 0x80, 0x05, 0xFD, 0x00 },
            "PRG" => new byte[] { 0x80, 0x6F, 0xFD, 0x00 },
            "CAL" => new byte[] { 0x80, 0x7F, 0xFD, 0x00 },
            _ => throw new InvalidDataException($"MHD B58 Gen 2 has no FG verification selector for section {sectionName}.")
        };
        var request = new byte[] { 0x31, 0x01, 0x02, 0x02, 0x12, 0x40, 0, 0, 0, 0, 0, 0 };
        selector.CopyTo(request, 6);
        return request;
    }
}

public sealed record MhdFlashProgress(string Stage, string Section, int SectionIndex, int SectionCount, int BytesSent, int SectionBytes);

public sealed record MhdFlashResult(Guid JournalId, IReadOnlyList<FlashSection> Sections, string InputSha256);

public sealed class MhdB58Gen2Flasher
{
    private readonly BmwEnetUdsClient _client;
    private readonly FlashTransactionJournalStore _journalStore;

    public MhdB58Gen2Flasher(BmwEnetUdsClient client, FlashTransactionJournalStore journalStore)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _journalStore = journalStore ?? throw new ArgumentNullException(nameof(journalStore));
    }

    public async Task<MhdFlashResult> FlashAsync(
        ReadOnlyMemory<byte> bin,
        string targetVin,
        string targetSoftwareId,
        MhdCommunicationProfile communication,
        string backupBinPath,
        MhdFgUnlockStatus unlockStatus,
        IProgress<MhdFlashProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(targetVin);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetSoftwareId);
        ArgumentException.ThrowIfNullOrWhiteSpace(backupBinPath);
        ArgumentNullException.ThrowIfNull(communication);

        var preparedBin = MhdB58Gen2FlashProfile.PrepareImage(bin.Span, unlockStatus);
        var sections = MhdB58Gen2FlashProfile.BuildSections(preparedBin, unlockStatus);
        var inputHash = Convert.ToHexString(SHA256.HashData(bin.Span));
        var journalId = Guid.NewGuid();
        var journal = new FlashTransactionJournal(
            journalId,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow,
            FlashTransactionState.Created,
            targetVin,
            targetSoftwareId,
            inputHash,
            backupBinPath,
            sections,
            -1,
            0,
            null);

        try
        {
            await _journalStore.SaveAsync(journal, cancellationToken).ConfigureAwait(false);
            await ValidateAndBackupAsync(bin, backupBinPath, cancellationToken).ConfigureAwait(false);
            journal = journal with { State = FlashTransactionState.BackedUp };
            await _journalStore.SaveAsync(journal, cancellationToken).ConfigureAwait(false);

            progress?.Report(new("AUTHENTICATING", string.Empty, -1, sections.Count, 0, 0));
            await new MhdFgProgrammingSession(_client).EnterAndAuthorizeAsync(cancellationToken).ConfigureAwait(false);

            for (var sectionIndex = 0; sectionIndex < sections.Count; sectionIndex++)
            {
                var section = sections[sectionIndex];
                journal = journal with { State = FlashTransactionState.Programming, ActiveSectionIndex = sectionIndex, ConfirmedTransferBlock = 0 };
                await _journalStore.SaveAsync(journal, cancellationToken).ConfigureAwait(false);

                progress?.Report(new("ERASING", section.Name, sectionIndex, sections.Count, 0, section.Length));
                await EraseAsync(communication, section, cancellationToken).ConfigureAwait(false);

                progress?.Report(new("REQUEST_DOWNLOAD", section.Name, sectionIndex, sections.Count, 0, section.Length));
                await RequestDownloadAsync(communication, section, cancellationToken).ConfigureAwait(false);

                var options = communication.Mode == MhdCommunicationMode.Ct
                    ? UdsFlashTransferOptions.MhdCtDefaults
                    : UdsFlashTransferOptions.MhdCiDefaults;
                options = options with { TransferExitRequest = communication.TransferExitTemplate };
                var transfer = new UdsFlashTransfer(new BmwEnetUdsFlashTransport(_client));
                var sectionBytes = preparedBin.AsMemory(section.SourceOffset, section.Length);
                await transfer.TransferAsync(
                    sectionBytes,
                    options,
                    (sent, total) => progress?.Report(new("TRANSFER", section.Name, sectionIndex, sections.Count, sent, total)),
                    cancellationToken).ConfigureAwait(false);

                journal = journal with { ConfirmedTransferBlock = (section.Length + options.BlockPayloadBytes - 1) / options.BlockPayloadBytes };
                await _journalStore.SaveAsync(journal, cancellationToken).ConfigureAwait(false);

                progress?.Report(new("VERIFY", section.Name, sectionIndex, sections.Count, section.Length, section.Length));
                await VerifySectionAsync(section, cancellationToken).ConfigureAwait(false);
            }

            progress?.Report(new("RESET", string.Empty, sections.Count, sections.Count, 0, 0));
            await ResetAsync(cancellationToken).ConfigureAwait(false);
            journal = journal with { State = FlashTransactionState.Completed, ActiveSectionIndex = sections.Count - 1 };
            await _journalStore.SaveAsync(journal, cancellationToken).ConfigureAwait(false);
            return new MhdFlashResult(journalId, sections, inputHash);
        }
        catch (Exception exception)
        {
            journal = journal with { State = exception is OperationCanceledException ? FlashTransactionState.RecoveryRequired : FlashTransactionState.Failed, FailureDetail = exception.ToString() };
            await _journalStore.SaveAsync(journal, CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    private static async Task ValidateAndBackupAsync(ReadOnlyMemory<byte> bin, string backupBinPath, CancellationToken cancellationToken)
    {
        var path = Path.GetFullPath(backupBinPath);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temporaryPath = path + ".tmp";
        await File.WriteAllBytesAsync(temporaryPath, bin.ToArray(), cancellationToken).ConfigureAwait(false);
        File.Move(temporaryPath, path, true);
    }

    private async Task EraseAsync(MhdCommunicationProfile communication, FlashSection section, CancellationToken cancellationToken)
    {
        if (communication.Mode != MhdCommunicationMode.Ct)
        {
            throw new NotSupportedException("The B58 Gen 2 ENET profile requires the MHD CT command object.");
        }

        var request = MhdB58Gen2FlashProfile.BuildFgEraseRequest(section.Name);
        await SendFgTesterPresentAsync(cancellationToken).ConfigureAwait(false);
        var response = await RequestRawWithAttemptsAsync(request, TimeSpan.FromMilliseconds(300), 2, cancellationToken).ConfigureAwait(false);
        if (!response.AsSpan().SequenceEqual(new byte[] { 0x71, 0x01, 0xFF, 0x00, 0x00 }))
        {
            throw new UdsDiagnosticException($"MHD FG erase failed for {section.Name}; response {Convert.ToHexString(response)}.", 0x31);
        }

        await SendFgTesterPresentAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task SendFgTesterPresentAsync(CancellationToken cancellationToken)
    {
        await _client.SendWithoutResponseAsync(new byte[] { 0x3E, 0x80 }, 0xDF, cancellationToken).ConfigureAwait(false);
        await Task.Delay(TimeSpan.FromMilliseconds(50), cancellationToken).ConfigureAwait(false);
    }

    private async Task<byte[]> RequestRawWithAttemptsAsync(
        ReadOnlyMemory<byte> request,
        TimeSpan responseTimeout,
        int attempts,
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < attempts; attempt++)
        {
            try
            {
                var response = await _client.RequestRawAsync(
                    request,
                    responseTimeout,
                    TimeSpan.FromSeconds(10),
                    cancellationToken).ConfigureAwait(false);
                if (response.Length > 0) return response;
            }
            catch (TimeoutException) when (attempt + 1 < attempts)
            {
            }
        }

        return [];
    }

    private async Task RequestDownloadAsync(MhdCommunicationProfile communication, FlashSection section, CancellationToken cancellationToken)
    {
        var request = (byte[])communication.RequestDownloadTemplate.Clone();
        BinaryPrimitives.WriteUInt32BigEndian(request.AsSpan(communication.AddressOffset, 4), section.Address);
        BinaryPrimitives.WriteUInt32BigEndian(request.AsSpan(communication.LengthOffset, 4), checked((uint)section.Length));
        var response = await RequestRawWithAttemptsAsync(
            request,
            TimeSpan.FromSeconds(1),
            40,
            cancellationToken).ConfigureAwait(false);
        if (response.Length > 0 && response[0] == 0x7F)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(50), cancellationToken).ConfigureAwait(false);
            response = await RequestRawWithAttemptsAsync(
                request,
                TimeSpan.FromMilliseconds(500),
                3,
                cancellationToken).ConfigureAwait(false);
        }
        if (response.Length < 1 || response[0] != 0x74)
        {
            throw new UdsDiagnosticException(
                $"MHD request-download failed for {section.Name}; response {Convert.ToHexString(response)}.",
                0x34);
        }
    }

    private async Task VerifySectionAsync(FlashSection section, CancellationToken cancellationToken)
    {
        var request = MhdB58Gen2FlashProfile.BuildFgVerifyRequest(section.Name);
        var response = await RequestRawWithAttemptsAsync(request, TimeSpan.FromMilliseconds(1250), 4, cancellationToken).ConfigureAwait(false);

        await SendFgTesterPresentAsync(cancellationToken).ConfigureAwait(false);

        if (response.Length != 5 || response[0] != 0x71 || response[4] != 0)
        {
            throw new UdsDiagnosticException(
                $"MHD FG section validation failed for {section.Name}; response {Convert.ToHexString(response)}.",
                0x31);
        }

        // MHD returns immediately for PRG after the successful FG verification routine.
        if (section.Name == "PRG")
        {
            return;
        }

        var status = await RequestRawWithAttemptsAsync(
            new byte[] { 0x31, 0x01, 0xFF, 0x01 },
            TimeSpan.FromMilliseconds(1250),
            4,
            cancellationToken).ConfigureAwait(false);
        if (status.Length != 5 || status[0] != 0x71 || status[4] != 1)
        {
            throw new UdsDiagnosticException(
                $"MHD FG programming-status validation failed for {section.Name}; response {Convert.ToHexString(status)}.",
                0x31);
        }
    }

    private async Task ResetAsync(CancellationToken cancellationToken)
    {
        await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);
        _ = await RequestRawWithAttemptsAsync(
            new byte[] { 0x11, 0x01 },
            TimeSpan.FromMilliseconds(300),
            4,
            cancellationToken).ConfigureAwait(false);
        await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken).ConfigureAwait(false);
        await SendFgTesterPresentAsync(cancellationToken).ConfigureAwait(false);
    }
}
