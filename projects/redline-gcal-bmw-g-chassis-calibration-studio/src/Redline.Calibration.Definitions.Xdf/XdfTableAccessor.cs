using Redline.Calibration.Binary;

namespace Redline.Calibration.Definitions.Xdf;

public sealed class XdfTableAccessor
{
    public XdfTableData Read(CalibrationBinaryDocument binary, XdfTableDefinition table)
    {
        ArgumentNullException.ThrowIfNull(binary);
        ArgumentNullException.ThrowIfNull(table);
        if (!table.CanRead)
        {
            throw new NotSupportedException($"Table '{table.Title}' is not readable: {string.Join(" ", table.Limitations)}");
        }

        var z = table.ZAxis;
        var values = new double[table.RowCount, table.ColumnCount];
        var rawValues = new double[table.RowCount, table.ColumnCount];
        for (var row = 0; row < table.RowCount; row++)
        {
            for (var column = 0; column < table.ColumnCount; column++)
            {
                var offset = GetContiguousOffset(z, row, column, table.RowCount, table.ColumnCount);
                var raw = binary.ReadValue(offset, z.Encoding);
                rawValues[row, column] = raw;
                values[row, column] = z.Transform?.Apply(raw) ?? raw;
            }
        }

        return new XdfTableData(
            table,
            ReadAxis(binary, table.XAxis),
            ReadAxis(binary, table.YAxis),
            values,
            rawValues);
    }

    public void WriteCell(
        CalibrationBinaryDocument binary,
        XdfTableDefinition table,
        int row,
        int column,
        double engineeringValue)
    {
        ArgumentNullException.ThrowIfNull(binary);
        ArgumentNullException.ThrowIfNull(table);
        if (!table.CanWrite)
        {
            throw new NotSupportedException($"Table '{table.Title}' is not write-safe: {string.Join(" ", table.Limitations)}");
        }

        if ((uint)row >= table.RowCount || (uint)column >= table.ColumnCount)
        {
            throw new ArgumentOutOfRangeException(nameof(row), $"Cell [{row}, {column}] is outside {table.RowCount}x{table.ColumnCount}.");
        }

        var z = table.ZAxis;
        var raw = z.Transform!.Invert(engineeringValue);
        if (z.Encoding.ValueKind != BinaryValueKind.Ieee754Float)
        {
            raw = Math.Round(raw, MidpointRounding.AwayFromZero);
        }

        var offset = GetContiguousOffset(z, row, column, table.RowCount, table.ColumnCount);
        binary.ApplyValue(offset, raw, z.Encoding, $"{table.Title} [{row}, {column}] = {engineeringValue}");
    }

    private static IReadOnlyList<double> ReadAxis(CalibrationBinaryDocument binary, XdfAxisDefinition axis)
    {
        if (!axis.Address.HasValue)
        {
            return axis.Labels;
        }

        if (axis.MajorStrideBits != 0 || axis.MinorStrideBits != 0)
        {
            return axis.Labels;
        }

        var values = new double[axis.Count];
        for (var index = 0; index < axis.Count; index++)
        {
            var offset = checked((int)(axis.Address.Value + ((long)index * axis.Encoding.SizeBytes)));
            var raw = binary.ReadValue(offset, axis.Encoding);
            values[index] = axis.Transform?.Apply(raw) ?? raw;
        }

        return values;
    }

    private static int GetContiguousOffset(
        XdfAxisDefinition axis,
        int row,
        int column,
        int rowCount,
        int columnCount)
    {
        var address = axis.Address ?? throw new InvalidOperationException("The axis has no binary address.");
        var elementIndex = axis.IsColumnMajor
            ? ((long)column * rowCount) + row
            : ((long)row * columnCount) + column;
        return checked((int)(address + (elementIndex * axis.Encoding.SizeBytes)));
    }
}
