// PDF-derived quantitative + UI citation strings for BMW xDrive / DSC training module
// (`extracted/full_text.txt`, E83 / E53 MU). Use in control math + tuners for traceability.

// --- Timing (page 12) ---
/// xDrive clutch engagement vs brake-based torque transfer (~0.1 s vs ~0.5 s dead time narrative).
const double pdfXdriveResponseApproxSec = 0.1;
const double pdfOpenTransferCaseBrakeReactionApproxSec = 0.5;

// --- Pre-control baseline (page 11) ---
/// Normal driving: ~40% front axle / ~60% rear axle torque distribution (minimum slip narrative).
const double pdfPrecontrolFrontTorqueFraction = 0.40;
const double pdfPrecontrolRearTorqueFraction = 0.60;

// --- Full AWD deactivation situations (page 11) ---
/// Permanent AWD fully deactivated only in these control situations (training module list).
const double pdfDeactivateSpeedKmh = 180.0;

// --- Tire tolerance (page 14) ---
/// Circumference mismatch can be ~1% or more (mixed tires / wear).
const double pdfTireCircumferenceMismatchTypicalPct = 1.0;

// --- DSC / wheel speeds (page 19) ---
const double pdfDscSelfTestSpeedKmh = 6.0;
const double pdfDscSelfTestBrakePedalSpeedKmh = 15.0;
const double pdfWheelSpeedPlausibilityStartKmh = 2.75;

// --- Reference strings for UI (verbatim summaries) ---
const String pdfCitationPrecontrolInputs =
    'Pre-control (DSC): accelerator pedal value, engine torque, engine rpm; '
    'also vehicle speed, gear, steering angle (page 11). '
    'Normal driving targets ~40% front / 60% rear axle torque with minimum slip.';

const String pdfCitationDynamicsInputs =
    'Traction / dynamics: wheel speeds, yaw rate, transversal acceleration (page 13). '
    'Oversteer tendency: engage clutch — maximum supportable front torque. '
    'Understeer tendency: clutch can fully disengage — rear only to stabilize.';

const String pdfCitationTireTolerance =
    'Tire tolerance: detects front/rear circumference mismatch; '
    'may allow slip in transfer case clutch vs at tire road contact; '
    'can reduce locking pressure from pre-control to limit clutch work (page 14).';

const String pdfCitationVgsgDsc =
    'DSC calculates locking pressure request; VGSG executes actuator (page 19–20). '
    'VGSG feedback: fluid temperature estimate, electric motor loads, clutch loads.';

const String pdfCitationTccAlwaysOn =
    'Even when DSC is deactivated, TCC remains active for traction/dynamics (page 10).';
