using Redline.Calibration.Binary;

namespace Redline.Calibration.Definitions.Xdf;

public sealed class XdfScalarAccessor
{
    public double ReadConstant(CalibrationBinaryDocument binary, XdfConstantDefinition constant)
    {
        ArgumentNullException.ThrowIfNull(binary);
        ArgumentNullException.ThrowIfNull(constant);
        if (!constant.CanRead || !constant.Address.HasValue)
            throw new NotSupportedException($"Constant '{constant.Title}' is not readable: {string.Join(" ", constant.Limitations)}");
        var raw = binary.ReadValue(checked((int)constant.Address.Value), constant.Encoding);
        return constant.Transform?.Apply(raw) ?? raw;
    }

    public void WriteConstant(CalibrationBinaryDocument binary, XdfConstantDefinition constant, double engineeringValue)
    {
        ArgumentNullException.ThrowIfNull(binary);
        ArgumentNullException.ThrowIfNull(constant);
        if (!constant.CanWrite || !constant.Address.HasValue || constant.Transform is null)
            throw new NotSupportedException($"Constant '{constant.Title}' is not write-safe: {string.Join(" ", constant.Limitations)}");
        var raw = constant.Transform.Invert(engineeringValue);
        if (constant.Encoding.ValueKind != BinaryValueKind.Ieee754Float) raw = Math.Round(raw, MidpointRounding.AwayFromZero);
        binary.ApplyValue(checked((int)constant.Address.Value), raw, constant.Encoding, $"{constant.Title} = {engineeringValue}");
    }

    public bool ReadFlag(CalibrationBinaryDocument binary, XdfFlagDefinition flag)
    {
        ArgumentNullException.ThrowIfNull(binary);
        ArgumentNullException.ThrowIfNull(flag);
        if (!flag.CanRead || !flag.Address.HasValue)
            throw new NotSupportedException($"Flag '{flag.Title}' is not readable: {string.Join(" ", flag.Limitations)}");
        var raw = checked((ulong)binary.ReadValue(checked((int)flag.Address.Value), flag.Encoding));
        return (raw & flag.Mask) == flag.Mask;
    }

    public void WriteFlag(CalibrationBinaryDocument binary, XdfFlagDefinition flag, bool enabled)
    {
        ArgumentNullException.ThrowIfNull(binary);
        ArgumentNullException.ThrowIfNull(flag);
        if (!flag.CanWrite || !flag.Address.HasValue)
            throw new NotSupportedException($"Flag '{flag.Title}' is not write-safe: {string.Join(" ", flag.Limitations)}");
        var raw = checked((ulong)binary.ReadValue(checked((int)flag.Address.Value), flag.Encoding));
        var revised = enabled ? raw | flag.Mask : raw & ~flag.Mask;
        binary.ApplyValue(checked((int)flag.Address.Value), revised, flag.Encoding, $"{flag.Title} = {(enabled ? "enabled" : "disabled")}");
    }
}
