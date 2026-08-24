using Redline.Calibration.Domain;

namespace Redline.Calibration.Binary;

public interface IBinaryChecksumProvider
{
    string ProviderId { get; }
    ChecksumValidation ValidateAndUpdate(Span<byte> image, FileFingerprint source);
}

public sealed record BinaryExportApproval(
    bool DefinitionCompatible,
    string CompatibilityEvidence,
    IBinaryChecksumProvider? ChecksumProvider)
{
    public static BinaryExportApproval Draft(string evidence = "No compatibility approval was supplied.") => new(false, evidence, null);
}
