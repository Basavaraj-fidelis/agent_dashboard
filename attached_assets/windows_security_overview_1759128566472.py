# windows_security_overview.py
import subprocess
import json
from datetime import datetime
from tabulate import tabulate
import socket

# --- Helper to run PowerShell commands ---
def run_powershell(cmd):
    completed = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
    return completed.stdout.strip(), completed.returncode

# --- Windows Defender Status ---
def get_defender_status():
    status = {
        "antivirus_enabled": False,
        "real_time_protection": False,
        "am_service_running": False,
        "last_quick_scan_days_ago": "N/A"
    }
    try:
        cmd = 'Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AMServiceEnabled,QuickScanEndTime | ConvertTo-Json'
        output, code = run_powershell(cmd)
        if code == 0 and output:
            data = json.loads(output)
            status["antivirus_enabled"] = data.get("AntivirusEnabled", False)
            status["real_time_protection"] = data.get("RealTimeProtectionEnabled", False)
            status["am_service_running"] = data.get("AMServiceEnabled", False)
            qst = data.get("QuickScanEndTime")
            if qst:
                last_scan = datetime.strptime(qst, "%m/%d/%Y %I:%M:%S %p")
                status["last_quick_scan_days_ago"] = (datetime.now() - last_scan).days
    except Exception:
        pass
    return status

# --- Firewall Status ---
def get_firewall_status():
    profiles = []
    try:
        cmd = 'Get-NetFirewallProfile | Select-Object Name,Enabled | ConvertTo-Json'
        output, code = run_powershell(cmd)
        if code == 0 and output:
            data = json.loads(output)
            if isinstance(data, dict):
                data = [data]
            for profile in data:
                profiles.append({
                    "profile": profile.get("Name", "Unknown"),
                    "enabled": bool(profile.get("Enabled", 0))
                })
    except Exception:
        pass
    return profiles

# --- User Account Control ---
def get_uac_status():
    status = "Disabled"
    try:
        cmd = '(Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name EnableLUA).EnableLUA'
        output, code = run_powershell(cmd)
        if code == 0:
            status = "Enabled" if output.strip() == "1" else "Disabled"
    except Exception:
        pass
    return status

# --- Installed Antivirus Products ---
def get_installed_av():
    avs = []
    try:
        cmd = 'Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct | Select-Object displayName,productState | ConvertTo-Json'
        output, code = run_powershell(cmd)
        if code == 0 and output:
            data = json.loads(output)
            if isinstance(data, dict):
                data = [data]
            for av in data:
                state_val = av.get("productState", 0)
                state = "Enabled" if state_val else "Disabled"
                avs.append({"name": av.get("displayName", "Unknown"), "state": state})
    except Exception:
        pass
    return avs

# --- Security Center Health ---
def get_security_center_health():
    try:
        cmd = 'Get-CimInstance -Namespace root/SecurityCenter2 -ClassName SecurityHealth | ConvertTo-Json'
        output, code = run_powershell(cmd)
        if code == 0 and output:
            return json.loads(output)
    except Exception:
        pass
    return "Not available"

# --- Restart Pending ---
def is_restart_pending():
    try:
        cmd = '(Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired" -ErrorAction SilentlyContinue).PSChildName'
        output, code = run_powershell(cmd)
        return bool(output.strip())
    except:
        return False

# --- Recent Installed Windows Updates / Patches ---
def get_recent_patches(limit=10):
    patches = []
    try:
        cmd = f'Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object HotFixID,InstalledOn | ConvertTo-Json -Depth 3'
        output, code = run_powershell(cmd)
        if code == 0 and output:
            data = json.loads(output)
            if isinstance(data, dict):
                data = [data]
            for patch in data[:limit]:
                inst_on = patch.get("InstalledOn")
                if isinstance(inst_on, dict):
                    inst_on = inst_on.get("DateTime", str(inst_on))
                patches.append({
                    "hotfix_id": patch.get("HotFixID", "Unknown"),
                    "installed_on": inst_on
                })
    except Exception:
        pass
    return patches

# --- Generate full report ---
def generate_report(json_output=True):
    hostname = socket.gethostname()
    report = {
        "hostname": hostname,
        "windows_defender": get_defender_status(),
        "firewall": get_firewall_status(),
        "uac_status": get_uac_status(),
        "installed_av": get_installed_av(),
        "security_center_health": get_security_center_health(),
        "recent_patches": get_recent_patches(10),
        "restart_pending": is_restart_pending(),
        "collected_at": str(datetime.now())
    }

    if json_output:
        filename = f"{hostname}_windows_security.json"
        with open(filename, "w") as f:
            json.dump(report, f, indent=4)
        print(f"Windows security report saved to {filename}")
    else:
        print(json.dumps(report, indent=4))

    return report

# --- Run standalone ---
if __name__ == "__main__":
    generate_report(json_output=False)
