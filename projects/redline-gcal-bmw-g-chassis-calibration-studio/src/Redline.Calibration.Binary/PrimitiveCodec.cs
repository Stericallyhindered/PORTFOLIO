using System.Buffers.Binary;

namespace Redline.Calibration.Binary;

public static class PrimitiveCodec
{
    public static double Read(ReadOnlySpan<byte> source, BinaryEncoding encoding)
    {
        EnsureLength(source, encoding.SizeBytes);
        var littleEndian = encoding.ByteOrder == BinaryByteOrder.LittleEndian;

        return encoding.ValueKind switch
        {
            BinaryValueKind.UnsignedInteger => ReadUnsigned(source, encoding.SizeBits, littleEndian),
            BinaryValueKind.SignedInteger => ReadSigned(source, encoding.SizeBits, littleEndian),
            BinaryValueKind.Ieee754Float => ReadFloat(source, encoding.SizeBits, littleEndian),
            _ => throw new ArgumentOutOfRangeException(nameof(encoding))
        };
    }

    public static byte[] Encode(double value, BinaryEncoding encoding)
    {
        var destination = new byte[encoding.SizeBytes];
        var littleEndian = encoding.ByteOrder == BinaryByteOrder.LittleEndian;

        switch (encoding.ValueKind)
        {
            case BinaryValueKind.UnsignedInteger:
                WriteUnsigned(destination, value, encoding.SizeBits, littleEndian);
                break;
            case BinaryValueKind.SignedInteger:
                WriteSigned(destination, value, encoding.SizeBits, littleEndian);
                break;
            case BinaryValueKind.Ieee754Float:
                WriteFloat(destination, value, encoding.SizeBits, littleEndian);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(encoding));
        }

        return destination;
    }

    private static ulong ReadUnsigned(ReadOnlySpan<byte> source, int sizeBits, bool littleEndian) => sizeBits switch
    {
        8 => source[0],
        16 => littleEndian ? BinaryPrimitives.ReadUInt16LittleEndian(source) : BinaryPrimitives.ReadUInt16BigEndian(source),
        32 => littleEndian ? BinaryPrimitives.ReadUInt32LittleEndian(source) : BinaryPrimitives.ReadUInt32BigEndian(source),
        64 => littleEndian ? BinaryPrimitives.ReadUInt64LittleEndian(source) : BinaryPrimitives.ReadUInt64BigEndian(source),
        _ => throw new NotSupportedException($"A {sizeBits}-bit integer is not supported.")
    };

    private static long ReadSigned(ReadOnlySpan<byte> source, int sizeBits, bool littleEndian) => sizeBits switch
    {
        8 => unchecked((sbyte)source[0]),
        16 => littleEndian ? BinaryPrimitives.ReadInt16LittleEndian(source) : BinaryPrimitives.ReadInt16BigEndian(source),
        32 => littleEndian ? BinaryPrimitives.ReadInt32LittleEndian(source) : BinaryPrimitives.ReadInt32BigEndian(source),
        64 => littleEndian ? BinaryPrimitives.ReadInt64LittleEndian(source) : BinaryPrimitives.ReadInt64BigEndian(source),
        _ => throw new NotSupportedException($"A {sizeBits}-bit integer is not supported.")
    };

    private static double ReadFloat(ReadOnlySpan<byte> source, int sizeBits, bool littleEndian) => sizeBits switch
    {
        32 => BitConverter.Int32BitsToSingle(littleEndian
            ? BinaryPrimitives.ReadInt32LittleEndian(source)
            : BinaryPrimitives.ReadInt32BigEndian(source)),
        64 => BitConverter.Int64BitsToDouble(littleEndian
            ? BinaryPrimitives.ReadInt64LittleEndian(source)
            : BinaryPrimitives.ReadInt64BigEndian(source)),
        _ => throw new NotSupportedException($"A {sizeBits}-bit IEEE-754 value is not supported.")
    };

    private static void WriteUnsigned(Span<byte> destination, double value, int sizeBits, bool littleEndian)
    {
        EnsureFiniteWholeNumber(value);
        var maximum = sizeBits == 64 ? ulong.MaxValue : (1UL << sizeBits) - 1;
        if (value < 0 || value > maximum)
        {
            throw new OverflowException($"{value} cannot be represented as an unsigned {sizeBits}-bit integer.");
        }

        var converted = checked((ulong)value);
        switch (sizeBits)
        {
            case 8:
                destination[0] = (byte)converted;
                break;
            case 16:
                if (littleEndian) BinaryPrimitives.WriteUInt16LittleEndian(destination, (ushort)converted);
                else BinaryPrimitives.WriteUInt16BigEndian(destination, (ushort)converted);
                break;
            case 32:
                if (littleEndian) BinaryPrimitives.WriteUInt32LittleEndian(destination, (uint)converted);
                else BinaryPrimitives.WriteUInt32BigEndian(destination, (uint)converted);
                break;
            case 64:
                if (littleEndian) BinaryPrimitives.WriteUInt64LittleEndian(destination, converted);
                else BinaryPrimitives.WriteUInt64BigEndian(destination, converted);
                break;
            default:
                throw new NotSupportedException($"A {sizeBits}-bit integer is not supported.");
        }
    }

    private static void WriteSigned(Span<byte> destination, double value, int sizeBits, bool littleEndian)
    {
        EnsureFiniteWholeNumber(value);
        var minimum = sizeBits == 64 ? long.MinValue : -(1L << (sizeBits - 1));
        var maximum = sizeBits == 64 ? long.MaxValue : (1L << (sizeBits - 1)) - 1;
        if (value < minimum || value > maximum)
        {
            throw new OverflowException($"{value} cannot be represented as a signed {sizeBits}-bit integer.");
        }

        var converted = checked((long)value);
        switch (sizeBits)
        {
            case 8:
                destination[0] = unchecked((byte)(sbyte)converted);
                break;
            case 16:
                if (littleEndian) BinaryPrimitives.WriteInt16LittleEndian(destination, (short)converted);
                else BinaryPrimitives.WriteInt16BigEndian(destination, (short)converted);
                break;
            case 32:
                if (littleEndian) BinaryPrimitives.WriteInt32LittleEndian(destination, (int)converted);
                else BinaryPrimitives.WriteInt32BigEndian(destination, (int)converted);
                break;
            case 64:
                if (littleEndian) BinaryPrimitives.WriteInt64LittleEndian(destination, converted);
                else BinaryPrimitives.WriteInt64BigEndian(destination, converted);
                break;
            default:
                throw new NotSupportedException($"A {sizeBits}-bit integer is not supported.");
        }
    }

    private static void WriteFloat(Span<byte> destination, double value, int sizeBits, bool littleEndian)
    {
        if (!double.IsFinite(value))
        {
            throw new ArgumentOutOfRangeException(nameof(value), "Calibration values must be finite.");
        }

        switch (sizeBits)
        {
            case 32:
                var singleBits = BitConverter.SingleToInt32Bits(checked((float)value));
                if (littleEndian) BinaryPrimitives.WriteInt32LittleEndian(destination, singleBits);
                else BinaryPrimitives.WriteInt32BigEndian(destination, singleBits);
                break;
            case 64:
                var doubleBits = BitConverter.DoubleToInt64Bits(value);
                if (littleEndian) BinaryPrimitives.WriteInt64LittleEndian(destination, doubleBits);
                else BinaryPrimitives.WriteInt64BigEndian(destination, doubleBits);
                break;
            default:
                throw new NotSupportedException($"A {sizeBits}-bit IEEE-754 value is not supported.");
        }
    }

    private static void EnsureFiniteWholeNumber(double value)
    {
        if (!double.IsFinite(value) || value != Math.Truncate(value))
        {
            throw new ArgumentOutOfRangeException(nameof(value), "Integer encodings require a finite whole number.");
        }
    }

    private static void EnsureLength(ReadOnlySpan<byte> source, int required)
    {
        if (source.Length < required)
        {
            throw new ArgumentException($"The source contains {source.Length} bytes; {required} are required.", nameof(source));
        }
    }
}

