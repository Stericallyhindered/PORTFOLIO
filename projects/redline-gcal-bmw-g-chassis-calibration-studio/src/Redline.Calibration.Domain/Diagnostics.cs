namespace Redline.Calibration.Domain;

public enum DiagnosticSeverity
{
    Information,
    Warning,
    Error
}

public sealed record ValidationDiagnostic(
    string Code,
    DiagnosticSeverity Severity,
    string Message,
    string? ItemId = null);

