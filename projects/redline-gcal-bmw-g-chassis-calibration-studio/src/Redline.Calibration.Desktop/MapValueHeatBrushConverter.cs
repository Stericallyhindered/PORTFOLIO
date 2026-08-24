using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace Redline.Calibration.Desktop;

public sealed class MapValueHeatBrushConverter : IValueConverter
{
    private double _minimum;
    private double _maximum = 1;

    public void SetRange(double[,] values)
    {
        var finite = values.Cast<double>().Where(double.IsFinite).ToArray();
        _minimum = finite.Length == 0 ? 0 : finite.Min();
        _maximum = finite.Length == 0 ? 1 : finite.Max();
        if (_maximum <= _minimum) _maximum = _minimum + 1;
    }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not double numeric || !double.IsFinite(numeric)) return new SolidColorBrush(Color.FromRgb(35, 37, 43));
        var normalized = Math.Clamp((numeric - _minimum) / (_maximum - _minimum), 0d, 1d);
        var red = (byte)Math.Round(40 + (normalized * 145));
        var green = (byte)Math.Round(82 - (normalized * 50));
        var blue = (byte)Math.Round(93 - (normalized * 60));
        return new SolidColorBrush(Color.FromRgb(red, green, blue));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => Binding.DoNothing;
}
