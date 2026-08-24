using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Media;
using Redline.Calibration.Logs;

namespace Redline.Calibration.Desktop;

public sealed class LogTraceSelection : INotifyPropertyChanged
{
    private bool _isSelected;
    private string _currentValue = "—";

    public LogTraceSelection(LogSeries series, Color color)
    {
        Series = series;
        Color = color;
        ColorBrush = new SolidColorBrush(color);
        ColorBrush.Freeze();
    }

    public LogSeries Series { get; }

    public LogChannel Channel => Series.Channel;

    public Color Color { get; }

    public Brush ColorBrush { get; }

    public string DisplayName => Channel.DisplayName;

    public string? Unit => Channel.Unit;

    public string? CanonicalId => Channel.CanonicalId;

    public bool IsSelected
    {
        get => _isSelected;
        set
        {
            if (_isSelected == value) return;
            _isSelected = value;
            OnPropertyChanged();
        }
    }

    public string CurrentValue
    {
        get => _currentValue;
        set
        {
            if (_currentValue == value) return;
            _currentValue = value;
            OnPropertyChanged();
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
}

