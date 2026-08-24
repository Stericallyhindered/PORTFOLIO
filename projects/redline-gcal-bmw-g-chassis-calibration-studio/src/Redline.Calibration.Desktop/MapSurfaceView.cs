using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Media.Media3D;

namespace Redline.Calibration.Desktop;

public sealed class MapSurfaceView : UserControl
{
    private readonly PerspectiveCamera _camera;
    private readonly Model3DGroup _scene = new();
    private readonly AxisAngleRotation3D _yaw = new(new Vector3D(0, 1, 0), 32);
    private readonly AxisAngleRotation3D _pitch = new(new Vector3D(1, 0, 0), -34);
    private readonly TextBlock _rangeText = new();
    private readonly TextBlock _selectionText = new();
    private readonly TextBlock _axisText = new();
    private readonly TextBlock _xAxisLabel = new();
    private readonly TextBlock _xTicks = new();
    private readonly TextBlock _yAxisLabel = new();
    private readonly TextBlock _yTicks = new();
    private readonly TextBlock _zAxisLabel = new();
    private readonly TextBlock _zTicks = new();
    private readonly Viewport3D _viewport;
    private Model3DGroup? _mapLayer;
    private GeometryModel3D? _surfaceModel;
    private Model3DGroup? _selectionMarker;
    private double[,]? _sourceValues;
    private int[]? _sourceRows;
    private int[]? _sourceColumns;
    private IReadOnlyList<double>? _xAxisValues;
    private IReadOnlyList<double>? _yAxisValues;
    private string _xAxisName = "X AXIS";
    private string _yAxisName = "Y AXIS";
    private string _zAxisName = "VALUE";
    private double _zMinimum;
    private double _zMaximum = 1;
    private Point? _lastPointer;
    private bool _isOrbiting;
    private double _distance = 4.25;

    public MapSurfaceView()
    {
        Background = new SolidColorBrush(Color.FromRgb(10, 12, 15));
        ClipToBounds = true;
        _camera = new PerspectiveCamera { Position = new Point3D(0, 1.62, _distance), LookDirection = new Vector3D(0, -0.29, -1), UpDirection = new Vector3D(0, 1, 0), FieldOfView = 41 };
        _scene.Children.Add(new AmbientLight(Color.FromRgb(92, 100, 112)));
        _scene.Children.Add(new DirectionalLight(Color.FromRgb(246, 250, 255), new Vector3D(-0.55, -1, -0.4)));
        _scene.Children.Add(new DirectionalLight(Color.FromRgb(45, 139, 190), new Vector3D(0.55, -0.6, 0.3)));

        _viewport = new Viewport3D { Camera = _camera };
        _viewport.Children.Add(new ModelVisual3D { Content = _scene });
        _rangeText.Foreground = new SolidColorBrush(Color.FromRgb(148, 159, 174));
        _rangeText.FontFamily = new FontFamily("Cascadia Mono, Consolas");
        _rangeText.FontSize = 10;
        _selectionText.Foreground = new SolidColorBrush(Color.FromRgb(55, 204, 199));
        _selectionText.FontFamily = new FontFamily("Cascadia Mono, Consolas");
        _selectionText.FontSize = 10;
        _selectionText.Text = "CLICK A SURFACE POINT";
        _axisText.Foreground = new SolidColorBrush(Color.FromRgb(225, 187, 63));
        _axisText.FontFamily = new FontFamily("Cascadia Mono, Consolas");
        _axisText.FontSize = 9;
        _axisText.Text = "X AXIS   Y AXIS   Z VALUE";
        ConfigureAxisHud(_xAxisLabel, Color.FromRgb(235, 73, 60));
        ConfigureAxisHud(_yAxisLabel, Color.FromRgb(226, 218, 92));
        ConfigureAxisHud(_zAxisLabel, Color.FromRgb(77, 113, 239));
        ConfigureAxisHud(_xTicks, Color.FromRgb(235, 73, 60));
        ConfigureAxisHud(_yTicks, Color.FromRgb(226, 218, 92));
        ConfigureAxisHud(_zTicks, Color.FromRgb(77, 113, 239));
        _xAxisLabel.Text = "X AXIS"; _yAxisLabel.Text = "Y AXIS"; _zAxisLabel.Text = "Z VALUE";
        _xTicks.Text = ""; _yTicks.Text = ""; _zTicks.Text = "";
        var overlay = new Border
        {
            HorizontalAlignment = HorizontalAlignment.Left, VerticalAlignment = VerticalAlignment.Top, Margin = new Thickness(18), Padding = new Thickness(10, 7, 10, 7),
            Background = new SolidColorBrush(Color.FromArgb(226, 15, 19, 25)), BorderBrush = new SolidColorBrush(Color.FromRgb(48, 58, 71)), BorderThickness = new Thickness(1), CornerRadius = new CornerRadius(5),
            Child = new StackPanel { Children = { new TextBlock { Text = "SURFACE ANALYSIS", Foreground = Brushes.White, FontSize = 10, FontFamily = new FontFamily("Segoe UI Semibold") }, _rangeText, _axisText, _selectionText } }
        };
        Content = new Grid { Children = { _viewport, overlay } };
        MouseLeftButtonDown += OnPointerDown;
        MouseLeftButtonUp += OnPointerUp;
        MouseMove += OnPointerMove;
        MouseWheel += OnMouseWheel;
        MouseDoubleClick += OnMouseDoubleClick;
        SetEmptyScene();
    }

    public event EventHandler<MapSurfaceCellSelectedEventArgs>? CellSelected;

    public void SetData(double[,] values) => SetData(values, null, null, null, null, null);

    public void SetData(double[,] values, IReadOnlyList<double>? xAxisValues, IReadOnlyList<double>? yAxisValues, string? xAxisName, string? yAxisName, string? zAxisName)
    {
        ArgumentNullException.ThrowIfNull(values);
        RemoveMapLayer();
        var rows = values.GetLength(0);
        var columns = values.GetLength(1);
        if (rows < 2 || columns < 2) { SetEmptyScene(); return; }

        var rowStep = Math.Max(1, (int)Math.Ceiling(rows / 64d));
        var columnStep = Math.Max(1, (int)Math.Ceiling(columns / 64d));
        var sourceRows = Enumerable.Range(0, rows).Where(index => index % rowStep == 0 || index == rows - 1).ToArray();
        var sourceColumns = Enumerable.Range(0, columns).Where(index => index % columnStep == 0 || index == columns - 1).ToArray();
        var finiteValues = values.Cast<double>().Where(double.IsFinite).ToArray();
        if (finiteValues.Length == 0) { SetEmptyScene(); return; }
        var minimum = finiteValues.Min();
        var maximum = finiteValues.Max();
        var range = Math.Max(maximum - minimum, 1e-10);
        _rangeText.Text = string.Create(CultureInfo.InvariantCulture, $"{rows} x {columns}   MIN {minimum:G6}   MAX {maximum:G6}");

        var normalized = new double[sourceRows.Length, sourceColumns.Length];
        for (var row = 0; row < sourceRows.Length; row++)
        for (var column = 0; column < sourceColumns.Length; column++)
            normalized[row, column] = Normalize(values[sourceRows[row], sourceColumns[column]], minimum, range);

        _sourceValues = values;
        _sourceRows = sourceRows;
        _sourceColumns = sourceColumns;
        _xAxisValues = xAxisValues;
        _yAxisValues = yAxisValues;
        _xAxisName = string.IsNullOrWhiteSpace(xAxisName) ? "X AXIS" : xAxisName;
        _yAxisName = string.IsNullOrWhiteSpace(yAxisName) ? "Y AXIS" : yAxisName;
        _zAxisName = string.IsNullOrWhiteSpace(zAxisName) ? "VALUE" : zAxisName;
        _zMinimum = minimum;
        _zMaximum = maximum;
        _axisText.Text = $"X {_xAxisName}   Y {_yAxisName}   Z {_zAxisName}";
        _xAxisLabel.Text = _xAxisName;
        _yAxisLabel.Text = _yAxisName;
        _zAxisLabel.Text = _zAxisName;
        _xTicks.Text = AxisScale(_xAxisValues);
        _yTicks.Text = AxisScale(_yAxisValues);
        _zTicks.Text = string.Join("\n", new[] { minimum, (minimum + maximum) / 2d, maximum }
            .Select(value => value.ToString("G6", CultureInfo.InvariantCulture)));
        _selectionText.Text = "CLICK A SURFACE POINT";
        var layer = CreateReferencePlane();
        _surfaceModel = CreateSurface(normalized);
        layer.Children.Add(_surfaceModel);
        layer.Children.Add(CreateSurfaceLines(normalized));
        layer.Transform = CreateSurfaceTransform();
        _mapLayer = layer;
        _scene.Children.Add(layer);
    }

    private static GeometryModel3D CreateSurface(double[,] normalized)
    {
        var rows = normalized.GetLength(0);
        var columns = normalized.GetLength(1);
        var mesh = new MeshGeometry3D();
        for (var row = 0; row < rows; row++)
        for (var column = 0; column < columns; column++)
        {
            var x = ((column / (columns - 1d) - .5) * 2.5);
            var z = ((row / (rows - 1d)) - .5) * 2.0;
            mesh.Positions.Add(new Point3D(x, normalized[row, column] * 1.34, z));
            mesh.TextureCoordinates.Add(new Point(column / (columns - 1d), row / (rows - 1d)));
            var left = normalized[row, Math.Max(0, column - 1)];
            var right = normalized[row, Math.Min(columns - 1, column + 1)];
            var near = normalized[Math.Max(0, row - 1), column];
            var far = normalized[Math.Min(rows - 1, row + 1), column];
            var normal = new Vector3D(-(right - left) * 1.34, 2.5 / Math.Max(1, columns - 1), -(far - near) * 1.34);
            normal.Normalize();
            mesh.Normals.Add(normal);
        }
        for (var row = 0; row < rows - 1; row++)
        for (var column = 0; column < columns - 1; column++)
        {
            var tl = (row * columns) + column;
            var tr = tl + 1;
            var bl = tl + columns;
            mesh.TriangleIndices.Add(tl); mesh.TriangleIndices.Add(bl); mesh.TriangleIndices.Add(tr);
            mesh.TriangleIndices.Add(tr); mesh.TriangleIndices.Add(bl); mesh.TriangleIndices.Add(bl + 1);
        }
        mesh.Freeze();
        var heatmap = new ImageBrush(CreateHeatmap(normalized)) { Stretch = Stretch.Fill, TileMode = TileMode.None, ViewportUnits = BrushMappingMode.RelativeToBoundingBox };
        heatmap.Freeze();
        var material = new MaterialGroup();
        material.Children.Add(new DiffuseMaterial(heatmap));
        material.Children.Add(new SpecularMaterial(new SolidColorBrush(Color.FromArgb(95, 235, 242, 250)), 34));
        material.Freeze();
        return new GeometryModel3D(mesh, material) { BackMaterial = material };
    }

    private static BitmapSource CreateHeatmap(double[,] normalized)
    {
        var rows = normalized.GetLength(0);
        var columns = normalized.GetLength(1);
        var width = Math.Max(columns * 24, 256);
        var height = Math.Max(rows * 24, 256);
        var pixels = new byte[width * height * 4];
        for (var y = 0; y < height; y++)
        for (var x = 0; x < width; x++)
        {
            var sourceX = x / (width - 1d) * (columns - 1);
            var sourceY = y / (height - 1d) * (rows - 1);
            var x0 = (int)Math.Floor(sourceX);
            var y0 = (int)Math.Floor(sourceY);
            var x1 = Math.Min(columns - 1, x0 + 1);
            var y1 = Math.Min(rows - 1, y0 + 1);
            var tx = sourceX - x0;
            var ty = sourceY - y0;
            var top = normalized[y0, x0] + ((normalized[y0, x1] - normalized[y0, x0]) * tx);
            var bottom = normalized[y1, x0] + ((normalized[y1, x1] - normalized[y1, x0]) * tx);
            var color = HeatColor(top + ((bottom - top) * ty));
            var offset = ((y * width) + x) * 4;
            pixels[offset] = color.B; pixels[offset + 1] = color.G; pixels[offset + 2] = color.R; pixels[offset + 3] = 210;
        }
        var bitmap = new WriteableBitmap(width, height, 96, 96, PixelFormats.Bgra32, null);
        bitmap.WritePixels(new Int32Rect(0, 0, width, height), pixels, width * 4, 0);
        bitmap.Freeze();
        return bitmap;
    }

    private static GeometryModel3D CreateSurfaceLines(double[,] normalized)
    {
        var rows = normalized.GetLength(0);
        var columns = normalized.GetLength(1);
        var mesh = new MeshGeometry3D();
        var everyRow = Math.Max(1, (int)Math.Ceiling((rows - 1) / 10d));
        var everyColumn = Math.Max(1, (int)Math.Ceiling((columns - 1) / 10d));
        for (var row = 0; row < rows; row += everyRow)
            AddRowLine(mesh, normalized, Math.Min(row, rows - 1), .006);
        if ((rows - 1) % everyRow != 0) AddRowLine(mesh, normalized, rows - 1, .006);
        for (var column = 0; column < columns; column += everyColumn)
            AddColumnLine(mesh, normalized, Math.Min(column, columns - 1), .007);
        if ((columns - 1) % everyColumn != 0) AddColumnLine(mesh, normalized, columns - 1, .007);
        mesh.Freeze();
        var material = new DiffuseMaterial(new SolidColorBrush(Color.FromRgb(26, 33, 42)));
        material.Freeze();
        return new GeometryModel3D(mesh, material) { BackMaterial = material };
    }

    private static void AddRowLine(MeshGeometry3D mesh, double[,] data, int row, double halfWidth)
    {
        var columns = data.GetLength(1);
        var z = ((row / (data.GetLength(0) - 1d)) - .5) * 2.0;
        for (var col = 0; col < columns - 1; col++)
        {
            var x0 = ((col / (columns - 1d) - .5) * 2.5);
            var x1 = (((col + 1) / (columns - 1d) - .5) * 2.5);
            AddStrip(mesh, new Point3D(x0, data[row, col] * 1.34 + .008, z - halfWidth), new Point3D(x1, data[row, col + 1] * 1.34 + .008, z - halfWidth), new Point3D(x0, data[row, col] * 1.34 + .008, z + halfWidth), new Point3D(x1, data[row, col + 1] * 1.34 + .008, z + halfWidth));
        }
    }

    private static void AddColumnLine(MeshGeometry3D mesh, double[,] data, int column, double halfWidth)
    {
        var rows = data.GetLength(0);
        var x = ((column / (data.GetLength(1) - 1d)) - .5) * 2.5;
        for (var row = 0; row < rows - 1; row++)
        {
            var z0 = ((row / (rows - 1d)) - .5) * 2.0;
            var z1 = (((row + 1) / (rows - 1d)) - .5) * 2.0;
            AddStrip(mesh, new Point3D(x - halfWidth, data[row, column] * 1.34 + .009, z0), new Point3D(x - halfWidth, data[row + 1, column] * 1.34 + .009, z1), new Point3D(x + halfWidth, data[row, column] * 1.34 + .009, z0), new Point3D(x + halfWidth, data[row + 1, column] * 1.34 + .009, z1));
        }
    }

    private static void AddStrip(MeshGeometry3D mesh, Point3D a, Point3D b, Point3D c, Point3D d)
    {
        var index = mesh.Positions.Count;
        mesh.Positions.Add(a); mesh.Positions.Add(b); mesh.Positions.Add(c); mesh.Positions.Add(d);
        mesh.TriangleIndices.Add(index); mesh.TriangleIndices.Add(index + 2); mesh.TriangleIndices.Add(index + 1);
        mesh.TriangleIndices.Add(index + 1); mesh.TriangleIndices.Add(index + 2); mesh.TriangleIndices.Add(index + 3);
    }

    private Model3DGroup CreateReferencePlane()
    {
        var group = new Model3DGroup();
        var planeMaterial = new DiffuseMaterial(new SolidColorBrush(Color.FromRgb(18, 23, 30)));
        group.Children.Add(CreateFlatQuad(-1.34, 1.34, -1.08, 1.08, -.045, planeMaterial));
        var gridMaterial = new DiffuseMaterial(new SolidColorBrush(Color.FromRgb(42, 51, 63)));
        for (var index = 0; index <= 10; index++)
        {
            var x = -1.25 + index * .25; var z = -1 + index * .2;
            group.Children.Add(CreateFlatQuad(x - .003, x + .003, -1, 1, -.043, gridMaterial));
            group.Children.Add(CreateFlatQuad(-1.25, 1.25, z - .003, z + .003, -.043, gridMaterial));
            group.Children.Add(CreateBox(x - .003, x + .003, -.04, 1.38, .997, 1.003, gridMaterial));
            group.Children.Add(CreateBox(-1.253, -1.247, -.04, 1.38, z - .003, z + .003, gridMaterial));
        }
        for (var index = 0; index <= 6; index++)
        {
            var y = index / 6d * 1.38;
            group.Children.Add(CreateBox(-1.25, 1.25, y - .003, y + .003, .997, 1.003, gridMaterial));
            group.Children.Add(CreateBox(-1.253, -1.247, y - .003, y + .003, -1, 1, gridMaterial));
        }
        group.Children.Add(CreateFlatQuad(-1.275, 1.275, -.013, .013, -.044, new DiffuseMaterial(new SolidColorBrush(Color.FromRgb(224, 74, 62)))));
        group.Children.Add(CreateFlatQuad(-.013, .013, -1.025, 1.025, -.044, new DiffuseMaterial(new SolidColorBrush(Color.FromRgb(52, 196, 191)))));
        AddAxisLabels(group);
        return group;
    }

    private static void ConfigureAxisHud(TextBlock text, Color color)
    {
        text.Foreground = new SolidColorBrush(color);
        text.FontFamily = new FontFamily("Cascadia Mono, Consolas");
        text.FontSize = 10;
        text.TextWrapping = TextWrapping.NoWrap;
        text.TextAlignment = TextAlignment.Center;
    }

    private static string AxisScale(IReadOnlyList<double>? values)
    {
        if (values is not { Count: > 0 }) return "0\n50\n100";
        var indices = new[] { 0, values.Count / 2, values.Count - 1 };
        return string.Join("\n", indices.Select(index => values[index].ToString("G6", CultureInfo.InvariantCulture)));
    }

    private void AddAxisLabels(Model3DGroup group)
    {
        var xColor = Color.FromRgb(235, 73, 60);
        var yColor = Color.FromRgb(226, 218, 92);
        var zColor = Color.FromRgb(77, 113, 239);
        for (var index = 0; index <= 4; index++)
        {
            var ratio = index / 4d;
            var x = -1.25 + (ratio * 2.5);
            var z = -1 + (ratio * 2.0);
            group.Children.Add(CreateFloorText(AxisValue(_xAxisValues, ratio), x, -1.16, .34, .11, false, xColor));
            group.Children.Add(CreateFloorText(AxisValue(_yAxisValues, ratio), -1.42, z, .34, .11, true, yColor));
            var zValue = _zMinimum + ((_zMaximum - _zMinimum) * ratio);
            group.Children.Add(CreateBackText(zValue.ToString("G5", CultureInfo.InvariantCulture), 1.39, ratio * 1.38, .30, .105, zColor));
        }
        group.Children.Add(CreateFloorText(_xAxisName, 0, -1.38, 1.10, .14, false, xColor));
        group.Children.Add(CreateFloorText(_yAxisName, -1.63, 0, 1.05, .14, true, yColor));
        group.Children.Add(CreateBackText(_zAxisName, 1.54, .70, .56, .13, zColor));
    }

    private static string AxisValue(IReadOnlyList<double>? values, double ratio)
    {
        if (values is not { Count: > 0 }) return (ratio * 100).ToString("G4", CultureInfo.InvariantCulture);
        var index = Math.Clamp((int)Math.Round(ratio * (values.Count - 1)), 0, values.Count - 1);
        return values[index].ToString("G5", CultureInfo.InvariantCulture);
    }

    private static GeometryModel3D CreateFloorText(string text, double centerX, double centerZ, double width, double height, bool alongZ, Color color, bool invert = false)
    {
        var u = alongZ ? new Vector3D(0, 0, -width) : new Vector3D(width, 0, 0);
        var v = alongZ ? new Vector3D(-height, 0, 0) : new Vector3D(0, 0, height);
        return CreateTextQuad(text, new Point3D(centerX, -.027, centerZ), u, v, color, true, invert);
    }

    private static GeometryModel3D CreateBackText(string text, double centerX, double centerY, double width, double height, Color color, bool invert = false) =>
        CreateTextQuad(text, new Point3D(centerX, centerY, 1.007), new Vector3D(width, 0, 0), new Vector3D(0, height, 0), color, true, invert);

    private static GeometryModel3D CreateTextQuad(string text, Point3D center, Vector3D u, Vector3D v, Color color, bool facePositive = false, bool invert = false)
    {
        var visual = new TextBlock
        {
            Text = text,
            Foreground = new SolidColorBrush(color),
            Background = Brushes.Transparent,
            FontFamily = new FontFamily("Segoe UI Semibold"),
            FontSize = 30,
            TextAlignment = TextAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Stretch,
            VerticalAlignment = VerticalAlignment.Center,
            Width = 320,
            Height = 64
        };
        visual.Measure(new Size(320, 64));
        visual.Arrange(new Rect(0, 0, 320, 64));
        var brush = new VisualBrush(visual) { Stretch = Stretch.Fill };
        var material = new DiffuseMaterial(brush);
        var p0 = center - (u * .5) - (v * .5);
        var p1 = center + (u * .5) - (v * .5);
        var p2 = center - (u * .5) + (v * .5);
        var p3 = center + (u * .5) + (v * .5);
        var mesh = new MeshGeometry3D
        {
            Positions = new Point3DCollection { p0, p1, p2, p3 },
            TextureCoordinates = invert
                ? new PointCollection { new(1, 0), new(0, 0), new(1, 1), new(0, 1) }
                : new PointCollection { new(0, 1), new(1, 1), new(0, 0), new(1, 0) },
            TriangleIndices = facePositive
                ? new Int32Collection { 0, 1, 2, 1, 3, 2 }
                : new Int32Collection { 0, 2, 1, 1, 2, 3 }
        };
        return new GeometryModel3D(mesh, material);
    }

    private static GeometryModel3D CreateBox(double x0, double x1, double y0, double y1, double z0, double z1, Material material)
    {
        var mesh = new MeshGeometry3D
        {
            Positions = new Point3DCollection
            {
                new(x0, y0, z0), new(x1, y0, z0), new(x0, y1, z0), new(x1, y1, z0),
                new(x0, y0, z1), new(x1, y0, z1), new(x0, y1, z1), new(x1, y1, z1)
            },
            TriangleIndices = new Int32Collection
            {
                0,2,1, 1,2,3, 4,5,6, 5,7,6, 0,4,2, 2,4,6,
                1,3,5, 3,7,5, 0,1,4, 1,5,4, 2,6,3, 3,6,7
            }
        };
        mesh.Freeze();
        return new GeometryModel3D(mesh, material) { BackMaterial = material };
    }

    private static GeometryModel3D CreateFlatQuad(double x0, double x1, double z0, double z1, double y, Material material)
    {
        var mesh = new MeshGeometry3D { Positions = new Point3DCollection { new(x0, y, z0), new(x1, y, z0), new(x0, y, z1), new(x1, y, z1) }, TriangleIndices = new Int32Collection { 0, 2, 1, 1, 2, 3 } };
        mesh.Freeze(); return new GeometryModel3D(mesh, material) { BackMaterial = material };
    }

    private static double Normalize(double value, double min, double range) => double.IsFinite(value) ? Math.Clamp((value - min) / range, 0, 1) : 0;
    private static Color HeatColor(double value)
    {
        var stops = new[] { (0d, Color.FromRgb(20, 54, 110)), (.27d, Color.FromRgb(26, 152, 205)), (.5d, Color.FromRgb(49, 206, 172)), (.73d, Color.FromRgb(236, 192, 62)), (1d, Color.FromRgb(230, 69, 54)) };
        for (var index = 1; index < stops.Length; index++)
        {
            if (value > stops[index].Item1) continue;
            var left = stops[index - 1]; var right = stops[index]; var blend = (value - left.Item1) / (right.Item1 - left.Item1);
            return Color.FromRgb((byte)(left.Item2.R + (right.Item2.R - left.Item2.R) * blend), (byte)(left.Item2.G + (right.Item2.G - left.Item2.G) * blend), (byte)(left.Item2.B + (right.Item2.B - left.Item2.B) * blend));
        }
        return stops[^1].Item2;
    }

    private Transform3D CreateSurfaceTransform()
    {
        var group = new Transform3DGroup(); group.Children.Add(new TranslateTransform3D(0, -.55, 0)); group.Children.Add(new RotateTransform3D(_pitch)); group.Children.Add(new RotateTransform3D(_yaw)); return group;
    }
    private void SetEmptyScene()
    {
        RemoveMapLayer(); _rangeText.Text = "NO MAP SELECTED"; _axisText.Text = "X AXIS   Y AXIS   Z VALUE"; _selectionText.Text = "CLICK A SURFACE POINT";
        _sourceValues = null; _sourceRows = null; _sourceColumns = null; _xAxisValues = null; _yAxisValues = null; _xAxisName = "X AXIS"; _yAxisName = "Y AXIS"; _zAxisName = "VALUE"; _surfaceModel = null; _selectionMarker = null;
        _xAxisLabel.Text = _xAxisName; _yAxisLabel.Text = _yAxisName; _zAxisLabel.Text = _zAxisName;
        _xTicks.Text = "0\n50\n100"; _yTicks.Text = "0\n50\n100"; _zTicks.Text = "0\n50\n100";
        var layer = CreateReferencePlane(); layer.Transform = CreateSurfaceTransform(); _mapLayer = layer; _scene.Children.Add(layer);
    }

    private void RemoveMapLayer() { if (_mapLayer is null) return; _scene.Children.Remove(_mapLayer); _mapLayer = null; _surfaceModel = null; _selectionMarker = null; }

    private void OnPointerDown(object sender, MouseButtonEventArgs eventArgs)
    {
        _lastPointer = eventArgs.GetPosition(this); _isOrbiting = false; CaptureMouse();
    }

    private void OnPointerUp(object sender, MouseButtonEventArgs eventArgs)
    {
        var pointer = eventArgs.GetPosition(_viewport);
        var shouldSelect = !_isOrbiting;
        _lastPointer = null; ReleaseMouseCapture();
        if (shouldSelect) SelectSurfacePoint(pointer);
    }

    private void OnPointerMove(object sender, MouseEventArgs eventArgs)
    {
        if (_lastPointer is not { } previous || eventArgs.LeftButton != MouseButtonState.Pressed) return;
        var current = eventArgs.GetPosition(this);
        if ((current - previous).Length > 2) _isOrbiting = true;
        _yaw.Angle = NormalizeAngle(_yaw.Angle + current.X - previous.X);
        _pitch.Angle = NormalizeAngle(_pitch.Angle + current.Y - previous.Y);
        _lastPointer = current;
    }

    private void SelectSurfacePoint(Point pointer)
    {
        if (_surfaceModel is null || _sourceRows is null || _sourceColumns is null || _sourceValues is null) return;
        RayMeshGeometry3DHitTestResult? hit = null;
        VisualTreeHelper.HitTest(_viewport, null, result =>
        {
            if (result is RayMeshGeometry3DHitTestResult candidate && ReferenceEquals(candidate.ModelHit, _surfaceModel))
            {
                hit = candidate;
                return HitTestResultBehavior.Stop;
            }
            return HitTestResultBehavior.Continue;
        }, new PointHitTestParameters(pointer));
        if (hit is null) return;
        var columns = _sourceColumns.Length;
        var vertexIndex = hit.VertexWeight1 >= hit.VertexWeight2 && hit.VertexWeight1 >= hit.VertexWeight3
            ? hit.VertexIndex1
            : hit.VertexWeight2 >= hit.VertexWeight3 ? hit.VertexIndex2 : hit.VertexIndex3;
        var row = Math.Clamp(vertexIndex / columns, 0, _sourceRows.Length - 1);
        var column = Math.Clamp(vertexIndex % columns, 0, columns - 1);
        var sourceRow = _sourceRows[row];
        var sourceColumn = _sourceColumns[column];
        var value = _sourceValues[sourceRow, sourceColumn];
        var xAxis = _xAxisValues is not null && sourceColumn < _xAxisValues.Count ? _xAxisValues[sourceColumn].ToString("G7", CultureInfo.InvariantCulture) : (sourceColumn + 1).ToString(CultureInfo.InvariantCulture);
        var yAxis = _yAxisValues is not null && sourceRow < _yAxisValues.Count ? _yAxisValues[sourceRow].ToString("G7", CultureInfo.InvariantCulture) : (sourceRow + 1).ToString(CultureInfo.InvariantCulture);
        _selectionText.Text = string.Create(CultureInfo.InvariantCulture, $"{_xAxisName} {xAxis}   {_yAxisName} {yAxis}   {_zAxisName} {value:G8}");
        AddSelectionMarker(column, row, value);
        CellSelected?.Invoke(this, new MapSurfaceCellSelectedEventArgs(sourceRow, sourceColumn, value));
    }

    private void AddSelectionMarker(int column, int row, double value)
    {
        if (_mapLayer is null || _sourceValues is null || _sourceRows is null || _sourceColumns is null) return;
        if (_selectionMarker is not null) _mapLayer.Children.Remove(_selectionMarker);
        var values = _sourceValues.Cast<double>().Where(double.IsFinite).ToArray();
        var height = values.Length == 0 ? 0 : Normalize(value, values.Min(), Math.Max(values.Max() - values.Min(), 1e-10)) * 1.34;
        var x = ((column / (_sourceColumns.Length - 1d)) - .5) * 2.5;
        var z = ((row / (_sourceRows.Length - 1d)) - .5) * 2.0;
        _selectionMarker = CreateSelectionCursor(x, z, height);
        _mapLayer.Children.Add(_selectionMarker);
    }

    private static Model3DGroup CreateSelectionCursor(double x, double z, double height)
    {
        var group = new Model3DGroup();
        var bright = new EmissiveMaterial(new SolidColorBrush(Color.FromRgb(232, 242, 248)));
        var accent = new EmissiveMaterial(new SolidColorBrush(Color.FromRgb(51, 223, 216)));
        const double edge = .009;
        group.Children.Add(CreateBox(x - edge, x + edge, -.03, height + .08, z - edge, z + edge, bright));
        group.Children.Add(CreateBox(-1.25, 1.25, height + .072, height + .086, z - edge, z + edge, bright));
        group.Children.Add(CreateBox(x - edge, x + edge, height + .072, height + .086, -1.0, 1.0, bright));
        group.Children.Add(CreateBox(x - .042, x + .042, height + .084, height + .112, z - .042, z + .042, accent));
        return group;
    }
    private void OnMouseWheel(object sender, MouseWheelEventArgs eventArgs) { _distance = Math.Clamp(_distance - eventArgs.Delta / 480d, 2.6, 8); _camera.Position = new Point3D(0, 1.62, _distance); }

    private void OnMouseDoubleClick(object sender, MouseButtonEventArgs eventArgs)
    {
        _yaw.Angle = 32;
        _pitch.Angle = -34;
        _distance = 4.25;
        _camera.Position = new Point3D(0, 1.62, _distance);
        eventArgs.Handled = true;
    }

    private static double NormalizeAngle(double angle)
    {
        angle %= 360;
        return angle < -180 ? angle + 360 : angle > 180 ? angle - 360 : angle;
    }
}

public sealed record MapSurfaceCellSelectedEventArgs(int Row, int Column, double Value);
