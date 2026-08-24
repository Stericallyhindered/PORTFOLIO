using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Data;
using System.Windows.Threading;
using Microsoft.Win32;
using Redline.Calibration.Binary;
using Redline.Calibration.Definitions.Xdf;
using Redline.Calibration.Diagnostics;
using Redline.Calibration.Logs;
using Redline.Calibration.Persistence;

namespace Redline.Calibration.Desktop;

public partial class MainWindow : Window
{
    private readonly XdfParser _xdfParser = new();
    private readonly XdfTableAccessor _tableAccessor = new();
    private readonly XdfCatalogExporter _xdfCatalogExporter = new();
    private readonly XdfBinaryVerifier _xdfBinaryVerifier = new();
    private readonly MapValueHeatBrushConverter _mapValueHeatBrushConverter = new();
    private readonly MhdLogParser _logParser = new();
    private readonly ObservableCollection<TableListItem> _visibleTables = new();
    private readonly List<TableListItem> _allTables = new();
    private readonly ObservableCollection<LogTraceSelection> _visibleLogTraces = new();
    private readonly ObservableCollection<LogTraceSelection> _activeLogTraces = new();
    private readonly List<LogTraceSelection> _allLogTraces = new();
    private readonly ObservableCollection<FlashAdapterListItem> _flashAdapters = new();
    private CalibrationBinaryDocument? _binary;
    private XdfDefinitionDocument? _definition;
    private XdfBinaryVerificationReport? _verification;
    private LogDataset? _log;
    private XdfTableDefinition? _selectedTable;
    private XdfTableData? _selectedData;
    private string? _binaryPath;
    private string? _definitionPath;
    private string? _logPath;
    private bool _busy;
    private bool _updatingLogSelection;
    private BmwEnetDiagnosticSession? _flashSession;
    private BmwEnetUdsClient? _flashClient;
    private DmeTranscriptStore? _flashTranscriptStore;
    private Guid _flashTranscriptId;
    private BmwEnetAdapter? _connectedAdapter;
    private MhdCommunicationProfile? _flashCommunication;
    private readonly List<DmeTranscriptEntry> _flashTraffic = [];

    public MainWindow()
    {
        InitializeComponent();
        TableListBox.ItemsSource = _visibleTables;
        LogChannelList.ItemsSource = _visibleLogTraces;
        ActiveTraceLegend.ItemsSource = _activeLogTraces;
        FlashAdapterList.ItemsSource = _flashAdapters;
        Loaded += MainWindow_Loaded;
        Closed += MainWindow_Closed;
    }

    private async void OpenBin_Click(object sender, RoutedEventArgs eventArgs)
    {
        var dialog = new OpenFileDialog
        {
            Title = "Open calibration binary",
            Filter = "Calibration binary (*.bin)|*.bin|All files (*.*)|*.*",
            CheckFileExists = true
        };
        if (dialog.ShowDialog(this) == true) await RunUiActionAsync(() => LoadBinaryAsync(dialog.FileName));
    }

    private async void Profiles_Click(object sender, RoutedEventArgs eventArgs)
    {
        await RunUiActionAsync(async () =>
        {
            var store = new LocalProfileStore(LocalProfileStore.DefaultVaultRoot);
            await store.InitializeAsync();
            var window = new ProfilesWindow(store) { Owner = this };
            window.ShowDialog();
            SetStatus($"Local profiles · {store.DatabasePath}", true);
        });
    }

    private async void OpenXdf_Click(object sender, RoutedEventArgs eventArgs)
    {
        var dialog = new OpenFileDialog
        {
            Title = "Open TunerPro definition",
            Filter = "TunerPro definition (*.xdf)|*.xdf|XML files (*.xml)|*.xml|All files (*.*)|*.*",
            CheckFileExists = true
        };
        if (dialog.ShowDialog(this) == true) await RunUiActionAsync(() => LoadDefinitionAsync(dialog.FileName));
    }

    private async void OpenLog_Click(object sender, RoutedEventArgs eventArgs)
    {
        var dialog = new OpenFileDialog
        {
            Title = "Open MHD log",
            Filter = "CSV log (*.csv)|*.csv|All files (*.*)|*.*",
            CheckFileExists = true
        };
        if (dialog.ShowDialog(this) == true) await RunUiActionAsync(() => LoadLogAsync(dialog.FileName));
    }

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs eventArgs)
    {
        if (eventArgs.LeftButton == MouseButtonState.Pressed) DragMove();
    }

    private void WindowMinimize_Click(object sender, RoutedEventArgs eventArgs) => WindowState = WindowState.Minimized;

    private void WindowMaximize_Click(object sender, RoutedEventArgs eventArgs) =>
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void WindowClose_Click(object sender, RoutedEventArgs eventArgs) => Close();

    private async void ExportXdfCatalog_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_definition is null)
        {
            SetStatus("Open an XDF before exporting its catalog.", false);
            return;
        }

        var sourceName = Path.GetFileNameWithoutExtension(_definition.Source.FileName);
        var dialog = new SaveFileDialog
        {
            Title = "Export AI-readable XDF catalog",
                Filter = "GCAL XDF catalog (*.gcal-xdf-catalog.json)|*.gcal-xdf-catalog.json|JSON files (*.json)|*.json",
            FileName = $"{sourceName}.xdf-catalog.json",
            AddExtension = true,
            OverwritePrompt = true
        };
        if (dialog.ShowDialog(this) != true) return;
        if (File.Exists(dialog.FileName))
        {
            MessageBox.Show(this, "Catalog exports are immutable. Choose a new filename.", "Export blocked", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        await RunUiActionAsync(async () =>
        {
            await _xdfCatalogExporter.ExportAsync(_definition, dialog.FileName);
            SetStatus($"XDF catalog exported · {_definition.Tables.Count:N0} tables · {_definition.Flags.Count:N0} flags", true);
        });
    }

    private async void OpenFixture_Click(object sender, RoutedEventArgs eventArgs)
    {
        await RunUiActionAsync(() => LoadFixtureAsync(openLogWorkbench: false));
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs eventArgs)
    {
        Loaded -= MainWindow_Loaded;
        var arguments = Environment.GetCommandLineArgs();
        if (arguments.Contains("--fixture-log", StringComparer.OrdinalIgnoreCase))
        {
            await RunUiActionAsync(() => LoadFixtureAsync(openLogWorkbench: true));
        }
        else if (arguments.Contains("--fixture", StringComparer.OrdinalIgnoreCase))
        {
            await RunUiActionAsync(() => LoadFixtureAsync(openLogWorkbench: false));
        }
    }

    private async void DiscoverAdapters_Click(object sender, RoutedEventArgs eventArgs)
    {
        await RunUiActionAsync(async () =>
        {
            FlashStateText.Text = "DISCOVERING · UDP 6811";
            AppendFlashTrace("Broadcasting MHD-compatible DIAGADR10 discovery probe on active IPv4 interfaces.");
            var adapters = await BmwEnetAdapterDiscovery.DiscoverAsync(TimeSpan.FromSeconds(3));
            _flashAdapters.Clear();
            foreach (var adapter in adapters) _flashAdapters.Add(new FlashAdapterListItem(adapter));
            FlashAdapterList.SelectedIndex = _flashAdapters.Count > 0 ? 0 : -1;
            FlashStateText.Text = _flashAdapters.Count > 0
                ? $"DISCOVERY COMPLETE · {_flashAdapters.Count} ADAPTER(S)"
                : "NO ENET ADAPTER FOUND";
            FlashGateTitleText.Text = _flashAdapters.Count > 0
                ? "Select an adapter and establish the HSFZ diagnostic session."
                : "No adapter replied. Join the ENET Wi-Fi network or connect Ethernet, then scan again.";
            AppendFlashTrace(_flashAdapters.Count > 0
                ? $"Found {_flashAdapters.Count} adapter response(s)."
                : "No valid vehicle-identification response received within 3 seconds.");
            SetStatus(FlashStateText.Text, _flashAdapters.Count > 0);
        });
    }

    private async void ConnectAdapter_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (FlashAdapterList.SelectedItem is not FlashAdapterListItem selected)
        {
            SetStatus("Select a discovered ENET adapter first.", false);
            return;
        }

        await RunUiActionAsync(async () =>
        {
            if (_flashSession is not null) await _flashSession.DisposeAsync();
            _flashClient = null;
            _flashCommunication = null;
            _connectedAdapter = null;
            _flashTraffic.Clear();
            FlashStateText.Text = $"CONNECTING · {selected.Adapter.Address}:6801";
            AppendFlashTrace($"Opening TCP HSFZ diagnostic socket to {selected.Adapter.Address}:6801.");
            _flashSession = await BmwEnetDiagnosticSession.ConnectAsync(selected.Adapter, TimeSpan.FromSeconds(3));
            _flashClient = new BmwEnetUdsClient(_flashSession);
            _connectedAdapter = selected.Adapter;
            _flashTranscriptId = Guid.NewGuid();
            _flashTranscriptStore = new DmeTranscriptStore(Path.Combine(LocalProfileStore.DefaultVaultRoot, "dme-sessions"));
            _flashClient.Traffic += FlashClient_Traffic;

            AppendFlashTrace("Running MHD ENET connection handshake: tester present 3E 00, two attempts, 500 ms response timeout.");
            var handshake = await MhdEnetConnectionHandshake.DetectAsync(_flashClient);
            _flashCommunication = handshake.Communication;

            FlashStateText.Text = $"CONNECTED · MHD {handshake.Communication.Mode.ToString().ToUpperInvariant()} · {selected.Adapter.Address}:6801";
            FlashGateTitleText.Text = "MHD ENET handshake complete. Read DME to capture and verify the vehicle identity.";
            FlashTransportText.Text = $"HSFZ connected · {selected.Adapter.Address}:6801";
            FlashProfileText.Text = $"MHD {handshake.Communication.Mode.ToString().ToUpperInvariant()} auto-detected · adapter VIN {selected.Adapter.Identity.Vin ?? "not advertised"}";
            FlashWriteText.Text = "Communication profile detected automatically; DME identity preflight remains required.";
            AppendFlashTrace($"MHD HANDSHAKE PASS · cv.c · CT selected automatically · attempt {handshake.Attempts} · response {Convert.ToHexString(handshake.Response)}");
            SetStatus($"ENET connected · MHD {handshake.Communication.Mode.ToString().ToUpperInvariant()} detected automatically.", true);
        });
    }

    private async void ReadDme_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_flashClient is null || _connectedAdapter is null || _flashTranscriptStore is null)
        {
            SetStatus("Connect an ENET adapter before reading the DME.", false);
            return;
        }

        await RunUiActionAsync(async () =>
        {
            FlashStateText.Text = "READING DME · MG1 IDENTIFIERS";
            AppendFlashTrace("Reading MHD-observed MG1 DME identifiers; this is read-only.");
            var result = await Mg1DmeInterrogation.ReadAsync(_flashClient, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(10));
            await SaveFlashTranscriptAsync(result);
            var successes = result.Responses.Count(response => response.Failure is null);
            FlashStateText.Text = result.Succeeded
                ? $"DME READ COMPLETE · {successes}/{result.Responses.Count} IDENTIFIERS"
                : $"DME READ INCOMPLETE · {successes}/{result.Responses.Count} IDENTIFIERS";
            FlashProfileText.Text = result.Succeeded
                ? $"MG1 identity capture · {successes} DIDs"
                : "Identity capture incomplete · inspect transcript";
            FlashGateTitleText.Text = "DME replied. Profile matching is now based on captured DIDs, not adapter discovery alone.";
            FlashWriteText.Text = "Blocked: exact profile, read-back plan, checksum, and section validation still required.";
            AppendFlashTrace($"DME interrogation saved: {_flashTranscriptStore.CreatePath(_flashTranscriptId)}");
            SetStatus(FlashStateText.Text, result.Succeeded);
        });
    }

    private async void FlashLocalBin_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_flashClient is null || _connectedAdapter is null || _flashCommunication is null)
        {
            SetStatus("Complete the MHD ENET handshake before flashing a local BIN.", false);
            return;
        }

        if (_binary is null || _binary.Length != MhdB58Gen2FlashProfile.BinLength)
        {
            SetStatus("Load an 8 MiB B58 Gen 2 BIN before flashing.", false);
            return;
        }

        var communication = _flashCommunication;
        var confirmation = MessageBox.Show(
            this,
            $"This will connect to {_connectedAdapter.Address}, erase the selected DME sections, and program the loaded local BIN using MHD {communication.Mode.ToString().ToUpperInvariant()} bytes. Continue?",
            "Start MHD local BIN flash",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirmation != MessageBoxResult.Yes) return;

        await RunUiActionAsync(async () =>
        {
            FlashStateText.Text = "READING DME · PRE-FLASH IDENTITY";
            AppendFlashTrace("FLASH PREFLIGHT · reading the MHD MG1 identity DIDs before any write request.");
            var interrogation = await Mg1DmeInterrogation.ReadAsync(_flashClient, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(10));
            if (!interrogation.Succeeded)
            {
                await SaveFlashTranscriptAsync(interrogation);
                FlashWriteText.Text = "Blocked: pre-flash DME identity read was incomplete.";
                AppendFlashTrace("FLASH BLOCKED · pre-flash identity read incomplete; no erase request sent.");
                return;
            }
            await SaveFlashTranscriptAsync(interrogation);
            AppendFlashTrace("FLASH PREFLIGHT · DME identity read complete.");

            FlashStateText.Text = "READING DME · MHD FG PROFILE";
            AppendFlashTrace("FLASH PREFLIGHT · running the MHD FG unlock/profile probes.");
            var profile = await new MhdFgDmeProfileDetector(_flashClient).DetectAsync();
            AppendFlashTrace($"MHD FG PROFILE · {profile.UnlockStatus} · BTLD {profile.BtldSgbmNumber} · BOOTCTRL 0x{profile.BootControlVersion:X6} · {profile.Evidence}");

            var bin = _binary.ReadBytes(0, _binary.Length);
            var checksumBytes = bin.ToArray();
            var checksum = new Mg1LeChecksumProvider().ValidateAndUpdate(checksumBytes, _binary.SourceFingerprint);
            if (!checksum.FlashReady)
            {
                FlashWriteText.Text = $"Blocked: {checksum.Message}";
                AppendFlashTrace($"CHECKSUM BLOCKED · {checksum.Status} · {checksum.Message}");
                MessageBox.Show(this, checksum.Message, "BIN checksum preflight failed", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            var backupRoot = Path.Combine(LocalProfileStore.DefaultVaultRoot, "flash-input-snapshots");
            var backupPath = Path.Combine(backupRoot, $"{_connectedAdapter.Identity.Vin ?? "unknown-vin"}_{DateTime.Now:yyyyMMdd_HHmmss}_flash-input.bin");
            var journalRoot = Path.Combine(LocalProfileStore.DefaultVaultRoot, "flash-journals");
            var targetSoftware = _log?.SoftwareId ?? Path.GetFileNameWithoutExtension(_binaryPath) ?? MhdB58Gen2FlashProfile.M1SoftwareFamily;
            var flasher = new MhdB58Gen2Flasher(_flashClient, new FlashTransactionJournalStore(journalRoot));
            FlashStateText.Text = $"FLASHING · MHD {communication.Mode.ToString().ToUpperInvariant()}";
            FlashGateTitleText.Text = "MHD local BIN flash in progress. Do not disconnect power or the ENET adapter.";
            FlashWriteText.Text = "Programming active · erase, download, transfer, validate, reset";
            FlashSafetyText.Text = "LIVE DME WRITE ACTIVE · keep stable battery voltage and do not close GCAL.";
            AppendFlashTrace($"FLASH START · MHD {communication.Mode.ToString().ToUpperInvariant()} · BIN {_binaryPath}");
            AppendFlashTrace($"CHECKSUM PASS · {checksum.Message}");

            var result = await flasher.FlashAsync(
                checksumBytes,
                _connectedAdapter.Identity.Vin ?? "unknown-vin",
                targetSoftware,
                communication,
                backupPath,
                profile.UnlockStatus,
                new Progress<MhdFlashProgress>(value =>
                {
                    FlashStateText.Text = $"{value.Stage} · {value.Section} · {value.BytesSent:N0}/{value.SectionBytes:N0}";
                    AppendFlashTrace($"{value.Stage} · {value.Section} · {value.BytesSent}/{value.SectionBytes}");
                }));

            FlashStateText.Text = "FLASH COMPLETE · DME RESET ACKNOWLEDGED";
            FlashWriteText.Text = $"Complete · journal {result.JournalId:N} · backup saved";
            FlashSafetyText.Text = $"Completed. Flash input snapshot: {backupPath}";
            AppendFlashTrace($"FLASH COMPLETE · journal {result.JournalId:N} · input snapshot {backupPath}");
            SetStatus("MHD local BIN flash completed.", true);
        });
    }

    private async void ExtractOemBin_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_flashClient is null)
        {
            SetStatus("Connect to the DME before extracting the OEM BIN.", false);
            return;
        }

        var dialog = new SaveFileDialog
        {
            Title = "Save OEM DME base map",
            Filter = "Calibration binary (*.bin)|*.bin",
            FileName = $"{_connectedAdapter?.Identity.Vin ?? "dme"}_oem_base_{DateTime.Now:yyyyMMdd_HHmmss}.bin",
            AddExtension = true,
            OverwritePrompt = true
        };
        if (dialog.ShowDialog(this) != true) return;

        await RunUiActionAsync(async () =>
        {
            FlashStateText.Text = "READING DME · OEM BASE MAP";
            FlashWriteText.Text = "Read-only extraction active · no erase or write request is sent";
            FlashSafetyText.Text = "READ ONLY · extracting the OEM image from DME memory.";
            AppendFlashTrace($"OEM BIN EXTRACT START · destination {dialog.FileName}");
            var extractor = new MhdDmeBaseMapExtractor(_flashClient);
            var result = await extractor.ReadB58Gen2Async(
                dialog.FileName,
                new Progress<MhdDmeReadProgress>(value =>
                {
                    FlashStateText.Text = $"READING OEM BIN · {value.BytesRead:N0}/{value.TotalBytes:N0}";
                    AppendFlashTrace($"READ MEMORY · 0x{value.Address:X8} · {value.BytesRead:N0}/{value.TotalBytes:N0}");
                }));
            FlashStateText.Text = "OEM BIN EXTRACT COMPLETE";
            FlashWriteText.Text = $"Read-only OEM base map saved · {result.Sha256[..12]}";
            FlashSafetyText.Text = "READ ONLY COMPLETE · source BIN was not changed.";
            AppendFlashTrace($"OEM BIN EXTRACT COMPLETE · {result.Path} · SHA256 {result.Sha256}");
            SetStatus("OEM DME base map extracted and verified.", true);
        });
    }

    private async void MainWindow_Closed(object? sender, EventArgs eventArgs)
    {
        if (_flashSession is not null) await _flashSession.DisposeAsync();
    }

    private void FlashClient_Traffic(object? sender, UdsTrafficEventArgs traffic)
    {
        _flashTraffic.Add(new DmeTranscriptEntry(traffic.At, traffic.Direction, traffic.Payload));
        Dispatcher.BeginInvoke(() => AppendFlashTrace(
            $"{traffic.At:HH:mm:ss.fff} {(traffic.Direction == UdsTrafficDirection.Request ? "TX" : "RX")} {Convert.ToHexString(traffic.Payload)}"));
    }

    private Task SaveFlashTranscriptAsync(DmeInterrogationResult result)
    {
        if (_connectedAdapter is null || _flashTranscriptStore is null)
        {
            throw new InvalidOperationException("No DME transcript session is active.");
        }

        return _flashTranscriptStore.SaveAsync(new DmeSessionTranscript(
            _flashTranscriptId,
            DateTimeOffset.UtcNow,
            $"{_connectedAdapter.Address}:{BmwEnetAdapter.DefaultDiagnosticPort}",
            _connectedAdapter.Identity.Vin,
            _flashTraffic.ToArray(),
            result));
    }

    private void AppendFlashTrace(string message)
    {
        FlashTraceText.AppendText($"{DateTime.Now:HH:mm:ss.fff} {message}{Environment.NewLine}");
        FlashTraceText.ScrollToEnd();
    }

    private void CopyFlashTrace_Click(object sender, RoutedEventArgs eventArgs)
    {
        Clipboard.SetText(FlashTraceText.Text);
        SetStatus("Developer packet log copied to clipboard.", true);
    }

    private void ClearFlashTrace_Click(object sender, RoutedEventArgs eventArgs)
    {
        FlashTraceText.Clear();
        SetStatus("Developer packet console cleared.", true);
    }

    private async Task LoadFixtureAsync(bool openLogWorkbench)
    {
        var fixture = FindFixtureDirectory();
        if (fixture is null)
        {
            throw new DirectoryNotFoundException("The local B58 Gen 2 fixture directory was not found.");
        }

        await LoadDefinitionAsync(Path.Combine(fixture, "00005D55504809.xdf"));
        await LoadBinaryAsync(Path.Combine(fixture, "00005D55504809_b58o1_original.bin"));
        await LoadLogAsync(Path.Combine(fixture, "2024-01-20_M340i_MHD_00005D55504809.csv"));
        WorkspaceTabs.SelectedIndex = openLogWorkbench ? 2 : 1;
        SelectFirstReadableTable();
    }

    private async Task LoadBinaryAsync(string path)
    {
        SetStatus($"Opening {Path.GetFileName(path)}...", false);
        _binary = await CalibrationBinaryDocument.OpenAsync(path);
        _binaryPath = path;
        BinaryMetric.Text = FormatBytes(_binary.Length);
        BinaryPathText.Text = path;
        UpdateWorkspaceIdentity();
        RefreshVerification();
        UpdateEditState();
        TryLoadSelectedTable();
        SetStatus($"BIN verified · {_binary.SourceFingerprint.Sha256[..12]} · {_binary.Length:N0} bytes", true);
    }

    private async Task LoadDefinitionAsync(string path)
    {
        SetStatus($"Parsing {Path.GetFileName(path)}...", false);
        _definition = await _xdfParser.ParseAsync(path);
        _definitionPath = path;
        DefinitionPathText.Text = path;
        DefinitionMetric.Text = $"{_definition.Tables.Count + _definition.Flags.Count:N0} ITEMS";
        _allTables.Clear();
        _allTables.AddRange(_definition.Tables.Select(table => new TableListItem(table, GetBrush(table.CanRead
            ? table.CanWrite ? "SuccessBrush" : "AmberBrush"
            : "MutedBrush"))));
        ApplyTableFilter();
        UpdateWorkspaceIdentity();
        RefreshVerification();
        SetStatus($"XDF parsed · {_definition.Tables.Count:N0} tables · {_definition.Diagnostics.Count:N0} diagnostics", true);
        SelectFirstReadableTable();
    }

    private async Task LoadLogAsync(string path)
    {
        SetStatus($"Parsing {Path.GetFileName(path)}...", false);
        _log = await _logParser.ParseAsync(path);
        _logPath = path;
        LogPathText.Text = path;
        LogMetric.Text = _log.Quality.SampleCount.ToString("N0", CultureInfo.CurrentCulture);
        LogSamplesText.Text = _log.Quality.SampleCount.ToString("N0", CultureInfo.CurrentCulture);
        LogDurationText.Text = _log.Quality.DurationSeconds.HasValue ? $"{_log.Quality.DurationSeconds.Value:F1} s" : "—";
        LogRateText.Text = _log.Quality.MedianSampleRateHz.HasValue ? $"{_log.Quality.MedianSampleRateHz.Value:F1} Hz" : "—";
        LogChannelsText.Text = _log.Series.Count(series => !series.Channel.IsMetadata).ToString(CultureInfo.CurrentCulture);
        foreach (var trace in _allLogTraces) trace.PropertyChanged -= LogTrace_PropertyChanged;
        _allLogTraces.Clear();
        var signalIndex = 0;
        foreach (var series in _log.Series.Where(series => !series.Channel.IsMetadata))
        {
            var trace = new LogTraceSelection(series, GetTraceColor(series, signalIndex++));
            trace.PropertyChanged += LogTrace_PropertyChanged;
            _allLogTraces.Add(trace);
        }
        ApplyLogChannelFilter();
        LogNavigator.SetDataset(_log);
        ApplyLogPreset("Boost");
        UpdateWorkspaceIdentity();
        SetStatus($"MHD log parsed · {_log.Quality.SampleCount:N0} samples · {_log.Quality.Diagnostics.Count:N0} diagnostics", true);
    }

    private void SelectFirstReadableTable()
    {
        if (TableListBox.SelectedItem is not null) return;
        TableListBox.SelectedItem = _visibleTables.FirstOrDefault(item => item.Definition.CanRead);
    }

    private void MapSearchBox_TextChanged(object sender, TextChangedEventArgs eventArgs)
    {
        if (SearchHint is not null)
        {
            SearchHint.Visibility = string.IsNullOrWhiteSpace(MapSearchBox.Text) ? Visibility.Visible : Visibility.Collapsed;
        }
        ApplyTableFilter();
    }

    private void TableFilter_SelectionChanged(object sender, SelectionChangedEventArgs eventArgs) => ApplyTableFilter();

    private void ApplyTableFilter()
    {
        var tableListBox = TableListBox;
        if (tableListBox is null) return;
        var query = MapSearchBox?.Text?.Trim() ?? string.Empty;
        var selected = tableListBox.SelectedItem as TableListItem;
        var scope = (TableScopeCombo?.SelectedItem as ComboBoxItem)?.Tag as string ?? "All";
        var sort = (TableSortCombo?.SelectedItem as ComboBoxItem)?.Tag as string ?? "System";
        IEnumerable<TableListItem> candidates = _allTables.Where(item => scope switch
        {
            "CoreMaps" => item.Definition.Identity.Role == XdfTableRole.Calibration,
            "AirBoost" => IsSystem(item, XdfCalibrationSystem.Boost, XdfCalibrationSystem.WastegateControl, XdfCalibrationSystem.Airflow, XdfCalibrationSystem.Load, XdfCalibrationSystem.Throttle),
            "FuelSystem" => IsSystem(item, XdfCalibrationSystem.Fueling, XdfCalibrationSystem.DirectInjection, XdfCalibrationSystem.PortInjection, XdfCalibrationSystem.LowPressureFuel, XdfCalibrationSystem.HighPressureFuel),
            "IgnitionKnock" => IsSystem(item, XdfCalibrationSystem.Ignition, XdfCalibrationSystem.KnockControl),
            "TorqueLoad" => IsSystem(item, XdfCalibrationSystem.Torque, XdfCalibrationSystem.Load, XdfCalibrationSystem.Throttle),
            "VanosIdle" => IsSystem(item, XdfCalibrationSystem.Vanos, XdfCalibrationSystem.Idle),
            "LimitsSafeties" => IsSystem(item, XdfCalibrationSystem.RevLimits, XdfCalibrationSystem.VehicleSpeedLimits, XdfCalibrationSystem.Safeties, XdfCalibrationSystem.Cooling, XdfCalibrationSystem.OilPressure),
            "Transmission" => IsSystem(item, XdfCalibrationSystem.Transmission),
            "Axes" => item.Definition.Identity.Role == XdfTableRole.BreakpointAxis,
            _ => true
        });
        candidates = sort switch
        {
            "Address" => candidates.OrderBy(item => item.Definition.ZAxis.Address ?? long.MaxValue)
                .ThenBy(item => item.Definition.SourceIndex),
            "Source" => candidates.OrderBy(item => item.Definition.SourceIndex),
            _ => candidates.OrderBy(item => item.Definition.Identity.SortKey, StringComparer.Ordinal)
        };
        _visibleTables.Clear();
        foreach (var item in candidates.Where(item => query.Length == 0
                     || item.Definition.Identity.SearchText.Contains(query, StringComparison.OrdinalIgnoreCase)
                     || item.Definition.XAxis.Units?.Contains(query, StringComparison.OrdinalIgnoreCase) == true
                     || item.Definition.YAxis.Units?.Contains(query, StringComparison.OrdinalIgnoreCase) == true
                     || item.Definition.ZAxis.Units?.Contains(query, StringComparison.OrdinalIgnoreCase) == true))
        {
            _visibleTables.Add(item);
        }

        if (TableCountText is not null)
        {
            TableCountText.Text = $"{_visibleTables.Count:N0} / {_allTables.Count:N0}";
        }
        if (selected is not null && _visibleTables.Contains(selected)) tableListBox.SelectedItem = selected;
    }

    private static bool IsSystem(TableListItem item, params XdfCalibrationSystem[] systems) =>
        item.Definition.Identity.Role == XdfTableRole.Calibration && systems.Contains(item.Definition.Identity.System);

    private void TableListBox_SelectionChanged(object sender, SelectionChangedEventArgs eventArgs)
    {
        if (TableListBox.SelectedItem is not TableListItem selected) return;
        _selectedTable = selected.Definition;
        UpdateInspector(_selectedTable);
        TryLoadSelectedTable();
    }

    private void TryLoadSelectedTable()
    {
        if (_selectedTable is null)
        {
            ClearMap();
            return;
        }

        MapTitleText.Text = _selectedTable.Title;
        MapUnitText.Text = _selectedTable.ZAxis.Units ?? string.Empty;
        if (_binary is null || !_selectedTable.CanRead)
        {
            ClearMap(keepTitle: true);
            UpdateEditState();
            return;
        }

        try
        {
            _selectedData = _tableAccessor.Read(_binary, _selectedTable);
            _mapValueHeatBrushConverter.SetRange(_selectedData.EngineeringValues);
            var table = BuildDataTable(_selectedData);
            MapDataGrid.ItemsSource = table.DefaultView;
            MapSurface.SetData(
                _selectedData.EngineeringValues,
                _selectedData.XAxisValues,
                _selectedData.YAxisValues,
                ResolveAxisName(_selectedTable, _selectedTable.XAxis, _selectedData.XAxisValues, "x"),
                ResolveAxisName(_selectedTable, _selectedTable.YAxis, _selectedData.YAxisValues, "y"),
                ResolveAxisName(_selectedTable, _selectedTable.ZAxis, _selectedData.EngineeringValues.Cast<double>().Where(double.IsFinite).ToArray(), "z"));
            UpdateEditState();
            SetStatus($"Loaded {_selectedTable.Title} · {_selectedTable.RowCount}×{_selectedTable.ColumnCount}", true);
        }
        catch (Exception exception)
        {
            _selectedData = null;
            ClearMap(keepTitle: true);
            SetStatus($"Map read blocked · {exception.Message}", false);
        }
    }

    private static DataTable BuildDataTable(XdfTableData data)
    {
        var table = new DataTable(data.Definition.Id) { Locale = CultureInfo.InvariantCulture };
        table.Columns.Add("Axis", typeof(string));
        for (var column = 0; column < data.Definition.ColumnCount; column++)
        {
            table.Columns.Add($"C{column:D4}", typeof(double));
        }

        for (var row = 0; row < data.Definition.RowCount; row++)
        {
            var values = new object[data.Definition.ColumnCount + 1];
            values[0] = row < data.YAxisValues.Count ? FormatAxis(data.YAxisValues[row]) : row.ToString(CultureInfo.InvariantCulture);
            for (var column = 0; column < data.Definition.ColumnCount; column++) values[column + 1] = data.EngineeringValues[row, column];
            table.Rows.Add(values);
        }

        return table;
    }

    private void MapSurface_CellSelected(object? sender, MapSurfaceCellSelectedEventArgs eventArgs)
    {
        if (_selectedData is null || eventArgs.Row < 0 || eventArgs.Row >= MapDataGrid.Items.Count) return;
        var rowItem = MapDataGrid.Items[eventArgs.Row];
        var targetColumn = MapDataGrid.Columns.FirstOrDefault(column => string.Equals(column.SortMemberPath, $"C{eventArgs.Column:D4}", StringComparison.Ordinal));
        MapDataGrid.SelectedItem = rowItem;
        if (targetColumn is not null)
        {
            MapDataGrid.CurrentCell = new DataGridCellInfo(rowItem, targetColumn);
            MapDataGrid.ScrollIntoView(rowItem, targetColumn);
        }
        else
        {
            MapDataGrid.ScrollIntoView(rowItem);
        }
        SetStatus($"Surface cell selected · row {eventArgs.Row + 1}, column {eventArgs.Column + 1} · {eventArgs.Value:G8}", true);
    }

    private void MapDataGrid_AutoGeneratingColumn(object sender, DataGridAutoGeneratingColumnEventArgs eventArgs)
    {
        if (_selectedData is null) return;
        if (eventArgs.PropertyName == "Axis")
        {
            eventArgs.Column.Header = _selectedTable?.YAxis.Units ?? "ROW";
            eventArgs.Column.IsReadOnly = true;
            eventArgs.Column.Width = new DataGridLength(76);
            eventArgs.Column.CellStyle = CreateAxisCellStyle();
            return;
        }

        if (!int.TryParse(eventArgs.PropertyName.AsSpan(1), out var columnIndex)) return;
        eventArgs.Column.Header = columnIndex < _selectedData.XAxisValues.Count
            ? FormatAxis(_selectedData.XAxisValues[columnIndex])
            : columnIndex.ToString(CultureInfo.InvariantCulture);
        eventArgs.Column.Width = new DataGridLength(1, DataGridLengthUnitType.Star);
        eventArgs.Column.MinWidth = 74;
        var decimals = Math.Clamp(_selectedData.Definition.ZAxis.DecimalPlaces, 0, 6);
        eventArgs.Column = new DataGridTextColumn
        {
            Header = eventArgs.Column.Header,
            Width = eventArgs.Column.Width,
            MinWidth = eventArgs.Column.MinWidth,
            CellStyle = CreateMapCellStyle(eventArgs.PropertyName),
            ElementStyle = CreateMapTextStyle(),
            EditingElementStyle = CreateMapEditorStyle(),
            Binding = new System.Windows.Data.Binding(eventArgs.PropertyName)
            {
                StringFormat = $"F{decimals}",
                UpdateSourceTrigger = System.Windows.Data.UpdateSourceTrigger.LostFocus
            }
        };
    }

    private Style CreateAxisCellStyle()
    {
        var style = new Style(typeof(DataGridCell));
        style.Setters.Add(new Setter(Control.BackgroundProperty, GetBrush("RaisedBrush")));
        style.Setters.Add(new Setter(Control.ForegroundProperty, GetBrush("MutedBrush")));
        style.Setters.Add(new Setter(Control.PaddingProperty, new Thickness(8, 5, 8, 5)));
        style.Setters.Add(new Setter(Control.BorderBrushProperty, GetBrush("LineBrush")));
        style.Setters.Add(new Setter(Control.BorderThicknessProperty, new Thickness(0, 0, 1, 1)));
        return style;
    }

    private Style CreateMapCellStyle(string propertyName)
    {
        var style = new Style(typeof(DataGridCell));
        style.Setters.Add(new Setter(Control.ForegroundProperty, Brushes.White));
        style.Setters.Add(new Setter(Control.PaddingProperty, new Thickness(8, 5, 8, 5)));
        style.Setters.Add(new Setter(Control.BorderBrushProperty, GetBrush("LineBrush")));
        style.Setters.Add(new Setter(Control.BorderThicknessProperty, new Thickness(0, 0, 1, 1)));
        style.Setters.Add(new Setter(Control.BackgroundProperty, new Binding(propertyName) { Converter = _mapValueHeatBrushConverter }));
        var selection = new Trigger { Property = DataGridCell.IsSelectedProperty, Value = true };
        selection.Setters.Add(new Setter(Control.BorderBrushProperty, GetBrush("CyanBrush")));
        selection.Setters.Add(new Setter(Control.BorderThicknessProperty, new Thickness(2)));
        style.Triggers.Add(selection);
        return style;
    }

    private static Style CreateMapTextStyle()
    {
        var style = new Style(typeof(TextBlock));
        style.Setters.Add(new Setter(TextBlock.HorizontalAlignmentProperty, HorizontalAlignment.Right));
        style.Setters.Add(new Setter(TextBlock.TextAlignmentProperty, TextAlignment.Right));
        style.Setters.Add(new Setter(TextBlock.VerticalAlignmentProperty, VerticalAlignment.Center));
        return style;
    }

    private static Style CreateMapEditorStyle()
    {
        var style = new Style(typeof(TextBox));
        style.Setters.Add(new Setter(TextBox.HorizontalContentAlignmentProperty, HorizontalAlignment.Right));
        style.Setters.Add(new Setter(TextBox.TextAlignmentProperty, TextAlignment.Right));
        style.Setters.Add(new Setter(TextBox.PaddingProperty, new Thickness(4, 2, 4, 2)));
        return style;
    }

    private void MapDataGrid_CellEditEnding(object sender, DataGridCellEditEndingEventArgs eventArgs)
    {
        if (_binary is null || _selectedTable is null || !_selectedTable.CanWrite || eventArgs.EditAction != DataGridEditAction.Commit) return;
        if (eventArgs.EditingElement is not TextBox editor) return;
        if (!double.TryParse(editor.Text, NumberStyles.Float, CultureInfo.CurrentCulture, out var value)
            && !double.TryParse(editor.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out value))
        {
            eventArgs.Cancel = true;
            SetStatus($"'{editor.Text}' is not a valid finite calibration value.", false);
            return;
        }

        var row = MapDataGrid.Items.IndexOf(eventArgs.Row.Item);
        var property = eventArgs.Column.SortMemberPath;
        if (string.IsNullOrWhiteSpace(property) && eventArgs.Column is DataGridBoundColumn boundColumn)
        {
            property = (boundColumn.Binding as System.Windows.Data.Binding)?.Path.Path;
        }

        if (property is null || property == "Axis" || property.Length < 2 || !int.TryParse(property.AsSpan(1), out var column)) return;
        try
        {
            _tableAccessor.WriteCell(_binary, _selectedTable, row, column, value);
            Dispatcher.BeginInvoke(() =>
            {
                TryLoadSelectedTable();
                UpdateEditState();
            }, DispatcherPriority.Background);
        }
        catch (Exception exception)
        {
            eventArgs.Cancel = true;
            SetStatus($"Edit rejected · {exception.Message}", false);
        }
    }

    private void UpdateInspector(XdfTableDefinition table)
    {
        InspectorTitle.Text = table.Title;
        InspectorAddress.Text = table.ZAxis.Address.HasValue ? $"0x{table.ZAxis.Address.Value:X}" : "—";
        InspectorDimensions.Text = $"{table.RowCount} × {table.ColumnCount}";
        InspectorEncoding.Text = $"{table.ZAxis.Encoding.ValueKind} · {table.ZAxis.Encoding.SizeBits}-bit · {table.ZAxis.Encoding.ByteOrder}";
        InspectorEquation.Text = table.ZAxis.Equation;
        InspectorSystem.Text = SplitPascalCase(table.Identity.System.ToString());
        InspectorRole.Text = $"{SplitPascalCase(table.Identity.Role.ToString())} · {table.Identity.Shape}";
        InspectorSymbol.Text = table.Identity.Symbol ?? "—";
        InspectorCategories.Text = table.CategoryNames.Count > 0 ? string.Join(" / ", table.CategoryNames) : "Uncategorized";
        InspectorSourceClass.Text = $"{table.Identity.SourceClass} · item {table.SourceIndex + 1:N0}";
        InspectorAccess.Text = table.CanWrite ? "READ / WRITE" : table.CanRead ? "READ ONLY" : "BLOCKED";
        InspectorAccess.Foreground = GetBrush(table.CanWrite ? "SuccessBrush" : table.CanRead ? "AmberBrush" : "AccentBrush");
        InspectorDescription.Text = table.Description ?? string.Empty;
        InspectorEvidence.Text = $"LABEL CONFIDENCE {table.Identity.Confidence:P0}\n{string.Join(Environment.NewLine, table.Identity.Evidence)}";
        InspectorLimitations.Text = string.Join(Environment.NewLine, table.Limitations);
        LimitationsPanel.Visibility = table.Limitations.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
    }

    private void ClearMap(bool keepTitle = false)
    {
        _selectedData = null;
        MapDataGrid.ItemsSource = null;
        MapSurface.SetData(new double[0, 0]);
        if (!keepTitle)
        {
            MapTitleText.Text = "Select a calibration map";
            MapUnitText.Text = string.Empty;
        }
    }

    private void UpdateEditState()
    {
        var canEdit = _binary is not null && _selectedTable?.CanWrite == true;
        MapDataGrid.IsReadOnly = !canEdit;
        MapEditStateText.Text = canEdit ? "BYTE-VERIFIED DRAFT" : "READ ONLY";
        MapEditStateText.Foreground = GetBrush(canEdit ? "CyanBrush" : "MutedBrush");
        var modified = _binary?.IsModified == true;
        var changedBytes = _binary?.GetChangedRanges().Sum(range => range.Length) ?? 0;
        ChangedMetric.Text = changedBytes.ToString("N0", CultureInfo.CurrentCulture);
        DirtyStateText.Text = modified ? $"{changedBytes:N0} BYTES MODIFIED" : "SOURCE IMMUTABLE";
        DirtyStateText.Foreground = GetBrush(modified ? "AmberBrush" : "SuccessBrush");
        UndoButton.IsEnabled = _binary?.CanUndo == true;
        RedoButton.IsEnabled = _binary?.CanRedo == true;
        ExportButton.IsEnabled = modified && !_busy;
    }

    private void RefreshVerification()
    {
        _verification = _definition is not null && _binary is not null
            ? _xdfBinaryVerifier.Verify(_definition, _binary)
            : null;
        if (_verification is null) return;
        var errors = _verification.Findings.Count(finding => finding.Severity == XdfVerificationSeverity.Error);
        var warnings = _verification.Findings.Count(finding => finding.Severity == XdfVerificationSeverity.Warning);
        SetStatus(errors == 0
            ? $"XDF/BIN preflight passed · {_verification.WritableRanges.Count:N0} writable regions · {warnings:N0} overlap warnings"
            : $"XDF/BIN preflight blocked · {errors:N0} errors · {warnings:N0} warnings", errors == 0);
    }

    private void Undo_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_binary?.Undo() != true) return;
        TryLoadSelectedTable();
        UpdateEditState();
    }

    private void Redo_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_binary?.Redo() != true) return;
        TryLoadSelectedTable();
        UpdateEditState();
    }

    private async void Export_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (_binary is null || !_binary.IsModified) return;
        RefreshVerification();
        if (_verification is { IsCompatible: false })
        {
            var errors = _verification.Findings.Where(finding => finding.Severity == XdfVerificationSeverity.Error)
                .Select(finding => $"• {finding.Message}");
            MessageBox.Show(this, string.Join(Environment.NewLine, errors), "Export blocked by XDF/BIN preflight", MessageBoxButton.OK, MessageBoxImage.Error);
            return;
        }
        var sourceName = Path.GetFileNameWithoutExtension(_binary.SourcePath);
        var dialog = new SaveFileDialog
        {
            Title = "Save calibration copy as",
            Filter = "Calibration binary (*.bin)|*.bin",
            FileName = $"{sourceName}_rev_{DateTime.Now:yyyyMMdd_HHmm}.bin",
            AddExtension = true,
            OverwritePrompt = true
        };
        if (dialog.ShowDialog(this) != true) return;
        if (File.Exists(dialog.FileName))
        {
            MessageBox.Show(this, "Choose a new filename. The source BIN is immutable and revision files are never overwritten.", "Save copy blocked", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        await RunUiActionAsync(async () =>
        {
            var checksumProvider = string.Equals(_binary.SourceFingerprint.Sha256, Mg1LeChecksumProvider.B58Gen2StockSha256, StringComparison.OrdinalIgnoreCase)
                ? new Mg1LeChecksumProvider()
                : null;
            var approval = new BinaryExportApproval(
                _verification?.IsCompatible == true,
                _verification is null
                    ? "No XDF was loaded; byte integrity is verified, but definition compatibility is unavailable."
                    : $"XDF/BIN preflight passed with {_verification.Findings.Count(finding => finding.Severity == XdfVerificationSeverity.Warning)} warnings.",
                checksumProvider);
            var result = await _binary.ExportNewAsync(dialog.FileName, _definition?.Source.Sha256, approval);
            SetStatus(result.Checksum.FlashReady
                ? $"BIN copy saved, checksum-corrected, and validated · {result.Sha256[..12]}"
                : $"BIN copy saved and read back · {result.Sha256[..12]} · {result.Checksum.Status}", result.Checksum.FlashReady);
            MessageBox.Show(
                this,
                $"BIN copy saved and byte-for-byte readback verified.\n\nBinary: {result.BinaryPath}\nManifest: {result.ManifestPath}\n\nChecksum: {result.Checksum.Message}",
                "BIN copy saved",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        });
    }

    private async void Window_Drop(object sender, DragEventArgs eventArgs)
    {
        if (!eventArgs.Data.GetDataPresent(DataFormats.FileDrop)) return;
        if (eventArgs.Data.GetData(DataFormats.FileDrop) is not string[] paths) return;
        await RunUiActionAsync(async () =>
        {
            foreach (var path in paths)
            {
                switch (Path.GetExtension(path).ToLowerInvariant())
                {
                    case ".bin": await LoadBinaryAsync(path); break;
                    case ".xdf": await LoadDefinitionAsync(path); break;
                    case ".csv": await LoadLogAsync(path); break;
                }
            }
        });
    }

    private void Window_PreviewKeyDown(object sender, KeyEventArgs eventArgs)
    {
        if ((Keyboard.Modifiers & ModifierKeys.Control) == 0) return;
        switch (eventArgs.Key)
        {
            case Key.Z when _binary?.CanUndo == true:
                Undo_Click(sender, new RoutedEventArgs());
                eventArgs.Handled = true;
                break;
            case Key.Y when _binary?.CanRedo == true:
                Redo_Click(sender, new RoutedEventArgs());
                eventArgs.Handled = true;
                break;
            case Key.S when ExportButton.IsEnabled:
                Export_Click(sender, new RoutedEventArgs());
                eventArgs.Handled = true;
                break;
        }
    }

    private void WorkspaceTabs_SelectionChanged(object sender, SelectionChangedEventArgs eventArgs)
    {
        if (!ReferenceEquals(eventArgs.Source, WorkspaceTabs)) return;
        if (WorkspaceTabs.SelectedIndex == 2) LogPlot.InvalidateVisual();
    }

    private void LogPreset_Click(object sender, RoutedEventArgs eventArgs)
    {
        if (sender is Button { Tag: string preset }) ApplyLogPreset(preset);
    }

    private void ApplyLogPreset(string preset)
    {
        _updatingLogSelection = true;
        try
        {
            foreach (var trace in _allLogTraces)
            {
                trace.IsSelected = preset switch
                {
                    "Boost" => trace.CanonicalId is CanonicalChannelIds.BoostActualPsi
                        or CanonicalChannelIds.ManifoldBoostPsi
                        or CanonicalChannelIds.BoostTargetPsi
                        or CanonicalChannelIds.WastegateDutyCyclePercent
                        or CanonicalChannelIds.EngineSpeedRpm,
                    "Fuel" => trace.CanonicalId is CanonicalChannelIds.LambdaAfr
                        or CanonicalChannelIds.RailPressurePsi
                        or CanonicalChannelIds.ShortTermFuelTrimPercent
                        or CanonicalChannelIds.EngineSpeedRpm,
                    "Ignition" => trace.CanonicalId == CanonicalChannelIds.EngineSpeedRpm
                        || trace.CanonicalId?.StartsWith("ignition.timing.cylinder_", StringComparison.Ordinal) == true,
                    _ => false
                };
            }
        }
        finally
        {
            _updatingLogSelection = false;
        }

        UpdateActiveLogTraces();
    }

    private void LogTrace_PropertyChanged(object? sender, PropertyChangedEventArgs eventArgs)
    {
        if (_updatingLogSelection || eventArgs.PropertyName != nameof(LogTraceSelection.IsSelected)) return;
        if (_allLogTraces.Count(trace => trace.IsSelected) > 8 && sender is LogTraceSelection selection)
        {
            _updatingLogSelection = true;
            selection.IsSelected = false;
            _updatingLogSelection = false;
            SetStatus("A graph workspace supports up to eight active traces. Clear one before adding another.", false);
        }
        UpdateActiveLogTraces();
    }

    private void UpdateActiveLogTraces()
    {
        _activeLogTraces.Clear();
        foreach (var trace in _allLogTraces.Where(trace => trace.IsSelected)) _activeLogTraces.Add(trace);
        SelectedChannelCountText.Text = $"{_activeLogTraces.Count} ACTIVE";
        LogPlot.SetData(_log, _allLogTraces);
        UpdateLogCursor(LogPlot.CursorIndex < 0 ? 0 : LogPlot.CursorIndex);
    }

    private void LogChannelSearchBox_TextChanged(object sender, TextChangedEventArgs eventArgs)
    {
        if (LogChannelSearchHint is not null)
        {
            LogChannelSearchHint.Visibility = string.IsNullOrWhiteSpace(LogChannelSearchBox.Text)
                ? Visibility.Visible
                : Visibility.Collapsed;
        }
        ApplyLogChannelFilter();
    }

    private void ApplyLogChannelFilter()
    {
        var query = LogChannelSearchBox?.Text?.Trim() ?? string.Empty;
        _visibleLogTraces.Clear();
        foreach (var trace in _allLogTraces.Where(trace => query.Length == 0
                     || trace.DisplayName.Contains(query, StringComparison.OrdinalIgnoreCase)
                     || trace.CanonicalId?.Contains(query, StringComparison.OrdinalIgnoreCase) == true))
        {
            _visibleLogTraces.Add(trace);
        }
    }

    private void LogPlot_CursorChanged(object sender, LogCursorChangedEventArgs eventArgs) =>
        UpdateLogCursor(eventArgs.SampleIndex);

    private void LogPlot_ViewportChanged(object sender, LogViewportChangedEventArgs eventArgs) =>
        LogNavigator.SetViewport(eventArgs.Start, eventArgs.End);

    private void LogNavigator_ViewportChanged(object sender, LogViewportChangedEventArgs eventArgs) =>
        LogPlot.SetViewport(eventArgs.Start, eventArgs.End);

    private void UpdateLogCursor(int sampleIndex)
    {
        if (_log is null || _log.Quality.SampleCount == 0) return;
        sampleIndex = Math.Clamp(sampleIndex, 0, _log.Quality.SampleCount - 1);
        foreach (var trace in _allLogTraces)
        {
            trace.CurrentValue = sampleIndex < trace.Series.Values.Count && trace.Series.Values[sampleIndex] is { } value
                ? $"{value:0.###}{(string.IsNullOrWhiteSpace(trace.Unit) ? string.Empty : $" {trace.Unit}")}" : "—";
        }

        var time = ValueAt(_log.FindCanonical(CanonicalChannelIds.TimeSeconds), sampleIndex);
        var rpm = ValueAt(_log.FindCanonical(CanonicalChannelIds.EngineSpeedRpm), sampleIndex);
        var gear = ValueAt(_log.FindCanonical(CanonicalChannelIds.Gear), sampleIndex);
        var firstTime = _log.FindCanonical(CanonicalChannelIds.TimeSeconds)?.Values.FirstOrDefault(value => value.HasValue) ?? 0;
        LogCursorText.Text = $"SAMPLE {sampleIndex:N0} · T+{(time ?? firstTime) - firstTime:F3}s · {(rpm.HasValue ? $"{rpm:F0} RPM" : "RPM —")} · {(gear.HasValue ? $"GEAR {gear:F0}" : "GEAR —")}";
        RebuildLogDataTable(sampleIndex);
    }

    private void RebuildLogDataTable(int centerIndex)
    {
        if (_log is null) return;
        var active = _activeLogTraces.ToArray();
        var table = new DataTable("LogCursorWindow") { Locale = CultureInfo.InvariantCulture };
        table.Columns.Add("Sample", typeof(int));
        foreach (var trace in active)
        {
            var name = trace.DisplayName;
            var uniqueName = name;
            var suffix = 2;
            while (table.Columns.Contains(uniqueName)) uniqueName = $"{name} {suffix++}";
            table.Columns.Add(uniqueName, typeof(double));
        }

        var first = Math.Max(0, centerIndex - 10);
        var last = Math.Min(_log.Quality.SampleCount - 1, centerIndex + 10);
        for (var index = first; index <= last; index++)
        {
            var row = table.NewRow();
            row[0] = index;
            for (var column = 0; column < active.Length; column++)
            {
                row[column + 1] = index < active[column].Series.Values.Count && active[column].Series.Values[index].HasValue
                    ? active[column].Series.Values[index]!.Value
                    : DBNull.Value;
            }
            table.Rows.Add(row);
        }
        LogDataGrid.ItemsSource = table.DefaultView;
        var selectedRow = centerIndex - first;
        if (selectedRow >= 0 && selectedRow < LogDataGrid.Items.Count)
        {
            LogDataGrid.SelectedIndex = selectedRow;
            LogDataGrid.ScrollIntoView(LogDataGrid.Items[selectedRow]);
        }
    }

    private static double? ValueAt(LogSeries? series, int index) =>
        series is not null && index >= 0 && index < series.Values.Count ? series.Values[index] : null;

    private static string SplitPascalCase(string value) =>
        string.Concat(value.Select((character, index) => index > 0 && char.IsUpper(character) ? $" {character}" : character.ToString()));

    private static Color GetTraceColor(LogSeries series, int index)
    {
        if (series.Channel.CanonicalId == CanonicalChannelIds.BoostActualPsi) return Color.FromRgb(56, 201, 197);
        if (series.Channel.CanonicalId == CanonicalChannelIds.BoostTargetPsi) return Color.FromRgb(255, 71, 61);
        if (series.Channel.CanonicalId == CanonicalChannelIds.WastegateDutyCyclePercent) return Color.FromRgb(225, 182, 85);
        if (series.Channel.CanonicalId == CanonicalChannelIds.EngineSpeedRpm) return Color.FromRgb(210, 213, 218);
        if (series.Channel.CanonicalId == CanonicalChannelIds.LambdaAfr) return Color.FromRgb(107, 203, 119);
        if (series.Channel.CanonicalId == CanonicalChannelIds.RailPressurePsi) return Color.FromRgb(98, 155, 255);
        if (series.Channel.CanonicalId == CanonicalChannelIds.ShortTermFuelTrimPercent) return Color.FromRgb(241, 137, 173);
        Color[] palette =
        {
            Color.FromRgb(255, 139, 72), Color.FromRgb(74, 182, 222), Color.FromRgb(180, 154, 255),
            Color.FromRgb(234, 205, 93), Color.FromRgb(93, 205, 164), Color.FromRgb(223, 116, 103)
        };
        return palette[index % palette.Length];
    }

    private async Task RunUiActionAsync(Func<Task> action)
    {
        if (_busy) return;
        _busy = true;
        Mouse.OverrideCursor = Cursors.Wait;
        UpdateEditState();
        try
        {
            await action();
        }
        catch (Exception exception)
        {
            SetStatus(exception.Message, false);
            MessageBox.Show(this, exception.Message, "Operation failed", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            _busy = false;
            Mouse.OverrideCursor = null;
            UpdateEditState();
        }
    }

    private void UpdateWorkspaceIdentity()
    {
        var softwareId = _log?.SoftwareId;
        if (softwareId is null && _definition is not null) softwareId = Path.GetFileNameWithoutExtension(_definitionPath);
        SoftwareIdText.Text = softwareId is null ? "SOFTWARE ID —" : $"SOFTWARE ID {softwareId}";
        WorkspaceTitleText.Text = _binaryPath is not null
            ? Path.GetFileNameWithoutExtension(_binaryPath)
            : _definitionPath is not null ? Path.GetFileNameWithoutExtension(_definitionPath) : "No calibration loaded";

        if (_definition is not null && _log?.SoftwareId is { } logId)
        {
            var definitionId = Path.GetFileNameWithoutExtension(_definitionPath);
            if (!string.Equals(logId, definitionId, StringComparison.OrdinalIgnoreCase))
            {
                SetStatus($"Compatibility warning · log {logId} does not match definition {definitionId}", false);
            }
        }
    }

    private static string? FindFixtureDirectory()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "fixtures", "local", "B58gen2", "00005D55504809");
            if (Directory.Exists(candidate)) return candidate;
            current = current.Parent;
        }

        return null;
    }

    private void SetStatus(string message, bool success)
    {
        StatusText.Text = message;
        StatusText.Foreground = GetBrush(success ? "MutedBrush" : "AmberBrush");
        StatusDot.Fill = GetBrush(success ? "SuccessBrush" : "AmberBrush");
    }

    private Brush GetBrush(string key) => (Brush)FindResource(key);

    private static string ResolveAxisName(XdfTableDefinition table, XdfAxisDefinition axis, IReadOnlyList<double> values, string role)
    {
        var title = table.Identity.DisplayTitle;
        var context = $"{title} {table.Description}".ToLowerInvariant();
        var unit = axis.Units?.Trim() ?? string.Empty;
        var normalizedUnit = unit.ToLowerInvariant().Replace(" ", string.Empty, StringComparison.Ordinal);
        var maximum = values.Where(double.IsFinite).DefaultIfEmpty(0).Max();

        if (role == "z")
        {
            var output = title.Length > 38 ? title[..38].TrimEnd() : title;
            return IsMeaningfulUnit(unit) ? $"{output} ({unit})" : output;
        }

        if (normalizedUnit is "1/min" or "rpm" or "min-1") return "Engine Speed (RPM)";
        if (normalizedUnit is "nm") return "Engine Torque (Nm)";
        if (normalizedUnit is "c" or "°c" or "degc") return "Temperature (°C)";
        if (normalizedUnit is "hpa" or "kpa" or "mpa" or "bar" or "psi") return $"Pressure ({unit})";
        if (normalizedUnit is "km/h" or "kmh") return "Vehicle Speed (km/h)";
        if (normalizedUnit is "mph") return "Vehicle Speed (mph)";
        if (normalizedUnit is "mg/stk" or "mg/stroke" or "mg/hub") return $"Cylinder Charge ({unit})";
        if (normalizedUnit is "kg/h" or "g/s") return $"Air Mass Flow ({unit})";
        if (normalizedUnit is "lambda" or "λ") return "Lambda";
        if (normalizedUnit is "afr") return "Air-Fuel Ratio";
        if (normalizedUnit is "v") return "Voltage (V)";
        if (normalizedUnit is "ms") return "Time (ms)";
        if (normalizedUnit.Contains("kw", StringComparison.Ordinal) || normalizedUnit.Contains("deg", StringComparison.Ordinal)) return $"Crank Angle ({unit})";

        if (context.Contains("driver requested torque", StringComparison.Ordinal) || context.Contains("driver request", StringComparison.Ordinal))
        {
            if (role == "x" && maximum > 1000) return "Engine Speed (RPM)";
            if (role == "y" && maximum <= 100.5) return "Accelerator Pedal (%)";
        }

        if (normalizedUnit is "%")
        {
            if (context.Contains("pedal", StringComparison.Ordinal) || context.Contains("driver request", StringComparison.Ordinal)) return "Accelerator Pedal (%)";
            if (context.Contains("throttle", StringComparison.Ordinal)) return "Throttle Position (%)";
            if (context.Contains("load", StringComparison.Ordinal)) return "Engine Load (%)";
            return "Percentage (%)";
        }

        if (maximum > 1000 && (context.Contains("rpm", StringComparison.Ordinal) || context.Contains("speed", StringComparison.Ordinal) || context.Contains("torque", StringComparison.Ordinal))) return "Engine Speed (RPM)";
        if (context.Contains("temperature", StringComparison.Ordinal) || context.Contains("warm", StringComparison.Ordinal)) return "Temperature";
        if (context.Contains("pressure", StringComparison.Ordinal) || context.Contains("boost", StringComparison.Ordinal)) return IsMeaningfulUnit(unit) ? $"Pressure ({unit})" : "Pressure";
        if (context.Contains("load", StringComparison.Ordinal)) return IsMeaningfulUnit(unit) ? $"Engine Load ({unit})" : "Engine Load";
        if (context.Contains("factor", StringComparison.Ordinal)) return "Correction Factor";
        return IsMeaningfulUnit(unit) ? $"Breakpoint ({unit})" : "Calibration Breakpoint";
    }

    private static bool IsMeaningfulUnit(string? unit) => !string.IsNullOrWhiteSpace(unit) && unit is not "-";

    private static string FormatAxis(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);

    private static string FormatBytes(long bytes) => bytes >= 1024 * 1024
        ? $"{bytes / 1024d / 1024d:F1} MB"
        : $"{bytes / 1024d:F1} KB";
}

public sealed record TableListItem(XdfTableDefinition Definition, Brush StatusBrush)
{
    public string Title => Definition.Identity.DisplayTitle;

    public string SystemAndRole =>
        $"{Definition.Identity.System.ToString().ToUpperInvariant()} · {Definition.Identity.Role.ToString().ToUpperInvariant()}";

    public string AddressAndDimensions =>
        $"{(Definition.ZAxis.Address.HasValue ? $"0x{Definition.ZAxis.Address.Value:X}" : "NO ADDRESS")} · {Definition.RowCount}×{Definition.ColumnCount}";

    public string Status => Definition.CanWrite ? "RW" : Definition.CanRead ? "RO" : "BLOCK";
}
