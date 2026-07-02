"""Hotspot control for PdaNet USB and Windows Mobile Hotspot."""



from __future__ import annotations



import json

import subprocess

from dataclasses import dataclass

from pathlib import Path



PDANET_SCRIPT = Path(__file__).resolve().parent / "pdanet_share.ps1"

WINRT_SCRIPT = Path(__file__).resolve().parent / "hotspot.ps1"



OPERATION_ERRORS = {

    "WiFiDeviceOff": "Windows blocked Wi-Fi sharing. See the setup steps in the app.",

    "ActivateInPdaNetWindow": "",

    "MobileHotspotDisabledByPolicy": "Mobile hotspot is disabled by your system administrator.",

    "WiFiServiceNotReady": "The Wi-Fi service is not ready. Wait a moment and try again.",

    "OperationInProgress": "Hotspot is already changing state. Please wait.",

    "UnknownError": "Windows reported an unknown error while changing hotspot state.",

    "Success": "",

}



PDANET_BOOTSTRAP_STEPS = [

    "Make sure PdaNet USB is connected (phone plugged in, PdaNet shows connected).",

    "Click Start Hotspot — PdaNet WiFi Share opens. Click Activate there.",

    "If Activate fails (USB-only), do this one-time unlock (~30 seconds):",

    "  a) Turn on your phone's Wi-Fi hotspot briefly.",

    "  b) Connect this PC to your phone's Wi-Fi.",

    "  c) Open Windows Hotspot Settings and turn Mobile Hotspot ON.",

    "  d) Disconnect this PC from phone Wi-Fi and reconnect PdaNet USB.",

    "Click Activate in PdaNet WiFi Share again — Wi-Fi sharing should work over USB only.",

]





@dataclass

class HotspotStatus:

    state: str

    ssid: str

    passphrase: str

    clients: int

    capability: str = ""

    operation_status: str | None = None

    success: bool = True

    error: str | None = None

    upstream: str = ""

    is_pdanet: bool = False

    wifi_direct_name: str = ""

    ics_enabled: bool = False

    method: str = "pdanet"

    needs_bootstrap: bool = False

    bootstrap_hint: str = ""

    pdanet_connected: bool = False

    wifi_share_running: bool = False



    @property

    def is_on(self) -> bool:

        return self.state == "On"



    @property

    def status_text(self) -> str:

        if self.state == "On":

            return "Hotspot is ON (PdaNet WiFi Share)"

        if self.state == "InTransition":

            if self.wifi_share_running:

                return "PdaNet WiFi Share is open — click Activate"

            return "Hotspot is starting..."

        if not self.pdanet_connected and self.is_pdanet:

            return "PdaNet not connected"

        return "Hotspot is OFF"



    @property

    def operation_message(self) -> str | None:

        if self.bootstrap_hint:

            return self.bootstrap_hint

        if not self.operation_status:

            return None

        if self.operation_status in {"", "Success", "ActivateInPdaNetWindow"}:

            if self.operation_status == "ActivateInPdaNetWindow" and not self.is_on:

                return "PdaNet WiFi Share opened. Click Activate in that window."

            return None

        return OPERATION_ERRORS.get(self.operation_status, self.operation_status)





def _pick_script() -> Path:

    if PDANET_SCRIPT.exists():

        return PDANET_SCRIPT

    return WINRT_SCRIPT





def _run_action(action: str, ssid: str | None = None, passphrase: str | None = None) -> HotspotStatus:

    script = _pick_script()

    if not script.exists():

        raise FileNotFoundError(f"Missing PowerShell script: {script}")



    command = [

        "powershell",

        "-NoProfile",

        "-ExecutionPolicy",

        "Bypass",

        "-File",

        str(script),

        "-Action",

        action,

    ]



    if ssid is not None:

        command.extend(["-Ssid", ssid])

    if passphrase is not None:

        command.extend(["-Passphrase", passphrase])



    completed = subprocess.run(

        command,

        capture_output=True,

        text=True,

        check=False,

        creationflags=subprocess.CREATE_NO_WINDOW,

    )



    stdout = completed.stdout.strip()

    if not stdout:

        stderr = completed.stderr.strip() or "No response from hotspot controller."

        return HotspotStatus(

            state="Off",

            ssid="",

            passphrase="",

            clients=0,

            success=False,

            error=stderr,

        )



    try:

        payload = json.loads(stdout)

    except json.JSONDecodeError as exc:

        return HotspotStatus(

            state="Off",

            ssid="",

            passphrase="",

            clients=0,

            success=False,

            error=f"Invalid controller response: {exc}",

        )



    return HotspotStatus(

        state=payload.get("state", "Off"),

        ssid=payload.get("ssid", ""),

        passphrase=payload.get("passphrase", ""),

        clients=int(payload.get("clients", 0)),

        capability=payload.get("capability", ""),

        operation_status=payload.get("operationStatus"),

        success=bool(payload.get("success", False)),

        error=payload.get("error"),

        upstream=payload.get("upstream", ""),

        is_pdanet=bool(payload.get("isPdaNet", False)),

        wifi_direct_name=payload.get("wifiDirectName", ""),

        ics_enabled=bool(payload.get("icsEnabled", False)),

        method=payload.get("method", "pdanet"),

        needs_bootstrap=bool(payload.get("needsBootstrap", False)),

        bootstrap_hint=payload.get("bootstrapHint", ""),

        pdanet_connected=bool(payload.get("pdanetConnected", False)),

        wifi_share_running=bool(payload.get("wifiShareRunning", False)),

    )





def get_status() -> HotspotStatus:

    return _run_action("status")





def start_hotspot() -> HotspotStatus:

    return _run_action("start")





def stop_hotspot() -> HotspotStatus:

    return _run_action("stop")





def configure_hotspot(ssid: str, passphrase: str) -> HotspotStatus:

    return _run_action("configure", ssid=ssid, passphrase=passphrase)





def open_mobile_hotspot_settings() -> None:

    subprocess.run(

        ["cmd", "/c", "start", "ms-settings:network-mobilehotspot"],

        check=False,

        creationflags=subprocess.CREATE_NO_WINDOW,

    )





def open_network_connections() -> None:

    subprocess.run(

        ["control.exe", "ncpa.cpl"],

        check=False,

        creationflags=subprocess.CREATE_NO_WINDOW,

    )


