using Redline.Calibration.Diagnostics;

namespace Redline.Calibration.Desktop;

public sealed record FlashAdapterListItem(BmwEnetAdapter Adapter)
{
    public string Endpoint => $"{Adapter.Address}:{BmwEnetAdapter.DefaultDiagnosticPort}";

    public string Identity => $"VIN {Adapter.Identity.Vin ?? "UNKNOWN"} · MAC {Adapter.Identity.MacAddress ?? "UNKNOWN"}";
}
