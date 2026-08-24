using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Redline.Calibration.Desktop;
using Redline.Calibration.Logs;
using Redline.Calibration.Persistence;

namespace Redline.Calibration.Tests;

public sealed class DesktopRenderingTests
{
    [Fact]
    [Trait("Fixture", "Local")]
    public async Task Main_window_xaml_loads_and_real_log_chart_renders_nonblank_pixels()
    {
        var fixture = FixturePaths.B58Gen2;
        if (!Directory.Exists(fixture)) return;
        var logPath = Path.Combine(fixture, "2024-01-20_M340i_MHD_00005D55504809.csv");
        var dataset = await new MhdLogParser().ParseAsync(logPath);
        Exception? failure = null;
        var thread = new Thread(() =>
        {
            try
            {
                var application = Application.Current ?? new App();
                if (application.Resources.Count == 0) ((App)application).InitializeComponent();
                var window = new MainWindow();
        Assert.Equal("GCAL Studio", window.Title);

                var selections = new[]
                {
                    CreateSelection(dataset, CanonicalChannelIds.BoostActualPsi, Color.FromRgb(56, 201, 197)),
                    CreateSelection(dataset, CanonicalChannelIds.BoostTargetPsi, Color.FromRgb(255, 71, 61)),
                    CreateSelection(dataset, CanonicalChannelIds.WastegateDutyCyclePercent, Color.FromRgb(225, 182, 85)),
                    CreateSelection(dataset, CanonicalChannelIds.EngineSpeedRpm, Color.FromRgb(210, 213, 218))
                };
                var plot = new LogPlotControl { Width = 1200, Height = 560 };
                plot.SetData(dataset, selections);
                plot.Measure(new Size(1200, 560));
                plot.Arrange(new Rect(0, 0, 1200, 560));
                plot.UpdateLayout();
                var bitmap = new RenderTargetBitmap(1200, 560, 96, 96, PixelFormats.Pbgra32);
                bitmap.Render(plot);
                var pixels = new byte[1200 * 560 * 4];
                bitmap.CopyPixels(pixels, 1200 * 4, 0);

                Assert.Contains(pixels, value => value > 220);
                Assert.True(pixels.Distinct().Count() > 12, "Rendered chart should contain traces, labels, and grid colors.");
                window.Close();
            }
            catch (Exception exception)
            {
                failure = exception;
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        Assert.True(thread.Join(TimeSpan.FromSeconds(20)), "Desktop render verification timed out.");
        if (failure is not null) throw failure;
    }

    private static LogTraceSelection CreateSelection(LogDataset dataset, string canonicalId, Color color)
    {
        var series = dataset.FindCanonical(canonicalId)
            ?? throw new InvalidOperationException($"Fixture is missing {canonicalId}.");
        return new LogTraceSelection(series, color) { IsSelected = true };
    }

    [Fact]
    public void Profiles_window_xaml_loads_with_local_vault_editor()
    {
        using var temporary = new TemporaryDirectory();
        Exception? failure = null;
        var thread = new Thread(() =>
        {
            try
            {
                var application = Application.Current ?? new App();
                if (application.Resources.Count == 0) ((App)application).InitializeComponent();
                var window = new ProfilesWindow(new LocalProfileStore(temporary.PathFor("vault")));
        Assert.Equal("GCAL Vehicle Profiles", window.Title);
                var content = Assert.IsAssignableFrom<FrameworkElement>(window.Content);
                content.Measure(new Size(1460, 900));
                content.Arrange(new Rect(0, 0, 1460, 900));
                content.UpdateLayout();
                Assert.True(content.IsMeasureValid);
                Assert.True(content.DesiredSize.Width > 1000);
                window.Close();
            }
            catch (Exception exception)
            {
                failure = exception;
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        Assert.True(thread.Join(TimeSpan.FromSeconds(20)), "Profile editor verification timed out.");
        if (failure is not null) throw failure;
    }
}
