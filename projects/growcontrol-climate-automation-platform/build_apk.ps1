# Builds an APK with Tuya keys baked in (same as flutter run with defines).
# Requires `tuya_run.defines.env` next to this script (gitignored — never commit).
#
# Usage:
#   .\build_apk.ps1              # debug APK
#   .\build_apk.ps1 -Release     # release APK

param([switch]$Release)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$defines = Join-Path $here "tuya_run.defines.env"
if (-not (Test-Path $defines)) {
    Write-Host "Missing tuya_run.defines.env - copy from .example and add keys from Tuya Get Key." -ForegroundColor Red
    exit 1
}

$flutter = "C:\src\flutter\bin\flutter.bat"
if (-not (Test-Path $flutter)) { $flutter = "flutter" }

$extra = @("build", "apk", "--dart-define-from-file=$defines")
if ($Release) { $extra += "--release" } else { $extra += "--debug" }

Write-Host "Building APK with Tuya dart-defines from tuya_run.defines.env ..."
& $flutter @extra
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Output folder: build/app/outputs/flutter-apk/" -ForegroundColor Green
if ($Release) {
    Write-Host "  app-release.apk"
} else {
    Write-Host "  app-debug.apk"
}
