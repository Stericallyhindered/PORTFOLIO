using Redline.Calibration.Binary;

namespace Redline.Calibration.Tests;

public sealed class PrimitiveCodecTests
{
    [Theory]
    [InlineData(BinaryValueKind.UnsignedInteger, 16, BinaryByteOrder.LittleEndian, 4660, "3412")]
    [InlineData(BinaryValueKind.UnsignedInteger, 16, BinaryByteOrder.BigEndian, 4660, "1234")]
    [InlineData(BinaryValueKind.SignedInteger, 16, BinaryByteOrder.LittleEndian, -2, "FEFF")]
    [InlineData(BinaryValueKind.SignedInteger, 32, BinaryByteOrder.BigEndian, -100000, "FFFE7960")]
    public void Integer_values_round_trip(
        BinaryValueKind kind,
        int sizeBits,
        BinaryByteOrder byteOrder,
        double value,
        string expectedHex)
    {
        var encoding = new BinaryEncoding(kind, sizeBits, byteOrder);

        var bytes = PrimitiveCodec.Encode(value, encoding);

        Assert.Equal(expectedHex, Convert.ToHexString(bytes));
        Assert.Equal(value, PrimitiveCodec.Read(bytes, encoding));
    }

    [Theory]
    [InlineData(32, BinaryByteOrder.LittleEndian, 123.25)]
    [InlineData(32, BinaryByteOrder.BigEndian, -12.5)]
    [InlineData(64, BinaryByteOrder.LittleEndian, 123456.125)]
    public void Floating_point_values_round_trip(int sizeBits, BinaryByteOrder byteOrder, double value)
    {
        var encoding = new BinaryEncoding(BinaryValueKind.Ieee754Float, sizeBits, byteOrder);

        var decoded = PrimitiveCodec.Read(PrimitiveCodec.Encode(value, encoding), encoding);

        Assert.Equal(value, decoded, sizeBits == 32 ? 5 : 12);
    }

    [Fact]
    public void Integer_encoding_rejects_fractional_values()
    {
        var encoding = new BinaryEncoding(BinaryValueKind.UnsignedInteger, 16, BinaryByteOrder.LittleEndian);

        Assert.Throws<ArgumentOutOfRangeException>(() => PrimitiveCodec.Encode(1.5, encoding));
    }

    [Fact]
    public void Unsigned_encoding_rejects_overflow_instead_of_clamping()
    {
        var encoding = new BinaryEncoding(BinaryValueKind.UnsignedInteger, 8, BinaryByteOrder.LittleEndian);

        Assert.Throws<OverflowException>(() => PrimitiveCodec.Encode(256, encoding));
    }
}

