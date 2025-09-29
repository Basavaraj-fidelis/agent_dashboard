# full_system_report.py
import os
import json
from datetime import datetime
import configparser
import display_agent_data
import display_top_processes
import list_installed_apps
import windows_security_overview
import Display_agent_open_ports
import socket

# ======================
# Load config
# ======================
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.ini")
config = configparser.ConfigParser()
config.read(CONFIG_FILE)
REPORT_FILE = config.get("GENERAL", "FULL_REPORT_FILENAME", fallback="full_system_report.json")

def main():
    hostname = socket.gethostname()
    print(f"\n=== Running Full System Agent Report for {hostname} ===\n")

    final_report = {
        "hostname": hostname,
        "collected_at": str(datetime.now())
    }

    # [1] Full System Info
    print("[1] Full System Info (Agent + Disk + Network + USB)")
    final_report["system_info"] = display_agent_data.generate_report(json_output=False)

    # [2] Top Processes
    print("\n[2] Top Processes")
    final_report["top_processes"] = display_top_processes.generate_report(json_output=False)

    # [3] Installed Applications
    print("\n[3] Installed Applications")
    final_report["installed_apps"] = list_installed_apps.generate_report(json_output=False)

    # [4] Windows Security Overview
    print("\n[4] Windows Security Overview")
    final_report["windows_security"] = windows_security_overview.generate_report(json_output=False)

    # [5] Open Ports Overview
    print("\n[5] Open Ports Overview")
    final_report["open_ports"] = Display_agent_open_ports.generate_report(json_output=False)

    # Remove previous report if exists
    if os.path.exists(REPORT_FILE):
        os.remove(REPORT_FILE)

    # Save the latest report
    with open(REPORT_FILE, "w") as f:
        json.dump(final_report, f, indent=4)

    print(f"\n✅ Latest full system report saved to {REPORT_FILE}")
    return final_report

if __name__ == "__main__":
    main()
