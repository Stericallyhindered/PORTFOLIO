param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("status", "start", "stop", "configure", "enable-ics", "disable-ics")]
    [string]$Action,

    [string]$Ssid,
    [string]$Passphrase
)

$ErrorActionPreference = "Stop"

[Windows.System.UserProfile.LockScreen, Windows.System.UserProfile, ContentType = WindowsRuntime] | Out-Null
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = (
    [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object {
        $_.Name -eq "AsTask" -and
        $_.IsGenericMethodDefinition -and
        $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -like "IAsyncOperation*"
    } |
    Select-Object -First 1
)

if (-not $asTaskGeneric) {
    throw "Could not find WinRT AsTask helper method."
}

function Await {
    param($WinRtTask, $ResultType)

    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

function Get-IcsManager {
    try {
        return New-Object -ComObject HNetCfg.HNetShare
    }
    catch {
        regsvr32 /s hnetcfg.dll | Out-Null
        return New-Object -ComObject HNetCfg.HNetShare
    }
}

function Get-IcsConnections {
    $mgr = Get-IcsManager
    $connections = @()

    foreach ($conn in @($mgr.EnumEveryConnection)) {
        $props = $mgr.NetConnectionProps($conn)
        $config = $mgr.INetSharingConfigurationForINetConnection($conn)
        $connections += [PSCustomObject]@{
            Connection = $conn
            Name       = $props.Name
            DeviceName = $props.DeviceName
            Sharing    = [bool]$config.SharingEnabled
            ShareType  = [string]$config.SharingConnectionType
        }
    }

    return [PSCustomObject]@{
        Manager     = $mgr
        Connections = $connections
    }
}

function Find-IcsConnection {
    param(
        [array]$Connections,
        [string[]]$NamePatterns,
        [string[]]$DevicePatterns
    )

    foreach ($pattern in $NamePatterns) {
        $match = $Connections | Where-Object { $_.Name -like $pattern } | Select-Object -First 1
        if ($match) { return $match }
    }

    foreach ($pattern in $DevicePatterns) {
        $match = $Connections | Where-Object { $_.DeviceName -like $pattern } | Select-Object -First 1
        if ($match) { return $match }
    }

    return $null
}

function Get-TetheringManager {
    $connectionProfile = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]::GetInternetConnectionProfile()
    if (-not $connectionProfile) {
        throw "No active internet connection profile found. Connect to Wi-Fi or Ethernet first."
    }

    return [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]::CreateFromConnectionProfile($connectionProfile)
}

function Get-UpstreamInfo {
    $profile = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]::GetInternetConnectionProfile()
    if (-not $profile) {
        return @{
            name    = ""
            isPdaNet = $false
        }
    }

    $name = $profile.ProfileName
    return @{
        name     = $name
        isPdaNet = ($name -like "*PdaNet*")
    }
}

function Get-WifiDirectAdapterName {
    $adapter = Get-NetAdapter -ErrorAction SilentlyContinue |
        Where-Object { $_.InterfaceDescription -like "*Wi-Fi Direct*" } |
        Select-Object -First 1

    if ($adapter) {
        return $adapter.Name
    }

    $ics = Get-IcsConnections
    $match = Find-IcsConnection -Connections $ics.Connections -NamePatterns @("Local Area Connection*") -DevicePatterns @("*Wi-Fi Direct*")
    if ($match) {
        return $match.Name
    }

    return ""
}

function Set-IcsSharing {
    param([bool]$Enable)

    $ics = Get-IcsConnections
    $public = Find-IcsConnection -Connections $ics.Connections -NamePatterns @("*PdaNet*") -DevicePatterns @("*PdaNet*")
    if (-not $public) {
        throw "PdaNet connection not found. Connect PdaNet USB first."
    }

    $wifiDirectName = Get-WifiDirectAdapterName
    $private = $null
    if ($wifiDirectName) {
        $private = $ics.Connections | Where-Object { $_.Name -eq $wifiDirectName } | Select-Object -First 1
    }

    if (-not $private) {
        throw "Wi-Fi Direct adapter not found. Enable Windows Mobile Hotspot once using the PdaNet setup steps in the app."
    }

    $publicConfig = $ics.Manager.INetSharingConfigurationForINetConnection($public.Connection)
    $privateConfig = $ics.Manager.INetSharingConfigurationForINetConnection($private.Connection)

    if ($Enable) {
        foreach ($conn in $ics.Connections) {
            if ($conn.Sharing) {
                $ics.Manager.INetSharingConfigurationForINetConnection($conn.Connection).DisableSharing()
            }
        }

        $publicConfig.EnableSharing(0)
        $privateConfig.EnableSharing(1)
    }
    else {
        if ($publicConfig.SharingEnabled) { $publicConfig.DisableSharing() }
        if ($privateConfig.SharingEnabled) { $privateConfig.DisableSharing() }
    }

    return @{
        publicName  = $public.Name
        privateName = $private.Name
        enabled     = $Enable
    }
}

function Get-StatusPayload {
    param(
        $TetheringManager,
        [string]$Method = "winrt"
    )

    $config = $TetheringManager.GetCurrentAccessPointConfiguration()
    $upstream = Get-UpstreamInfo
    $wifiDirect = Get-WifiDirectAdapterName
    $ics = Get-IcsConnections
    $icsEnabled = [bool]($ics.Connections | Where-Object { $_.Sharing })

    $state = $TetheringManager.TetheringOperationalState.ToString()
    if ($icsEnabled -and $state -ne "On") {
        $state = "On"
        $Method = "ics"
    }

    return @{
        success          = $true
        action           = "status"
        state            = $state
        ssid             = $config.Ssid
        passphrase       = $config.Passphrase
        clients          = [int]$TetheringManager.ClientCount
        capability       = if ($null -ne $TetheringManager.TetheringCapability) {
            $TetheringManager.TetheringCapability.ToString()
        } else {
            ""
        }
        upstream         = $upstream.name
        isPdaNet         = $upstream.isPdaNet
        wifiDirectName   = $wifiDirect
        icsEnabled       = $icsEnabled
        method           = $Method
        needsBootstrap   = ($upstream.isPdaNet -and -not $wifiDirect -and $state -ne "On")
    }
}

function Get-PdaNetBootstrapMessage {
    return @(
        "Windows does not share PdaNet USB directly until Mobile Hotspot is enabled once."
        "1) Turn on your phone's Wi-Fi hotspot."
        "2) Connect this PC to your phone's Wi-Fi."
        "3) Open Windows Mobile Hotspot settings and turn it ON."
        "4) Turn OFF your phone's hotspot (leave this PC hotspot on)."
        "5) Connect PdaNet USB, then press Start Hotspot here."
    ) -join " "
}

try {
    $manager = Get-TetheringManager

    switch ($Action) {
        "status" {
            $payload = Get-StatusPayload -TetheringManager $manager
        }
        "start" {
            $upstream = Get-UpstreamInfo
            $result = Await ($manager.StartTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
            $payload = Get-StatusPayload -TetheringManager $manager
            $payload.action = "start"
            $payload.operationStatus = $result.Status.ToString()
            $payload.success = ($result.Status.ToString() -eq "Success")
            $payload.method = "winrt"

            if (-not $payload.success -and $upstream.isPdaNet) {
                $wifiDirect = Get-WifiDirectAdapterName
                if ($wifiDirect) {
                    try {
                        Set-IcsSharing -Enable $true | Out-Null
                        $payload = Get-StatusPayload -TetheringManager $manager -Method "ics"
                        $payload.action = "start"
                        $payload.operationStatus = "Success"
                        $payload.success = $true
                        $payload.bootstrapHint = ""
                    }
                    catch {
                        $payload.bootstrapHint = Get-PdaNetBootstrapMessage
                        $payload.icsError = $_.Exception.Message
                    }
                }
                else {
                    $payload.bootstrapHint = Get-PdaNetBootstrapMessage
                }
            }
        }
        "stop" {
            $result = Await ($manager.StopTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
            try {
                Set-IcsSharing -Enable $false | Out-Null
            }
            catch {
                # ICS may not be configured; ignore.
            }

            $payload = Get-StatusPayload -TetheringManager $manager
            $payload.action = "stop"
            $payload.operationStatus = $result.Status.ToString()
            $payload.success = ($result.Status.ToString() -eq "Success")
        }
        "configure" {
            if ([string]::IsNullOrWhiteSpace($Ssid)) {
                throw "SSID is required."
            }
            if ([string]::IsNullOrWhiteSpace($Passphrase) -or $Passphrase.Length -lt 8) {
                throw "Passphrase must be at least 8 characters."
            }

            $config = New-Object Windows.Networking.NetworkOperators.NetworkOperatorTetheringAccessPointConfiguration
            $config.Ssid = $Ssid.Trim()
            $config.Passphrase = $Passphrase

            $null = Await ($manager.ConfigureAccessPointAsync($config)) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringAccessPointConfiguration])

            $payload = Get-StatusPayload -TetheringManager $manager
            $payload.action = "configure"
            $payload.operationStatus = "Success"
        }
        "enable-ics" {
            $info = Set-IcsSharing -Enable $true
            $payload = Get-StatusPayload -TetheringManager $manager -Method "ics"
            $payload.action = "enable-ics"
            $payload.operationStatus = "Success"
            $payload.success = $true
            $payload.icsPublic = $info.publicName
            $payload.icsPrivate = $info.privateName
        }
        "disable-ics" {
            $info = Set-IcsSharing -Enable $false
            $payload = Get-StatusPayload -TetheringManager $manager
            $payload.action = "disable-ics"
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
    } | ConvertTo-Json -Compress
    exit 1
}
