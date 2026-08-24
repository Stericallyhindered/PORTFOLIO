using System.Text.Json;

namespace Redline.Calibration.Diagnostics;

public interface IUdsDiagnosticTransport
{
    Task<byte[]> RequestAsync(ReadOnlyMemory<byte> request, TimeSpan responseTimeout, TimeSpan pendingTimeout, CancellationToken cancellationToken = default);
}

public sealed record DmeIdentifierResponse(string Identifier, byte[] Request, byte[]? Response, string? Failure);

public sealed record DmeInterrogationResult(DateTimeOffset StartedAt, DateTimeOffset CompletedAt, IReadOnlyList<DmeIdentifierResponse> Responses)
{
    public bool Succeeded => Responses.Count > 0 && Responses.All(response => response.Failure is null);
}

public static class Mg1DmeInterrogation
{
    private static readonly (string Name, byte[] Request)[] Reads =
    [
        ("DME software identity 3010", [0x22, 0x30, 0x10]),
        ("DME software identity 3020", [0x22, 0x30, 0x20]),
        ("DME software identity 3030", [0x22, 0x30, 0x30]),
        ("DME software identity 3031", [0x22, 0x30, 0x31]),
        ("DME software identity 3032", [0x22, 0x30, 0x32]),
        ("DME profile identity 37FE", [0x22, 0x37, 0xFE])
    ];

    public static async Task<DmeInterrogationResult> ReadAsync(
        IUdsDiagnosticTransport transport,
        TimeSpan responseTimeout,
        TimeSpan pendingTimeout,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transport);
        var startedAt = DateTimeOffset.UtcNow;
        var responses = new List<DmeIdentifierResponse>(Reads.Length);
        foreach (var read in Reads)
        {
            try
            {
                var response = await transport.RequestAsync(read.Request, responseTimeout, pendingTimeout, cancellationToken).ConfigureAwait(false);
                if (response.Length < 3 || response[0] != 0x62 || response[1] != read.Request[1] || response[2] != read.Request[2])
                {
                    responses.Add(new DmeIdentifierResponse(read.Name, read.Request, response, "DME response did not match the requested identifier."));
                    continue;
                }

                responses.Add(new DmeIdentifierResponse(read.Name, read.Request, response, null));
            }
            catch (Exception exception) when (exception is TimeoutException or UdsDiagnosticException)
            {
                responses.Add(new DmeIdentifierResponse(read.Name, read.Request, null, exception.Message));
            }
        }

        return new DmeInterrogationResult(startedAt, DateTimeOffset.UtcNow, responses);
    }
}

public sealed record DmeTranscriptEntry(DateTimeOffset At, UdsTrafficDirection Direction, byte[] Payload);

public sealed record DmeSessionTranscript(
    Guid Id,
    DateTimeOffset CreatedAt,
    string AdapterEndpoint,
    string? AdapterVin,
    IReadOnlyList<DmeTranscriptEntry> Traffic,
    DmeInterrogationResult? Interrogation);

public sealed class DmeTranscriptStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private readonly string _root;

    public DmeTranscriptStore(string root)
    {
        _root = Path.GetFullPath(root);
        Directory.CreateDirectory(_root);
    }

    public string CreatePath(Guid id) => Path.Combine(_root, $"{id:N}.gcal-dme-session.json");

    public async Task SaveAsync(DmeSessionTranscript transcript, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transcript);
        var path = CreatePath(transcript.Id);
        var temporaryPath = path + ".tmp";
        await using (var stream = File.Create(temporaryPath))
        {
            await JsonSerializer.SerializeAsync(stream, transcript, JsonOptions, cancellationToken).ConfigureAwait(false);
            await stream.FlushAsync(cancellationToken).ConfigureAwait(false);
        }

        File.Move(temporaryPath, path, true);
    }
}
