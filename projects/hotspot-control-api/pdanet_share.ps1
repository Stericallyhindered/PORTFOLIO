param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("status", "start", "stop", "configure")]
    [string]$Action,

    [string]$Ssid,
    [string]$Passphrase
)

$ErrorActionPreference = "Stop"

$PdaNetDir = "${env:ProgramFiles(x86)}\PdaNet for Android"
$WiFiShareExe = Join-Path $PdaNetDir "WiFiShare10.exe"
$RegPath = "HKCU:\Software\PdaNetAndroid"

function Get-PdaNetPaths {
    if (-not (Test-Path $WiFiShareExe)) {
        $legacy = Join-Path $PdaNetDir "WiFiShare.exe"
        if (Test-Path $legacy) {
            return $legacy
        }
        throw "PdaNet WiFi Share not found. Install PdaNet for Android on this PC."
    }
    return $WiFiShareExe
}

function Get-PdaNetRegistry {
    if (-not (Test-Path $RegPath)) {
        return @{
            ssid       = ""
            passphrase = ""
        }
    }

    $values = Get-ItemProperty $RegPath
    return @{
        ssid       = [string]$values.WifiSSID
        passphrase = [string]$values.WifiPassword
    }
}

function Set-PdaNetRegistry {
    param([string]$Ssid, [string]$Passphrase)

    if (-not (Test-Path $RegPath)) {
        New-Item -Path $RegPath -Force | Out-Null
    }

    Set-ItemProperty -Path $RegPath -Name WifiSSID -Value $Ssid
    Set-ItemProperty -Path $RegPath -Name WifiPassword -Value $Passphrase
}

function Test-PdaNetConnected {
    $adapter = Get-NetAdapter -ErrorAction SilentlyContinue |
        Where-Object { $_.InterfaceDescription -like "*PdaNet*" -and $_.Status -eq "Up" } |
        Select-Object -First 1
    return [bool]$adapter
}

function Get-WifiShareProcesses {
    Get-Process -Name "WiFiShare", "WiFiShare10" -ErrorAction SilentlyContinue
}

function Get-HotspotState {
    $running = Get-WifiShareProcesses
    $wifiDirect = Get-NetAdapter -ErrorAction SilentlyContinue |
        Where-Object { $_.InterfaceDescription -like "*Wi-Fi Direct*" } |
        Select-Object -First 1

    $state = "Off"
    if ($wifiDirect -and $wifiDirect.Status -eq "Up") {
        $state = "On"
    }
    elseif ($running) {
        $state = "InTransition"
    }

    $settings = Get-PdaNetRegistry
    $pdanetUp = Test-PdaNetConnected

    return @{
        success        = $true
        action         = "status"
        state          = $state
        ssid           = $settings.ssid
        passphrase     = $settings.passphrase
        clients        = 0
        method         = "pdanet"
        isPdaNet       = $true
        upstream       = if ($pdanetUp) { "PdaNet Broadband Connection" } else { "PdaNet (not connected)" }
        pdanetConnected = $pdanetUp
        wifiShareRunning = [bool]$running
        wifiDirectName = if ($wifiDirect) { $wifiDirect.Name } else { "" }
        needsBootstrap = (-not $wifiDirect -and $state -ne "On")
    }
}

function Start-PdaNetWifiShare {
    if (-not (Test-PdaNetConnected)) {
        throw "PdaNet is not connected. Plug in your phone, open PdaNet, and tap Connect USB first."
    }

    $exe = Get-PdaNetPaths
    $existing = Get-WifiShareProcesses
    if (-not $existing) {
        Start-Process -FilePath $exe | Out-Null
        Start-Sleep -Seconds 2
    }
    else {
        foreach ($proc in $existing) {
            if ($proc.MainWindowHandle -ne 0) {
                Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Native {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
                [void][Native]::ShowWindow($proc.MainWindowHandle, 9)
                [void][Native]::SetForegroundWindow($proc.MainWindowHandle)
            }
        }
    }

    return Get-HotspotState
}

function Stop-PdaNetWifiShare {
    Get-WifiShareProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    return Get-HotspotState
}

try {
    switch ($Action) {
        "status" {
            $payload = Get-HotspotState
        }
        "configure" {
            if ([string]::IsNullOrWhiteSpace($Ssid)) {
                throw "SSID is required."
            }
            if ([string]::IsNullOrWhiteSpace($Passphrase) -or $Passphrase.Length -lt 8) {
                throw "Passphrase must be at least 8 characters."
            }
            Set-PdaNetRegistry -Ssid $Ssid.Trim() -Passphrase $Passphrase
            $payload = Get-HotspotState
            $payload.action = "configure"
            $payload.operationStatus = "Success"
        }
        "start" {
            $payload = Start-PdaNetWifiShare
            $payload.action = "start"
            $payload.operationStatus = if ($payload.state -eq "On") { "Success" } else { "ActivateInPdaNetWindow" }
            $payload.success = $true
            if ($payload.state -ne "On") {
                $payload.bootstrapHint = @(
                    "PdaNet WiFi Share opened. Click Activate in that window."
                    "If you only use PdaNet USB, Windows may still block Wi-Fi sharing until you do this one-time unlock:"
                    "1) Turn on your phone hotspot for 30 seconds."
                    "2) Connect this PC to it, turn on Windows Mobile Hotspot in Settings, then disconnect from phone Wi-Fi."
                    "3) Reconnect PdaNet USB and click Activate in PdaNet WiFi Share."
                    "You are not giving up USB-only internet. This only initializes Windows Wi-Fi sharing once."
                ) -join " "
            }
        }
        "stop" {
            $payload = Stop-PdaNetWifiShare
            $payload.action = "stop"
            $payload.operationStatus = "Success"
            $payload.success = $true
        }
    }

    $payload | ConvertTo-Json -Compress
}
catch {
    @{
        success = $false
        action  = $Action
        error   = $_.Exception.Message
        isPdaNet = $true
        method  = "pdanet"
    } | ConvertTo-Json -Compress
    exit 1
}
