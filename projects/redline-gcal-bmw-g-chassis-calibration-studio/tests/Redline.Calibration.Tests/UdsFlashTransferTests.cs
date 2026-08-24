using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Tests;

public sealed class UdsFlashTransferTests
{
    [Fact]
    public async Task TransferAsync_UsesNumberedBlocksAndExitsAfterAcknowledgements()
    {
        var transport = new RecordingTransport();
        var progress = new List<(int Done, int Total)>();
        var transfer = new UdsFlashTransfer(transport);

        await transfer.TransferAsync(
            new byte[] { 1, 2, 3, 4, 5 },
            new UdsFlashTransferOptions(2, 1, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1), TimeSpan.Zero),
            (done, total) => progress.Add((done, total)));

        Assert.Equal(new byte[] { 0x36, 1, 1, 2 }, transport.Requests[0]);
        Assert.Equal(new byte[] { 0x36, 2, 3, 4 }, transport.Requests[1]);
        Assert.Equal(new byte[] { 0x36, 3, 5 }, transport.Requests[2]);
        Assert.Equal(new byte[] { 0x37 }, transport.Requests[3]);
        Assert.Equal(new[] { (2, 5), (4, 5), (5, 5) }, progress);
    }

    [Fact]
    public async Task TransferAsync_RetriesAnUnconfirmedBlockBeforeFailing()
    {
        var transport = new RecordingTransport
        {
            BlockResponses = new Queue<byte[]>([new byte[] { 0x76, 0x02 }, new byte[] { 0x76, 0x01 }])
        };
        var transfer = new UdsFlashTransfer(transport);

        await transfer.TransferAsync(
            new byte[] { 1 },
            new UdsFlashTransferOptions(8, 1, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1), TimeSpan.Zero));

        Assert.Equal(3, transport.Requests.Count);
        Assert.Equal(transport.Requests[0], transport.Requests[1]);
    }

    [Fact]
    public void MhdCtDefaults_MatchObservedEnetTransferLimits()
    {
        var options = UdsFlashTransferOptions.MhdCtDefaults;

        Assert.Equal(4093, options.BlockPayloadBytes);
        Assert.Equal(4, options.MaxBlockRetries);
        Assert.Equal(5, options.MaxBlockRetries + 1);
        Assert.Equal(1, options.BlockCounterBytes);
        Assert.Equal(10, options.MaxTransferExitAttempts);
        Assert.Equal(TimeSpan.FromMilliseconds(30), options.RetryBackoffStep);
        Assert.Equal(TimeSpan.Zero, options.InterBlockDelay);
        Assert.Equal(TimeSpan.FromSeconds(2), options.TesterPresentInterval);
        Assert.Equal(new byte[] { 0x3E, 0x80 }, options.TesterPresentRequest);
        Assert.Equal(0xDF, options.TesterPresentTarget);
        Assert.True(options.TesterPresentSuppressResponse);
        Assert.Equal(TimeSpan.FromMilliseconds(50), options.TesterPresentDelay);
        Assert.Equal(TimeSpan.FromMilliseconds(3), options.TransferExitDelay);
    }

    [Fact]
    public async Task TransferAsync_RetriesTransferExitUpToConfiguredBudget()
    {
        var transport = new RecordingTransport
        {
            ExitResponses = new Queue<object>(
            [
                new TimeoutException("first exit timed out"),
                new byte[] { 0x77 }
            ])
        };
        var transfer = new UdsFlashTransfer(transport);

        await transfer.TransferAsync(
            new byte[] { 1 },
            new UdsFlashTransferOptions(
                8,
                0,
                TimeSpan.FromSeconds(1),
                TimeSpan.FromSeconds(1),
                TimeSpan.Zero,
                MaxTransferExitAttempts: 2));

        Assert.Equal(2, transport.Requests.Count(request => request[0] == 0x37));
    }

    [Fact]
    public async Task JournalStore_RoundTripsWithoutLeavingTemporaryFile()
    {
        var root = Path.Combine(Path.GetTempPath(), $"gcal-journal-{Guid.NewGuid():N}");
        try
        {
            var store = new FlashTransactionJournalStore(root);
            var journal = new FlashTransactionJournal(
                Guid.NewGuid(), DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, FlashTransactionState.PreflightPassed,
                "WBA00000000000000", "00005D55504809", "A".PadLeft(64, 'A'), null,
                [FlashTransactionJournalStore.CreateSection("CAL", 0x700000, 0, new byte[] { 1, 2, 3 })],
                0, 0, null);

            await store.SaveAsync(journal);
            var loaded = await store.LoadAsync(journal.Id);

            Assert.NotNull(loaded);
            Assert.Equal(journal.Id, loaded!.Id);
            Assert.Equal("CAL", loaded.Sections.Single().Name);
            Assert.False(File.Exists(store.CreatePath(journal.Id) + ".tmp"));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, true);
        }
    }

    private sealed class RecordingTransport : IUdsFlashTransport
    {
        public List<byte[]> Requests { get; } = [];
        public Queue<byte[]> BlockResponses { get; set; } = new();
        public Queue<object> ExitResponses { get; set; } = new();

        public Task<byte[]> RequestAsync(ReadOnlyMemory<byte> payload, TimeSpan timeout, TimeSpan pendingTimeout, CancellationToken cancellationToken)
        {
            var request = payload.ToArray();
            Requests.Add(request);
            if (request[0] == 0x37)
            {
                if (ExitResponses.TryDequeue(out var exit))
                {
                    return exit is Exception exception
                        ? Task.FromException<byte[]>(exception)
                        : Task.FromResult((byte[])exit);
                }
                return Task.FromResult(new byte[] { 0x77 });
            }
            if (BlockResponses.TryDequeue(out var response)) return Task.FromResult(response);
            return Task.FromResult(new byte[] { 0x76, request[1] });
        }

        public Task SendWithoutResponseAsync(ReadOnlyMemory<byte> payload, byte ecuAddress, CancellationToken cancellationToken)
        {
            Requests.Add(payload.ToArray());
            return Task.CompletedTask;
        }
    }
}
