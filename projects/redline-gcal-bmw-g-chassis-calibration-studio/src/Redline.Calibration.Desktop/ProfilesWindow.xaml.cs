using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Win32;
using Redline.Calibration.Domain;
using Redline.Calibration.Persistence;

namespace Redline.Calibration.Desktop;

public partial class ProfilesWindow : Window
{
    private readonly LocalProfileStore _store;
    private readonly ProfileReviewExporter _reviewExporter = new();
    private readonly ObservableCollection<CustomerProfile> _customers = new();
    private readonly ObservableCollection<VehicleProfile> _vehicles = new();
    private readonly ObservableCollection<EngineBuildProfile> _builds = new();
    private readonly ObservableCollection<MeasurementRow> _measurements = new();
    private readonly ObservableCollection<FastenerRow> _fasteners = new();
    private readonly ObservableCollection<HardwareRow> _hardware = new();
    private readonly ObservableCollection<ProfileAsset> _assets = new();
    private CustomerProfile? _customer;
    private VehicleProfile? _vehicle;
    private EngineBuildProfile? _build;
    private bool _suppressSelection;

    public ProfilesWindow(LocalProfileStore store)
    {
        _store = store ?? throw new ArgumentNullException(nameof(store));
        InitializeComponent();
        VaultPathText.Text = store.DatabasePath;
        CustomerCombo.ItemsSource = _customers;
        VehicleList.ItemsSource = _vehicles;
        BuildList.ItemsSource = _builds;
        MeasurementsGrid.ItemsSource = _measurements;
        FastenersGrid.ItemsSource = _fasteners;
        HardwareGrid.ItemsSource = _hardware;
        AssetsGrid.ItemsSource = _assets;
        Loaded += ProfilesWindow_Loaded;
    }

    private async void ProfilesWindow_Loaded(object sender, RoutedEventArgs eventArgs)
    {
        Loaded -= ProfilesWindow_Loaded;
        await ReloadCustomersAsync();
        if (_customers.Count == 0) CreateNewCustomerDraft();
    }

    private async Task ReloadCustomersAsync(string? selectCustomerId = null, string? selectVehicleId = null, string? selectBuildId = null)
    {
        try
        {
            _suppressSelection = true;
            _customers.Clear();
            foreach (var customer in await _store.GetCustomersAsync()) _customers.Add(customer);
            var selected = _customers.FirstOrDefault(row => row.Id == selectCustomerId) ?? _customers.FirstOrDefault();
            CustomerCombo.SelectedItem = selected;
            _suppressSelection = false;
            if (selected is not null) await SelectCustomerAsync(selected, selectVehicleId, selectBuildId);
            ProfileStatusText.Text = $"{_customers.Count:N0} CUSTOMER PROFILE(S) · LOCAL ONLY";
        }
        catch (Exception exception)
        {
            _suppressSelection = false;
            ShowError(exception);
        }
    }

    private async void CustomerCombo_SelectionChanged(object sender, SelectionChangedEventArgs eventArgs)
    {
        if (_suppressSelection || CustomerCombo.SelectedItem is not CustomerProfile selected) return;
        await SelectCustomerAsync(selected);
    }

    private async Task SelectCustomerAsync(CustomerProfile customer, string? vehicleId = null, string? buildId = null)
    {
        _customer = customer;
        PopulateCustomer(customer);
        _suppressSelection = true;
        _vehicles.Clear();
        foreach (var vehicle in await _store.GetVehiclesAsync(customer.Id)) _vehicles.Add(vehicle);
        var selected = _vehicles.FirstOrDefault(row => row.Id == vehicleId) ?? _vehicles.FirstOrDefault();
        VehicleList.SelectedItem = selected;
        _suppressSelection = false;
        if (selected is not null) await SelectVehicleAsync(selected, buildId);
        else CreateNewVehicleDraft();
    }

    private async void VehicleList_SelectionChanged(object sender, SelectionChangedEventArgs eventArgs)
    {
        if (_suppressSelection || VehicleList.SelectedItem is not VehicleProfile selected) return;
        await SelectVehicleAsync(selected);
    }

    private async Task SelectVehicleAsync(VehicleProfile vehicle, string? buildId = null)
    {
        _vehicle = vehicle;
        PopulateVehicle(vehicle);
        _suppressSelection = true;
        _builds.Clear();
        foreach (var build in await _store.GetBuildsAsync(vehicle.Id)) _builds.Add(build);
        var selected = _builds.FirstOrDefault(row => row.Id == buildId) ?? _builds.FirstOrDefault();
        BuildList.SelectedItem = selected;
        _suppressSelection = false;
        if (selected is not null) await SelectBuildAsync(selected);
        else CreateNewBuildDraft();
    }

    private async void BuildList_SelectionChanged(object sender, SelectionChangedEventArgs eventArgs)
    {
        if (_suppressSelection || BuildList.SelectedItem is not EngineBuildProfile selected) return;
        await SelectBuildAsync(selected);
    }

    private async Task SelectBuildAsync(EngineBuildProfile build)
    {
        try
        {
            var document = await _store.GetDocumentAsync(build.Id);
            _customer = document.Customer;
            _vehicle = document.Vehicle;
            _build = document.Build;
            PopulateCustomer(document.Customer);
            PopulateVehicle(document.Vehicle);
            PopulateBuild(document.Build);
            ReplaceRows(document.Measurements, document.FastenerEvents, document.Hardware);
            await ReloadAssetsAsync(document.Build.Id);
            ProfileStatusText.Text = $"LOADED {document.Vehicle.DisplayName} · BUILD REV {document.Build.Revision}";
        }
        catch (Exception exception)
        {
            ShowError(exception);
        }
    }

    private void NewCustomer_Click(object sender, RoutedEventArgs eventArgs) => CreateNewCustomerDraft();

    private void NewVehicle_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_customer is null)
        {
            MessageBox.Show(this, "Create and save a customer profile first.", "Customer required", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        CreateNewVehicleDraft();
    }

    private void NewBuild_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_vehicle is null)
        {
            MessageBox.Show(this, "Create and save a vehicle profile first.", "Vehicle required", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        CreateNewBuildDraft();
    }

    private void CreateNewCustomerDraft()
    {
        var now = DateTimeOffset.UtcNow;
        _customer = new CustomerProfile(NewId(), string.Empty, null, null, null, null, now, now);
        PopulateCustomer(_customer);
        _suppressSelection = true;
        CustomerCombo.SelectedItem = null;
        _vehicles.Clear();
        _builds.Clear();
        _suppressSelection = false;
        CreateNewVehicleDraft();
        CustomerNameBox.Focus();
        ProfileStatusText.Text = "NEW CUSTOMER PROFILE · UNSAVED";
    }

    private void CreateNewVehicleDraft()
    {
        if (_customer is null) return;
        var now = DateTimeOffset.UtcNow;
        _vehicle = new VehicleProfile(NewId(), _customer.Id, string.Empty, null, null, "BMW", string.Empty, null, "B58", null, null, null, now, now);
        PopulateVehicle(_vehicle);
        _suppressSelection = true;
        VehicleList.SelectedItem = null;
        _builds.Clear();
        _suppressSelection = false;
        CreateNewBuildDraft();
        ProfileStatusText.Text = "NEW VEHICLE PROFILE · UNSAVED";
    }

    private void CreateNewBuildDraft()
    {
        if (_vehicle is null) return;
        var now = DateTimeOffset.UtcNow;
        var revision = _builds.Count == 0 ? 1 : _builds.Max(row => row.Revision) + 1;
        var engineCode = _vehicle.EngineFamily.Equals("S58", StringComparison.OrdinalIgnoreCase) ? "S58" : "B58";
        _build = new EngineBuildProfile(
            NewId(), _vehicle.Id, revision, $"{engineCode} build", "Draft", engineCode, 6, 7,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, now, now);
        PopulateBuild(_build);
        ReplaceRows(
            Array.Empty<BuildMeasurement>(),
            Array.Empty<BuildFastenerEvent>(),
            EngineBuildTemplate.CreateHardware(_build.Id));
        _assets.Clear();
        _suppressSelection = true;
        BuildList.SelectedItem = null;
        _suppressSelection = false;
        ProfileStatusText.Text = $"NEW BUILD REVISION {revision} · UNSAVED";
    }

    private async void Save_Click(object sender, RoutedEventArgs eventArgs)
    {
        try
        {
            CommitGrids();
            var now = DateTimeOffset.UtcNow;
            var customer = ReadCustomer(now);
            var vehicle = ReadVehicle(customer.Id, now);
            var build = ReadBuild(vehicle.Id, now);
            var document = new EngineBuildDocument(
                customer,
                vehicle,
                build,
                _measurements.Select((row, index) => row.ToRecord(build.Id, index)).ToArray(),
                _fasteners.Select((row, index) => row.ToRecord(build.Id, index)).ToArray(),
                _hardware.Select((row, index) => row.ToRecord(build.Id, index)).ToArray());
            await _store.SaveDocumentAsync(document);
            _customer = customer;
            _vehicle = vehicle;
            _build = build;
            await ReloadCustomersAsync(customer.Id, vehicle.Id, build.Id);
            ProfileStatusText.Text = $"SAVED · {vehicle.DisplayName} · BUILD REV {build.Revision}";
        }
        catch (Exception exception)
        {
            ShowError(exception);
        }
    }

    private async void ExportReview_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_build is null || BuildList.SelectedItem is not EngineBuildProfile)
        {
            MessageBox.Show(this, "Save the build revision before exporting its AI profile.", "Saved build required", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        var dialog = new SaveFileDialog
        {
            Title = "Export structured calibration review profile",
            Filter = "GCAL review profile (*.gcal-review.json)|*.gcal-review.json|JSON files (*.json)|*.json",
            FileName = $"{_vehicle?.DisplayName ?? "vehicle"}_build-r{_build.Revision}.gcal-review.json",
            AddExtension = true,
            OverwritePrompt = true
        };
        if (dialog.ShowDialog(this) != true) return;
        if (File.Exists(dialog.FileName))
        {
            MessageBox.Show(this, "Review exports are immutable. Choose a new filename.", "Export blocked", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }
        try
        {
            var document = await _store.GetDocumentAsync(_build.Id);
            var assets = await _store.GetAssetsAsync(_build.Id);
            await _reviewExporter.ExportAsync(document, assets, dialog.FileName);
            ProfileStatusText.Text = $"AI PROFILE EXPORTED · {assets.Count:N0} HASHED ASSET REFERENCE(S)";
        }
        catch (Exception exception)
        {
            ShowError(exception);
        }
    }

    private CustomerProfile ReadCustomer(DateTimeOffset now)
    {
        var name = Required(CustomerNameBox.Text, "Customer display name");
        return new CustomerProfile(_customer?.Id ?? NewId(), name, Null(CustomerCompanyBox.Text), Null(CustomerEmailBox.Text),
            Null(CustomerPhoneBox.Text), Null(CustomerNotesBox.Text), _customer?.CreatedUtc ?? now, now);
    }

    private VehicleProfile ReadVehicle(string customerId, DateTimeOffset now)
    {
        var name = Required(VehicleNameBox.Text, "Vehicle profile name");
        var make = Required(VehicleMakeBox.Text, "Vehicle make");
        var model = Required(VehicleModelBox.Text, "Vehicle model");
        var family = Required(VehicleEngineFamilyBox.Text, "Engine family");
        return new VehicleProfile(_vehicle?.Id ?? NewId(), customerId, name, Null(VehicleVinBox.Text), NullableInteger(VehicleYearBox.Text, "Model year"),
            make, model, Null(VehicleChassisBox.Text), family, Null(VehicleTransmissionBox.Text), Null(VehicleOdometerBox.Text),
            Null(VehicleNotesBox.Text), _vehicle?.CreatedUtc ?? now, now);
    }

    private EngineBuildProfile ReadBuild(string vehicleId, DateTimeOffset now)
    {
        var cylinders = PositiveInteger(BuildCylinderCountBox.Text, "Cylinder count");
        var mains = PositiveInteger(BuildMainCountBox.Text, "Main journal count");
        return new EngineBuildProfile(
            _build?.Id ?? NewId(), vehicleId, PositiveInteger(BuildRevisionBox.Text, "Build revision"),
            Required(BuildNameBox.Text, "Build name"), Required(BuildStatusBox.Text, "Build status"), Required(BuildEngineCodeBox.Text, "Engine code"),
            cylinders, mains, Number(BuildDisplacementBox.Text, "Displacement"), Number(BuildBoreBox.Text, "Bore"), Number(BuildStrokeBox.Text, "Stroke"),
            Number(BuildCompressionBox.Text, "Compression ratio"), Null(BuildBlockBox.Text), Null(BuildHeadBox.Text), Null(BuildCrankBox.Text),
            Null(BuildRodsBox.Text), Null(BuildPistonsBox.Text), Null(BuildGasketBox.Text), Number(BuildGasketThicknessBox.Text, "Head gasket thickness"),
            Null(BuildFuelBox.Text), Null(BuildBuilderBox.Text), BuildAssemblyDatePicker.SelectedDate.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(BuildAssemblyDatePicker.SelectedDate.Value, DateTimeKind.Local)).ToUniversalTime()
                : null,
            Null(BuildNotesBox.Text), _build?.CreatedUtc ?? now, now);
    }

    private void PopulateCustomer(CustomerProfile row)
    {
        CustomerNameBox.Text = row.DisplayName;
        CustomerCompanyBox.Text = row.Company ?? string.Empty;
        CustomerEmailBox.Text = row.Email ?? string.Empty;
        CustomerPhoneBox.Text = row.Phone ?? string.Empty;
        CustomerNotesBox.Text = row.Notes ?? string.Empty;
    }

    private void PopulateVehicle(VehicleProfile row)
    {
        VehicleNameBox.Text = row.DisplayName;
        VehicleVinBox.Text = row.Vin ?? string.Empty;
        VehicleYearBox.Text = row.ModelYear?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;
        VehicleMakeBox.Text = row.Make;
        VehicleModelBox.Text = row.Model;
        VehicleChassisBox.Text = row.Chassis ?? string.Empty;
        VehicleEngineFamilyBox.Text = row.EngineFamily;
        VehicleTransmissionBox.Text = row.Transmission ?? string.Empty;
        VehicleOdometerBox.Text = row.Odometer ?? string.Empty;
        VehicleNotesBox.Text = row.Notes ?? string.Empty;
    }

    private void PopulateBuild(EngineBuildProfile row)
    {
        BuildNameBox.Text = row.Name;
        BuildRevisionBox.Text = row.Revision.ToString(CultureInfo.InvariantCulture);
        BuildStatusBox.Text = row.Status;
        BuildEngineCodeBox.Text = row.EngineCode;
        BuildCylinderCountBox.Text = row.CylinderCount.ToString(CultureInfo.InvariantCulture);
        BuildMainCountBox.Text = row.MainJournalCount.ToString(CultureInfo.InvariantCulture);
        BuildDisplacementBox.Text = Format(row.DisplacementCc);
        BuildBoreBox.Text = Format(row.BoreMm);
        BuildStrokeBox.Text = Format(row.StrokeMm);
        BuildCompressionBox.Text = Format(row.CompressionRatio);
        BuildBlockBox.Text = row.Block ?? string.Empty;
        BuildHeadBox.Text = row.CylinderHead ?? string.Empty;
        BuildCrankBox.Text = row.Crankshaft ?? string.Empty;
        BuildRodsBox.Text = row.ConnectingRods ?? string.Empty;
        BuildPistonsBox.Text = row.Pistons ?? string.Empty;
        BuildGasketBox.Text = row.HeadGasket ?? string.Empty;
        BuildGasketThicknessBox.Text = Format(row.HeadGasketThicknessMm);
        BuildFuelBox.Text = row.Fuel ?? string.Empty;
        BuildBuilderBox.Text = row.Builder ?? string.Empty;
        BuildAssemblyDatePicker.SelectedDate = row.AssemblyDateUtc?.LocalDateTime.Date;
        BuildNotesBox.Text = row.Notes ?? string.Empty;
    }

    private void ReplaceRows(
        IReadOnlyList<BuildMeasurement> measurements,
        IReadOnlyList<BuildFastenerEvent> fasteners,
        IReadOnlyList<BuildHardwareComponent> hardware)
    {
        _measurements.Clear();
        foreach (var row in measurements) _measurements.Add(new MeasurementRow(row));
        _fasteners.Clear();
        foreach (var row in fasteners) _fasteners.Add(new FastenerRow(row));
        _hardware.Clear();
        foreach (var row in hardware) _hardware.Add(new HardwareRow(row));
    }

    private void AddMeasurement_Click(object sender, RoutedEventArgs eventArgs) => _measurements.Add(new MeasurementRow());
    private void DeleteMeasurement_Click(object sender, RoutedEventArgs eventArgs) { if (MeasurementsGrid.SelectedItem is MeasurementRow row) _measurements.Remove(row); }
    private void ClearMeasurements_Click(object sender, RoutedEventArgs eventArgs) => _measurements.Clear();
    private void AddFastener_Click(object sender, RoutedEventArgs eventArgs) => _fasteners.Add(new FastenerRow());
    private void DeleteFastener_Click(object sender, RoutedEventArgs eventArgs) { if (FastenersGrid.SelectedItem is FastenerRow row) _fasteners.Remove(row); }
    private void ClearFasteners_Click(object sender, RoutedEventArgs eventArgs) => _fasteners.Clear();
    private void AddHardware_Click(object sender, RoutedEventArgs eventArgs) => _hardware.Add(new HardwareRow());
    private void DeleteHardware_Click(object sender, RoutedEventArgs eventArgs) { if (HardwareGrid.SelectedItem is HardwareRow row) _hardware.Remove(row); }

    private async void ImportAssets_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_vehicle is null || _build is null || BuildList.SelectedItem is not EngineBuildProfile)
        {
            MessageBox.Show(this, "Save the customer, vehicle, and build revision before importing files.", "Saved build required", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var dialog = new OpenFileDialog
        {
            Title = "Import calibration files into the local profile vault",
            Filter = "Calibration files (*.bin;*.xdf;*.csv)|*.bin;*.xdf;*.csv|All files (*.*)|*.*",
            Multiselect = true,
            CheckFileExists = true
        };
        if (dialog.ShowDialog(this) != true) return;
        try
        {
            foreach (var path in dialog.FileNames)
            {
                var kind = Path.GetExtension(path).ToLowerInvariant() switch
                {
                    ".bin" => "BIN",
                    ".xdf" => "XDF",
                    ".csv" => "LOG",
                    _ => "FILE"
                };
                await _store.ImportAssetAsync(_vehicle.Id, _build.Id, path, kind);
            }
            await ReloadAssetsAsync(_build.Id);
            ProfileStatusText.Text = $"IMPORTED {dialog.FileNames.Length:N0} FILE(S) · {_assets.Count:N0} ATTACHED";
        }
        catch (Exception exception)
        {
            ShowError(exception);
        }
    }

    private async Task ReloadAssetsAsync(string buildId)
    {
        _assets.Clear();
        foreach (var asset in await _store.GetAssetsAsync(buildId)) _assets.Add(asset);
    }

    private void CommitGrids()
    {
        foreach (var grid in new[] { MeasurementsGrid, FastenersGrid, HardwareGrid })
        {
            grid.CommitEdit(DataGridEditingUnit.Cell, true);
            grid.CommitEdit(DataGridEditingUnit.Row, true);
        }
    }

    private void ShowError(Exception exception)
    {
        ProfileStatusText.Text = exception.Message;
        MessageBox.Show(this, exception.Message, "Profile operation failed", MessageBoxButton.OK, MessageBoxImage.Error);
    }

    private static string NewId() => Guid.NewGuid().ToString("N");
    private static string Required(string? value, string field) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new InvalidDataException($"{field} is required.");
    private static string? Null(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string Format(decimal? value) => value?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;
    private static int PositiveInteger(string value, string field) => int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed > 0 ? parsed : throw new InvalidDataException($"{field} must be a positive integer.");
    private static int? NullableInteger(string value, string field) => string.IsNullOrWhiteSpace(value) ? null : int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) ? parsed : throw new InvalidDataException($"{field} must be an integer.");
    internal static decimal? Number(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (decimal.TryParse(value, NumberStyles.Number, CultureInfo.CurrentCulture, out var parsed)
            || decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out parsed)) return parsed;
        throw new InvalidDataException($"{field} must be a decimal number.");
    }

    internal static DateTimeOffset? Date(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return DateTimeOffset.TryParse(value, CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out var parsed)
            ? parsed.ToUniversalTime()
            : throw new InvalidDataException($"{field} must be a valid date/time.");
    }
}

public sealed class MeasurementRow
{
    public MeasurementRow() { Id = Guid.NewGuid().ToString("N"); }
    public MeasurementRow(BuildMeasurement row)
    {
        Id = row.Id; System = row.System; Component = row.Component; Position = row.Position; Specification = row.Specification;
        TargetValue = Format(row.TargetValue); ActualValue = Format(row.ActualValue); MinimumValue = Format(row.MinimumValue);
        MaximumValue = Format(row.MaximumValue); Unit = row.Unit; Method = row.Method; Instrument = row.Instrument; Source = row.Source; Notes = row.Notes;
    }
    public string Id { get; set; }
    public string? System { get; set; }
    public string? Component { get; set; }
    public string? Position { get; set; }
    public string? Specification { get; set; }
    public string? TargetValue { get; set; }
    public string? ActualValue { get; set; }
    public string? MinimumValue { get; set; }
    public string? MaximumValue { get; set; }
    public string? Unit { get; set; }
    public string? Method { get; set; }
    public string? Instrument { get; set; }
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public BuildMeasurement ToRecord(string buildId, int order) => new(
        Id, buildId, Required(System, "Measurement system"), Required(Component, "Measurement component"), Required(Position, "Measurement position"),
        Required(Specification, "Measurement specification"), ProfilesWindow.Number(TargetValue, "Measurement target"), ProfilesWindow.Number(ActualValue, "Measurement actual"),
        ProfilesWindow.Number(MinimumValue, "Measurement minimum"), ProfilesWindow.Number(MaximumValue, "Measurement maximum"), Required(Unit, "Measurement unit"),
        Null(Method), Null(Instrument), Null(Source), Null(Notes), order);
    private static string Format(decimal? value) => value?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;
    private static string Required(string? value, string field) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new InvalidDataException($"{field} is required.");
    private static string? Null(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class FastenerRow
{
    public FastenerRow() { Id = Guid.NewGuid().ToString("N"); InstallationCycle = "1"; }
    public FastenerRow(BuildFastenerEvent row)
    {
        Id = row.Id; FastenerGroup = row.FastenerGroup; Position = row.Position; Manufacturer = row.Manufacturer; PartNumber = row.PartNumber;
        InstallationCycle = row.InstallationCycle.ToString(CultureInfo.InvariantCulture); TorqueNm = Format(row.TorqueNm); AngleDegrees = Format(row.AngleDegrees);
        StretchMm = Format(row.StretchMm); Lubricant = row.Lubricant; ProcedureSource = row.ProcedureSource; PerformedUtc = row.PerformedUtc?.ToString("O");
        Technician = row.Technician; Notes = row.Notes;
    }
    public string Id { get; set; }
    public string? FastenerGroup { get; set; }
    public string? Position { get; set; }
    public string? Manufacturer { get; set; }
    public string? PartNumber { get; set; }
    public string? InstallationCycle { get; set; }
    public string? TorqueNm { get; set; }
    public string? AngleDegrees { get; set; }
    public string? StretchMm { get; set; }
    public string? Lubricant { get; set; }
    public string? ProcedureSource { get; set; }
    public string? PerformedUtc { get; set; }
    public string? Technician { get; set; }
    public string? Notes { get; set; }
    public BuildFastenerEvent ToRecord(string buildId, int order) => new(
        Id, buildId, Required(FastenerGroup, "Fastener group"), Required(Position, "Fastener position"), Null(Manufacturer), Null(PartNumber),
        int.TryParse(InstallationCycle, out var cycle) && cycle > 0 ? cycle : throw new InvalidDataException("Fastener cycle must be a positive integer."),
        ProfilesWindow.Number(TorqueNm, "Fastener torque"), ProfilesWindow.Number(AngleDegrees, "Fastener angle"), ProfilesWindow.Number(StretchMm, "Fastener stretch"),
        Null(Lubricant), Null(ProcedureSource), ProfilesWindow.Date(PerformedUtc, "Fastener performed time"), Null(Technician), Null(Notes), order);
    private static string Format(decimal? value) => value?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;
    private static string Required(string? value, string field) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new InvalidDataException($"{field} is required.");
    private static string? Null(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class HardwareRow
{
    public HardwareRow() { Id = Guid.NewGuid().ToString("N"); }
    public HardwareRow(BuildHardwareComponent row)
    {
        Id = row.Id; System = row.System; ComponentType = row.ComponentType; Manufacturer = row.Manufacturer; Model = row.Model;
        PartNumber = row.PartNumber; SerialNumber = row.SerialNumber; RatedValue = row.RatedValue?.ToString(CultureInfo.InvariantCulture);
        RatedUnit = row.RatedUnit; CalibrationData = row.CalibrationData; Notes = row.Notes;
    }
    public string Id { get; set; }
    public string? System { get; set; }
    public string? ComponentType { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? PartNumber { get; set; }
    public string? SerialNumber { get; set; }
    public string? RatedValue { get; set; }
    public string? RatedUnit { get; set; }
    public string? CalibrationData { get; set; }
    public string? Notes { get; set; }
    public BuildHardwareComponent ToRecord(string buildId, int order) => new(
        Id, buildId, Required(System, "Hardware system"), Required(ComponentType, "Hardware component type"), Null(Manufacturer), Null(Model),
        Null(PartNumber), Null(SerialNumber), ProfilesWindow.Number(RatedValue, "Hardware rated value"), Null(RatedUnit), Null(CalibrationData), Null(Notes), order);
    private static string Required(string? value, string field) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new InvalidDataException($"{field} is required.");
    private static string? Null(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
