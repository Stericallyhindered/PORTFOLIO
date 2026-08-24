namespace Redline.Calibration.Domain;

public sealed record FileFingerprint(
    string FileName,
    long SizeBytes,
    string Sha256);

