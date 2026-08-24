using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Redline.Calibration.Logs;

namespace Redline.Calibration.Desktop;

public sealed class LogPlotControl : FrameworkElement
{
    private static readonly Brush BackgroundBrush = FrozenBrush(18, 19, 21);
    private static readonly Brush AlternatePaneBrush = FrozenBrush(21, 22, 25);
    private static readonly Brush GridBrush = FrozenBrush(47, 49, 54);
    private static readonly Brush MutedBrush = FrozenBrush(139, 143, 151);
    private static readonly Brush CursorBrush = FrozenBrush(242, 242, 238);
    private LogDataset? _dataset;
    private IReadOnlyList<LogTraceSelection> _selections = Array.Empty<LogTraceSelection>();
    private double _viewStart;
    private double _viewEnd = 1;
    private int _cursorIndex = -1;
    private Point? _panOrigin;
    private (double Start, double End) _panViewport;

    public event EventHandler<LogCursorChangedEventArgs>? CursorChanged;

    public event EventHandler<LogViewportChangedEventArgs>? ViewportChanged;

    public void SetData(LogDataset? dataset, IReadOnlyList<LogTraceSelection>? selections)
    {
        _dataset = dataset;
        _selections = selections ?? Array.Empty<LogTraceSelection>();
        _cursorIndex = dataset is null ? -1 : Math.Clamp(_cursorIndex, 0, Math.Max(0, dataset.Quality.SampleCount - 1));
        InvalidateVisual();
    }

    public void SetViewport(double start, double end)
    {
        _viewStart = Math.Clamp(start, 0, 1);
        _viewEnd = Math.Clamp(end, _viewStart + 0.001, 1);
        InvalidateVisual();
    }

    public int CursorIndex => _cursorIndex;

    protected override void OnRender(DrawingContext drawingContext)
    {
        base.OnRender(drawingContext);
        drawingContext.DrawRectangle(BackgroundBrush, null, new Rect(RenderSize));
        if (_dataset is null || RenderSize.Width < 160 || RenderSize.Height < 100) return;

        var selected = _selections.Where(selection => selection.IsSelected).ToArray();
        var plot = new Rect(82, 16, Math.Max(1, RenderSize.Width - 102), Math.Max(1, RenderSize.Height - 44));
        if (selected.Length == 0)
        {
            DrawText(drawingContext, "SELECT CHANNELS", new Point(plot.Left + 12, plot.Top + 12), MutedBrush, 11, FontWeights.SemiBold);
            return;
        }

        var groups = selected.GroupBy(selection => NormalizeUnit(selection.Unit)).ToArray();
        var paneHeight = plot.Height / groups.Length;
        var sampleCount = _dataset.Quality.SampleCount;
        var firstIndex = Math.Clamp((int)Math.Floor(_viewStart * Math.Max(0, sampleCount - 1)), 0, Math.Max(0, sampleCount - 1));
        var lastIndex = Math.Clamp((int)Math.Ceiling(_viewEnd * Math.Max(0, sampleCount - 1)), firstIndex, Math.Max(0, sampleCount - 1));

        drawingContext.PushClip(new RectangleGeometry(plot));
        for (var groupIndex = 0; groupIndex < groups.Length; groupIndex++)
        {
            var pane = new Rect(plot.Left, plot.Top + (groupIndex * paneHeight), plot.Width, paneHeight);
            if (groupIndex % 2 == 1) drawingContext.DrawRectangle(AlternatePaneBrush, null, pane);
            DrawGrid(drawingContext, pane);
            DrawGroup(drawingContext, pane, groups[groupIndex].ToArray(), firstIndex, lastIndex);
        }

        if (_cursorIndex >= firstIndex && _cursorIndex <= lastIndex && lastIndex > firstIndex)
        {
            var cursorX = plot.Left + (((_cursorIndex - firstIndex) / (double)(lastIndex - firstIndex)) * plot.Width);
            drawingContext.DrawLine(new Pen(CursorBrush, 1), new Point(cursorX, plot.Top), new Point(cursorX, plot.Bottom));
        }
        drawingContext.Pop();

        DrawTimeAxis(drawingContext, plot, firstIndex, lastIndex);
    }

    private void DrawGroup(
        DrawingContext context,
        Rect pane,
        IReadOnlyList<LogTraceSelection> traces,
        int firstIndex,
        int lastIndex)
    {
        var finite = traces.SelectMany(trace => trace.Series.Values.Skip(firstIndex).Take(lastIndex - firstIndex + 1))
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .ToArray();
        if (finite.Length == 0) return;
        var minimum = finite.Min();
        var maximum = finite.Max();
        if (minimum == maximum)
        {
            minimum -= 0.5;
            maximum += 0.5;
        }
        else
        {
            var padding = (maximum - minimum) * 0.08;
            minimum -= padding;
            maximum += padding;
        }

        var unit = string.IsNullOrWhiteSpace(traces[0].Unit) ? "VALUE" : traces[0].Unit!.ToUpperInvariant();
        DrawText(context, unit, new Point(7, pane.Top + 5), MutedBrush, 9, FontWeights.SemiBold);
        DrawText(context, FormatScale(maximum), new Point(7, pane.Top + 20), MutedBrush, 9, FontWeights.Normal);
        DrawText(context, FormatScale(minimum), new Point(7, Math.Max(pane.Top + 34, pane.Bottom - 18)), MutedBrush, 9, FontWeights.Normal);

        foreach (var trace in traces)
        {
            var geometry = new StreamGeometry();
            using (var geometryContext = geometry.Open())
            {
                var started = false;
                var visibleCount = Math.Max(1, lastIndex - firstIndex + 1);
                var step = Math.Max(1, (int)Math.Floor(visibleCount / Math.Max(1, pane.Width * 1.5)));
                for (var index = firstIndex; index <= lastIndex; index += step)
                {
                    if (index >= trace.Series.Values.Count || trace.Series.Values[index] is not { } value)
                    {
                        started = false;
                        continue;
                    }

                    var x = pane.Left + (lastIndex == firstIndex ? 0 : ((index - firstIndex) / (double)(lastIndex - firstIndex)) * pane.Width);
                    var y = pane.Bottom - (((value - minimum) / (maximum - minimum)) * pane.Height);
                    if (!started)
                    {
                        geometryContext.BeginFigure(new Point(x, y), false, false);
                        started = true;
                    }
                    else
                    {
                        geometryContext.LineTo(new Point(x, y), true, false);
                    }
                }
            }

            geometry.Freeze();
            var pen = new Pen(trace.ColorBrush, 1.65);
            pen.Freeze();
            context.DrawGeometry(null, pen, geometry);
        }
    }

    private static void DrawGrid(DrawingContext context, Rect pane)
    {
        var pen = new Pen(GridBrush, 1);
        pen.Freeze();
        for (var index = 0; index <= 4; index++)
        {
            var x = pane.Left + ((pane.Width * index) / 4);
            context.DrawLine(pen, new Point(x, pane.Top), new Point(x, pane.Bottom));
        }
        for (var index = 0; index <= 2; index++)
        {
            var y = pane.Top + ((pane.Height * index) / 2);
            context.DrawLine(pen, new Point(pane.Left, y), new Point(pane.Right, y));
        }
    }

    private void DrawTimeAxis(DrawingContext context, Rect plot, int firstIndex, int lastIndex)
    {
        var time = _dataset?.FindCanonical(CanonicalChannelIds.TimeSeconds)?.Values;
        for (var tick = 0; tick <= 4; tick++)
        {
            var index = firstIndex + (int)Math.Round((lastIndex - firstIndex) * (tick / 4d));
            var label = time is not null && index < time.Count && time[index].HasValue
                ? $"{time[index]!.Value - FirstFinite(time):F2}s"
                : index.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var x = plot.Left + ((plot.Width * tick) / 4);
            DrawText(context, label, new Point(x - 14, plot.Bottom + 8), MutedBrush, 9, FontWeights.Normal);
        }
    }

    protected override void OnMouseMove(MouseEventArgs eventArgs)
    {
        base.OnMouseMove(eventArgs);
        if (_dataset is null) return;
        var plotWidth = Math.Max(1, RenderSize.Width - 102);
        if (_panOrigin is { } origin && eventArgs.LeftButton == MouseButtonState.Pressed)
        {
            var delta = (eventArgs.GetPosition(this).X - origin.X) / plotWidth;
            var width = _panViewport.End - _panViewport.Start;
            var start = Math.Clamp(_panViewport.Start - (delta * width), 0, 1 - width);
            SetViewport(start, start + width);
            ViewportChanged?.Invoke(this, new LogViewportChangedEventArgs(_viewStart, _viewEnd));
            return;
        }

        var position = eventArgs.GetPosition(this);
        var normalizedX = Math.Clamp((position.X - 82) / plotWidth, 0, 1);
        var viewportPosition = _viewStart + (normalizedX * (_viewEnd - _viewStart));
        var index = Math.Clamp(
            (int)Math.Round(viewportPosition * Math.Max(0, _dataset.Quality.SampleCount - 1)),
            0,
            Math.Max(0, _dataset.Quality.SampleCount - 1));
        if (index == _cursorIndex) return;
        _cursorIndex = index;
        CursorChanged?.Invoke(this, new LogCursorChangedEventArgs(index));
        InvalidateVisual();
    }

    protected override void OnMouseLeftButtonDown(MouseButtonEventArgs eventArgs)
    {
        base.OnMouseLeftButtonDown(eventArgs);
        _panOrigin = eventArgs.GetPosition(this);
        _panViewport = (_viewStart, _viewEnd);
        CaptureMouse();
    }

    protected override void OnMouseLeftButtonUp(MouseButtonEventArgs eventArgs)
    {
        base.OnMouseLeftButtonUp(eventArgs);
        _panOrigin = null;
        ReleaseMouseCapture();
    }

    protected override void OnMouseWheel(MouseWheelEventArgs eventArgs)
    {
        base.OnMouseWheel(eventArgs);
        var currentWidth = _viewEnd - _viewStart;
        var newWidth = Math.Clamp(currentWidth * (eventArgs.Delta > 0 ? 0.78 : 1.28), 0.015, 1);
        var pointer = Math.Clamp((eventArgs.GetPosition(this).X - 82) / Math.Max(1, RenderSize.Width - 102), 0, 1);
        var anchor = _viewStart + (pointer * currentWidth);
        var start = Math.Clamp(anchor - (pointer * newWidth), 0, 1 - newWidth);
        SetViewport(start, start + newWidth);
        ViewportChanged?.Invoke(this, new LogViewportChangedEventArgs(_viewStart, _viewEnd));
        eventArgs.Handled = true;
    }

    private static string NormalizeUnit(string? unit) => string.IsNullOrWhiteSpace(unit) ? "value" : unit.Trim().ToLowerInvariant();

    private static string FormatScale(double value) => Math.Abs(value) >= 1000 ? $"{value / 1000:0.#}k" : value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);

    private static double FirstFinite(IReadOnlyList<double?> values) => values.FirstOrDefault(value => value.HasValue) ?? 0;

    private void DrawText(DrawingContext context, string text, Point point, Brush brush, double size, FontWeight weight)
    {
        var formatted = new FormattedText(
            text,
            System.Globalization.CultureInfo.CurrentUICulture,
            FlowDirection.LeftToRight,
            new Typeface(new FontFamily("Segoe UI"), FontStyles.Normal, weight, FontStretches.Normal),
            size,
            brush,
            VisualTreeHelper.GetDpi(this).PixelsPerDip);
        context.DrawText(formatted, point);
    }

    private static SolidColorBrush FrozenBrush(byte red, byte green, byte blue)
    {
        var brush = new SolidColorBrush(Color.FromRgb(red, green, blue));
        brush.Freeze();
        return brush;
    }
}

public sealed class LogCursorChangedEventArgs(int sampleIndex) : EventArgs
{
    public int SampleIndex { get; } = sampleIndex;
}

public sealed class LogViewportChangedEventArgs(double start, double end) : EventArgs
{
    public double Start { get; } = start;

    public double End { get; } = end;
}
