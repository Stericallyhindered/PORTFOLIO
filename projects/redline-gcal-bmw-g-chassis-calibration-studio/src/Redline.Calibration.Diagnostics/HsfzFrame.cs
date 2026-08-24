using System.Buffers.Binary;

namespace Redline.Calibration.Diagnostics;

public enum HsfzMessageType : ushort
{
    Diagnostic = 0x0001,
    AcknowledgeTransfer = 0x0002,
    Terminal15 = 0x0010,
    VehicleIdentification = 0x0011,
    AliveCheck = 0x0012,
    AliveCheckResponse = 0x0013,
    IncorrectTesterAddress = 0x0040,
    OutOfMemory = 0x00FF
}

public sealed record HsfzFrame(HsfzMessageType Type, byte[] Body)
{
    public const int HeaderLength = 6;

    public static HsfzFrame Diagnostic(byte source, byte destination, ReadOnlySpan<byte> udsPayload)
    {
        var body = new byte[udsPayload.Length + 2];
        body[0] = source;
        body[1] = destination;
        udsPayload.CopyTo(body.AsSpan(2));
        return new HsfzFrame(HsfzMessageType.Diagnostic, body);
    }

    public static HsfzFrame AliveCheck(byte testerAddress = 0xF4, byte gatewayAddress = 0x10) =>
        new(HsfzMessageType.AliveCheck, new[] { testerAddress, gatewayAddress });

    public static HsfzFrame AliveCheckResponse(byte testerAddress = 0xF4, byte gatewayAddress = 0x10) =>
        new(HsfzMessageType.AliveCheckResponse, new[] { testerAddress, gatewayAddress });

    public byte[] Serialize()
    {
        var frame = new byte[HeaderLength + Body.Length];
        BinaryPrimitives.WriteUInt32BigEndian(frame, checked((uint)Body.Length));
        BinaryPrimitives.WriteUInt16BigEndian(frame.AsSpan(4), (ushort)Type);
        Body.CopyTo(frame, HeaderLength);
        return frame;
    }

    public static bool TryParse(ReadOnlySpan<byte> data, out HsfzFrame? frame)
    {
        frame = null;
        if (data.Length < HeaderLength)
        {
            return false;
        }

        var bodyLength = BinaryPrimitives.ReadUInt32BigEndian(data);
        if (bodyLength > int.MaxValue || data.Length != HeaderLength + (int)bodyLength)
        {
            return false;
        }

        frame = new HsfzFrame(
            (HsfzMessageType)BinaryPrimitives.ReadUInt16BigEndian(data.Slice(4, 2)),
            data.Slice(HeaderLength).ToArray());
        return true;
    }
}
