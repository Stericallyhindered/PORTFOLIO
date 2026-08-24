using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Redline.Calibration.Logs;

namespace Redline.Calibration.Desktop;

public sealed class LogNavigatorControl : FrameworkElement
{
    private LogDataset? _dataset;
    private double _start;
    private double _end = 1;
    private bool _dragging;
    private double _dragAnchor;
    private (double Start, double End) _dragViewport;

    public event EventHandler<LogViewportChangedEventArgs>? ViewportChanged;

    public void SetDataset(LogDataset? dataset)
    {
        _dataset = dataset;
        InvalidateVisual();
    }

    public void SetViewport(double start, double end)
    {
        _start = Math.Clamp(start, 0, 1);
        _end = Math.Clamp(end, _start + 0.001, 1);
        InvalidateVisual();
    }

    protected override void OnRender(DrawingContext drawingContext)
    {
        base.OnRender(drawingContext);
        var bounds = new Rect(RenderSize);
        drawingContext.DrawRectangle(new SolidColorBrush(Color.FromRgb(27, 28, 31)), null, bounds);
        if (_dataset is null) return;
        var source = _dataset.FindCanonical(CanonicalChannelIds.EngineSpeedRpm)
            ?? _dataset.Series.FirstOrDefault(series => !series.Channel.IsMetadata);
        if (source is null) return;
        var finite = source.Values.Where(value => value.HasValue).Select(value => value!.Value).ToArray();
        if (finite.Length == 0) return;
        var minimum = finite.Min();
        var maximum = finite.Max();
        var range = Math.Max(double.Epsilon, maximum - minimum);
        var geometry = new StreamGeometry();
        using (var context = geometry.Open())
        {
            var started = false;
            var step = Math.Max(1, (int)Math.Floor(source.Values.Count / Math.Max(1, bounds.Width * 1.5)));
            for (var index = 0; index < source.Values.Count; index += step)
            {
                if (source.Values[index] is not { } value) continue;
                var x = source.Values.Count == 1 ? 0 : (index / (source.Values.Count - 1d)) * bounds.Width;
                var y = bounds.Bottom - (((value - minimum) / range) * Math.Max(1, bounds.Height - 4)) - 2;
                if (!started) { context.BeginFigure(new Point(x, y), false, false); started = true; }
                else context.LineTo(new Point(x, y), true, false);
            }
        }
        geometry.Freeze();
        drawingContext.DrawGeometry(null, new Pen(new SolidColorBrush(Color.FromRgb(112, 117, 126)), 1), geometry);

        var selection = new Rect(_start * bounds.Width, 0, Math.Max(4, (_end - _start) * bounds.Width), bounds.Height);
        drawingContext.DrawRectangle(new SolidColorBrush(Color.FromArgb(38, 255, 71, 61)), new Pen(new SolidColorBrush(Color.FromRgb(255, 71, 61)), 1), selection);
        drawingContext.DrawRectangle(new SolidColorBrush(Color.FromRgb(255, 71, 61)), null, new Rect(selection.Left, 0, 3, bounds.Height));
        drawingContext.DrawRectangle(new SolidColorBrush(Color.FromRgb(255, 71, 61)), null, new Rect(selection.Right - 3, 0, 3, bounds.Height));
    }

    protected override void OnMouseLeftButtonDown(MouseButtonEventArgs eventArgs)
    {
        base.OnMouseLeftButtonDown(eventArgs);
        _dragging = true;
        _dragAnchor = Math.Clamp(eventArgs.GetPosition(this).X / Math.Max(1, RenderSize.Width), 0, 1);
        _dragViewport = (_start, _end);
        CaptureMouse();
    }

    protected override void OnMouseMove(MouseEventArgs eventArgs)
    {
        base.OnMouseMove(eventArgs);
        if (!_dragging || eventArgs.LeftButton != MouseButtonState.Pressed) return;
        var current = Math.Clamp(eventArgs.GetPosition(this).X / Math.Max(1, RenderSize.Width), 0, 1);
        var width = _dragViewport.End - _dragViewport.Start;
        var start = Math.Clamp(_dragViewport.Start + (current - _dragAnchor), 0, 1 - width);
        SetViewport(start, start + width);
        ViewportChanged?.Invoke(this, new LogViewportChangedEventArgs(_start, _end));
    }

    protected override void OnMouseLeftButtonUp(MouseButtonEventArgs eventArgs)
    {
        base.OnMouseLeftButtonUp(eventArgs);
        _dragging = false;
        ReleaseMouseCapture();
    }
}
