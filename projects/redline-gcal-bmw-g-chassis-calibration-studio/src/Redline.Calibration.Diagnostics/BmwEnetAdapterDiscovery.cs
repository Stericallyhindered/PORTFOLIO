using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace Redline.Calibration.Diagnostics;

public sealed record BmwEnetAdapter(
    IPAddress Address,
    IPEndPoint DiscoveryEndpoint,
    DateTimeOffset DiscoveredAt,
    BmwEnetVehicleIdentity Identity,
    byte[] DiscoveryResponse)
{
    public const int DefaultDiscoveryPort = 6811;
    public const int DefaultDiagnosticPort = 6801;
}

public sealed record BmwEnetVehicleIdentity(string? Vin, string? MacAddress);

public static class BmwEnetAdapterDiscovery
{
    // MHD's adapter discovery probe. It is broadcast on each active IPv4 interface.
    public static ReadOnlyMemory<byte> Probe { get; } = new byte[] { 0, 0, 0, 0, 0, 0x11 };

    public static bool IsAdapterResponse(ReadOnlySpan<byte> response)
    {
        return TryParseVehicleIdentification(response, out _);
    }

    public static bool TryParseVehicleIdentification(ReadOnlySpan<byte> response, out BmwEnetVehicleIdentity? identity)
    {
        identity = null;
        if (!HsfzFrame.TryParse(response, out var frame) || frame is null ||
            frame.Type != HsfzMessageType.VehicleIdentification ||
            !frame.Body.AsSpan().StartsWith("DIAGADR10"u8))
        {
            return false;
        }

        var vin = ReadAsciiField(frame.Body, "BMWVIN"u8, 17);
        var mac = ReadAsciiField(frame.Body, "BMWMAC"u8, 12);
        identity = new BmwEnetVehicleIdentity(vin, mac);
        return true;
    }

    public static async Task<IReadOnlyList<BmwEnetAdapter>> DiscoverAsync(
        TimeSpan timeout,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(timeout, TimeSpan.Zero);

        using var socket = new UdpClient(AddressFamily.InterNetwork) { EnableBroadcast = true };
        socket.Client.Bind(new IPEndPoint(IPAddress.Any, 0));

        // Mirrors cc.cs in the MHD dump: send on each active interface and also
        // use the global broadcast, repeating the probe three times at 750 ms.
        var destinations = GetBroadcastAddresses()
            .Append(IPAddress.Broadcast)
            .Distinct()
            .Select(address => new IPEndPoint(address, BmwEnetAdapter.DefaultDiscoveryPort))
            .ToArray();
        for (var attempt = 0; attempt < 3; attempt++)
        {
            foreach (var destination in destinations)
            {
                await socket.SendAsync(Probe.ToArray(), destination, cancellationToken);
            }

            if (attempt < 2)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(750), cancellationToken);
            }
        }

        var discovered = new Dictionary<IPAddress, BmwEnetAdapter>();
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(timeout);

        try
        {
            while (true)
            {
                var result = await socket.ReceiveAsync(deadline.Token);
                if (!TryParseVehicleIdentification(result.Buffer, out var identity))
                {
                    continue;
                }

                discovered.TryAdd(
                    result.RemoteEndPoint.Address,
                    new BmwEnetAdapter(
                        result.RemoteEndPoint.Address,
                        result.RemoteEndPoint,
                        DateTimeOffset.UtcNow,
                        identity!,
                        result.Buffer));
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return discovered.Values.OrderBy(adapter => adapter.Address.ToString(), StringComparer.Ordinal).ToArray();
        }
    }

    private static string? ReadAsciiField(ReadOnlySpan<byte> source, ReadOnlySpan<byte> marker, int length)
    {
        var index = source.IndexOf(marker);
        if (index < 0 || source.Length < index + marker.Length + length)
        {
            return null;
        }

        return System.Text.Encoding.ASCII.GetString(source.Slice(index + marker.Length, length));
    }

    private static IEnumerable<IPAddress> GetBroadcastAddresses()
    {
        var addresses = new HashSet<IPAddress>();
        foreach (var networkInterface in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (networkInterface.OperationalStatus != OperationalStatus.Up ||
                networkInterface.NetworkInterfaceType == NetworkInterfaceType.Loopback)
            {
                continue;
            }

            foreach (var unicast in networkInterface.GetIPProperties().UnicastAddresses)
            {
                if (unicast.Address.AddressFamily != AddressFamily.InterNetwork || unicast.IPv4Mask is null)
                {
                    continue;
                }

                var addressBytes = unicast.Address.GetAddressBytes();
                var maskBytes = unicast.IPv4Mask.GetAddressBytes();
                var broadcast = new byte[4];
                for (var index = 0; index < broadcast.Length; index++)
                {
                    broadcast[index] = (byte)(addressBytes[index] | ~maskBytes[index]);
                }

                addresses.Add(new IPAddress(broadcast));
            }
        }

        return addresses;
    }
}
