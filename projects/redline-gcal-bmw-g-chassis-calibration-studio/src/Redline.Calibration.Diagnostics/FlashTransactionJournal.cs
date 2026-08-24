using System.Security.Cryptography;
using System.Text.Json;

namespace Redline.Calibration.Diagnostics;

public enum FlashTransactionState
{
    Created,
    PreflightPassed,
    BackedUp,
    Programming,
    Verifying,
    Completed,
    RecoveryRequired,
    Failed
}

public sealed record FlashSection(
    string Name,
    uint Address,
    int SourceOffset,
    int Length,
    string Sha256);

public sealed record FlashTransactionJournal(
    Guid Id,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    FlashTransactionState State,
    string TargetVin,
    string TargetSoftwareId,
    string InputBinSha256,
    string? BackupBinPath,
    IReadOnlyList<FlashSection> Sections,
    int ActiveSectionIndex,
    int ConfirmedTransferBlock,
    string? FailureDetail);

public sealed class FlashTransactionJournalStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private readonly string _root;

    public FlashTransactionJournalStore(string root)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(root);
        _root = Path.GetFullPath(root);
        Directory.CreateDirectory(_root);
    }

    public string CreatePath(Guid id) => Path.Combine(_root, $"{id:N}.gcal-flash.json");

    public async Task SaveAsync(FlashTransactionJournal journal, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(journal);
        var path = CreatePath(journal.Id);
        var temporaryPath = path + ".tmp";
        var updated = journal with { UpdatedAt = DateTimeOffset.UtcNow };
        await using (var stream = File.Create(temporaryPath))
        {
            await JsonSerializer.SerializeAsync(stream, updated, JsonOptions, cancellationToken).ConfigureAwait(false);
            await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
        }

        File.Move(temporaryPath, path, true);
    }

    public async Task<FlashTransactionJournal?> LoadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var path = CreatePath(id);
        if (!File.Exists(path)) return null;
        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<FlashTransactionJournal>(stream, JsonOptions, cancellationToken).ConfigureAwait(false);
    }

    public static FlashSection CreateSection(string name, uint address, int sourceOffset, ReadOnlySpan<byte> bytes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (sourceOffset < 0) throw new ArgumentOutOfRangeException(nameof(sourceOffset));
        var hash = Convert.ToHexString(SHA256.HashData(bytes));
        return new FlashSection(name, address, sourceOffset, bytes.Length, hash);
    }
}
