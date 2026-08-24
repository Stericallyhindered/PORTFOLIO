using System.Text;

namespace Redline.Calibration.Logs;

internal sealed class CsvRecordReader
{
    private readonly TextReader _reader;

    public CsvRecordReader(TextReader reader) => _reader = reader;

    public async Task<string[]?> ReadAsync(CancellationToken cancellationToken)
    {
        var fields = new List<string>();
        var field = new StringBuilder();
        var quoted = false;
        var consumedAny = false;

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var next = await ReadCharacterAsync().ConfigureAwait(false);
            if (next < 0)
            {
                if (!consumedAny && field.Length == 0 && fields.Count == 0) return null;
                fields.Add(field.ToString());
                return fields.ToArray();
            }

            consumedAny = true;
            var character = (char)next;
            if (quoted)
            {
                if (character == '"')
                {
                    var following = _reader.Peek();
                    if (following == '"')
                    {
                        await ReadCharacterAsync().ConfigureAwait(false);
                        field.Append('"');
                    }
                    else
                    {
                        quoted = false;
                    }
                }
                else
                {
                    field.Append(character);
                }

                continue;
            }

            switch (character)
            {
                case '"' when field.Length == 0:
                    quoted = true;
                    break;
                case ',':
                    fields.Add(field.ToString());
                    field.Clear();
                    break;
                case '\r':
                    if (_reader.Peek() == '\n') await ReadCharacterAsync().ConfigureAwait(false);
                    fields.Add(field.ToString());
                    return fields.ToArray();
                case '\n':
                    fields.Add(field.ToString());
                    return fields.ToArray();
                default:
                    field.Append(character);
                    break;
            }
        }
    }

    private async Task<int> ReadCharacterAsync()
    {
        var buffer = new char[1];
        var count = await _reader.ReadAsync(buffer, 0, 1).ConfigureAwait(false);
        return count == 0 ? -1 : buffer[0];
    }
}

