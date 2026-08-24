namespace Redline.Calibration.Tests;

internal static class FixturePaths
{
    public static string B58Gen2
    {
        get
        {
            var current = new DirectoryInfo(AppContext.BaseDirectory);
            while (current is not null)
            {
                var candidate = Path.Combine(current.FullName, "fixtures", "local", "B58gen2", "00005D55504809");
                if (Directory.Exists(candidate)) return candidate;
                current = current.Parent;
            }

            return string.Empty;
        }
    }
}

internal sealed class TemporaryDirectory : IDisposable
{
    public TemporaryDirectory()
    {
        Root = Path.Combine(Path.GetTempPath(), "Redline.Calibration.Tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Root);
    }

    public string Root { get; }

    public string PathFor(string fileName) => Path.Combine(Root, fileName);

    public void Dispose()
    {
        if (Directory.Exists(Root)) Directory.Delete(Root, recursive: true);
    }
}
