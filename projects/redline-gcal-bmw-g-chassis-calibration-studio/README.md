# Redline GCAL BMW G-Chassis Calibration Studio

Redline GCAL is a native Windows calibration workspace for BMW G-chassis B58/S58 development. It is not a toy map editor. It is the kind of tooling I build when vehicle software, binary calibration data, diagnostics, logging, customer/build records, and real tuner workflow all have to live in one place.

This project shows a full calibration-tool architecture around DME binary handling, XDF-style definition parsing, map/table editing, log review, diagnostic communication, flash workflow modeling, build-profile persistence, and safety checks around export readiness. It is written as a .NET 8 WPF desktop application with separated domain libraries instead of one giant UI project.

Public safety note: this portfolio snapshot is included to show engineering depth. It is not published as a public flashing product, not a guide to bypass vehicle security, and not intended for unauthorized or emissions-illegal ECU modification. Raw third-party fixture binaries, generated builds, private outputs, and research dumps were intentionally removed before adding this to the portfolio.

## What This Is

- BMW G-chassis/B58/S58 calibration workspace.
- DME BIN document model with bounded reads and writes.
- XDF 1.70 parsing and calibration-table interpretation.
- Real 2D table editing and WPF 3D surface rendering.
- Changed-byte tracking, undo/redo, and revision export behavior.
- JSON export/manifest style workflows for reviewable calibration output.
- MHD CSV log parsing, channel normalization, software-ID extraction, and quality checks.
- Local SQLite-style profile storage for customer, vehicle, revision, and engine-build records.
- ENET/HSFZ/UDS-oriented diagnostic and flash-transaction modeling.
- Tests around binary documents, XDF parsing, log parsing, ENET discovery, HSFZ framing, DME interrogation, UDS flash transfer logic, and profile persistence.

## Why It Matters

Most tuning tools are either UI shells with very little real architecture, or low-level protocol experiments with no product workflow around them. This project sits in the middle where the real work is:

```text
DME binary
-> definition parser
-> editable map/table model
-> tuner-facing UI
-> changed-byte tracking
-> validation/export manifest
-> log review
-> diagnostic/flash workflow model
-> customer, vehicle, and build record history
```

That is the software shape behind serious calibration work. A tuner needs to know what file is loaded, what software ID it belongs to, which tables are editable, what changed, whether the output is flash-ready, which log channels support the decision, and what customer/build context belongs with that revision.

## Core Modules

| Module | What it does |
| --- | --- |
| `src/Redline.Calibration.Binary` | Immutable-source BIN document handling, primitive codecs, bounded reads/writes, export approval, checksum-provider boundary, and changed-byte behavior |
| `src/Redline.Calibration.Definitions.Xdf` | XDF parsing, affine transforms, scalar/table accessors, catalog export, binary verification, table identity, categories, axes, labels, confidence, and evidence |
| `src/Redline.Calibration.Desktop` | WPF desktop app, calibration workspace UI, log panes, table/grid surfaces, map visualization, profile windows, and operator/tuner workflow |
| `src/Redline.Calibration.Diagnostics` | BMW ENET adapter discovery, HSFZ framing, DME interrogation concepts, diagnostic sessions, flash transaction journaling, and UDS transfer modeling |
| `src/Redline.Calibration.Domain` | Engine-build profiles, diagnostic domain types, file fingerprints, and calibration context models |
| `src/Redline.Calibration.Logs` | MHD CSV parsing, log models, channel normalization, software-ID extraction, and log quality checks |
| `src/Redline.Calibration.Persistence` | Local profile store and review export logic for customers, vehicles, build sheets, revisions, attachments, and records |

## Code Worth Reviewing

- `src/Redline.Calibration.Binary/CalibrationBinaryDocument.cs`  
  Core binary document behavior: safe reads, write bounds, undo/redo thinking, changed-byte tracking, and export safety.

- `src/Redline.Calibration.Definitions.Xdf/XdfParser.cs`  
  XDF parser implementation for turning calibration definitions into usable map/table metadata.

- `src/Redline.Calibration.Definitions.Xdf/AffineTransform.cs`  
  Equation parsing and conversion logic that lets raw bytes become meaningful calibration values.

- `src/Redline.Calibration.Desktop/MainWindow.xaml.cs`  
  Main application workflow tying loaded files, definitions, logs, tables, and UI state together.

- `src/Redline.Calibration.Desktop/MapSurfaceView.cs`  
  Interactive 3D/visual map surface work for calibration tables.

- `src/Redline.Calibration.Logs/MhdLogParser.cs`  
  Real-world log ingestion, channel handling, and normalization logic.

- `src/Redline.Calibration.Persistence/LocalProfileStore.cs`  
  Local customer/vehicle/build/revision data store around the calibration workflow.

- `tests/Redline.Calibration.Tests/XdfParserTests.cs`  
  Parser coverage for calibration definitions.

- `tests/Redline.Calibration.Tests/CalibrationBinaryDocumentTests.cs`  
  Binary document safety, edit, and export behavior.

- `tests/Redline.Calibration.Tests/UdsFlashTransferTests.cs`  
  Transfer modeling and defensive thinking around flash-like operations.

## Product Thinking

The important part is not just "can edit a BIN." The important part is how the tool treats calibration as a controlled workflow:

- Original BINs are treated as immutable source material.
- Draft exports are separated from flash-ready output.
- Changed ranges are tracked directly.
- Unsupported equations or unsafe transforms are blocked.
- Calibration definitions are cataloged with identity, category, address, axis, and confidence.
- Logs are normalized into a reviewable data set instead of raw CSV chaos.
- Customer, vehicle, hardware, engine-build, attachment, and revision records live beside the calibration work.
- Diagnostic and flash workflows are modeled as transactions instead of random button clicks.

That is the difference between a quick tuner utility and software that can support actual customers, real vehicles, revisions, troubleshooting, and support history.

## Interview Probes

Good questions to ask me about this project:

- How does a raw DME binary become an editable calibration table?
- How does an XDF definition map address, dimensions, byte order, signedness, units, equations, and axes into UI state?
- What makes a draft export different from a flash-ready file?
- Where should checksum logic live and why should it be isolated?
- How would you recover from a partial or failed flash workflow?
- What log quality checks matter before trusting a tuning decision?
- How would you add hardware-in-the-loop testing for ENET/UDS behavior?
- What would you refuse to automate without explicit operator confirmation?

## Run

```powershell
dotnet run --project src\Redline.Calibration.Desktop\Redline.Calibration.Desktop.csproj
```

Load the local development fixture path when available:

```powershell
dotnet run --project src\Redline.Calibration.Desktop\Redline.Calibration.Desktop.csproj -- --fixture-log
```

## Verify

```powershell
dotnet test Redline.CalibrationStudio.sln
```

Fixture payloads under `fixtures/local/` are intentionally not included in this public snapshot. The portfolio version keeps source, tests, manifests, and structure while removing raw private calibration payloads and generated build output.
