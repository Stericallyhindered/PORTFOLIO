namespace Redline.Calibration.Binary;

public enum BinaryByteOrder
{
    LittleEndian,
    BigEndian
}

public enum BinaryValueKind
{
    UnsignedInteger,
    SignedInteger,
    Ieee754Float
}

public sealed record BinaryEncoding(
    BinaryValueKind ValueKind,
    int SizeBits,
    BinaryByteOrder ByteOrder)
{
    public int SizeBytes
    {
        get
        {
            if (SizeBits is not (8 or 16 or 32 or 64))
            {
                throw new NotSupportedException($"A {SizeBits}-bit binary value is not supported.");
            }

            if (ValueKind == BinaryValueKind.Ieee754Float && SizeBits is not (32 or 64))
            {
                throw new NotSupportedException("IEEE-754 values must be 32 or 64 bits.");
            }

            return SizeBits / 8;
        }
    }
}

