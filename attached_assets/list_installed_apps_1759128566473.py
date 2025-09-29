# list_installed_apps.py
import winreg
from tabulate import tabulate
import json
import datetime
import socket

def enum_installed_apps():
    uninstall_keys = [
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall")
    ]

    apps = []

    for root, key_path in uninstall_keys:
        try:
            reg_key = winreg.OpenKey(root, key_path)
        except FileNotFoundError:
            continue

        for i in range(winreg.QueryInfoKey(reg_key)[0]):
            try:
                sub_key_name = winreg.EnumKey(reg_key, i)
                sub_key = winreg.OpenKey(reg_key, sub_key_name)
                name, version, publisher, install_loc = None, None, None, None

                try:
                    name = winreg.QueryValueEx(sub_key, "DisplayName")[0]
                except FileNotFoundError:
                    continue

                try:
                    publisher = winreg.QueryValueEx(sub_key, "Publisher")[0]
                except FileNotFoundError:
                    publisher = "Unknown"

                system_publishers = ["Microsoft Corporation", "Windows", "Microsoft"]
                if any(pub in publisher for pub in system_publishers):
                    continue

                try:
                    version = winreg.QueryValueEx(sub_key, "DisplayVersion")[0]
                except FileNotFoundError:
                    version = "Unknown"

                try:
                    install_loc = winreg.QueryValueEx(sub_key, "InstallLocation")[0] or "Unknown"
                except FileNotFoundError:
                    install_loc = "Unknown"

                apps.append({
                    "name": name,
                    "version": version,
                    "publisher": publisher,
                    "install_location": install_loc
                })

            except EnvironmentError:
                continue

    return apps

def generate_report(json_output=True):
    apps = enum_installed_apps()
    hostname = socket.gethostname()
    report = {
        "hostname": hostname,
        "installed_apps": apps,
        "collected_at": str(datetime.datetime.now())
    }

    if json_output:
        filename = f"{hostname}_installed_apps.json"
        with open(filename, "w") as f:
            json.dump(report, f, indent=4)
        print(f"Installed applications report saved to {filename}")
    else:
        print(f"=== Installed Applications (User + Non-System, {len(apps)} apps) ===")
        table = [[a["name"], a["version"], a["publisher"], a["install_location"]] for a in apps]
        print(tabulate(table, headers=["Name", "Version", "Publisher", "Install Location"], tablefmt="grid"))

    return report

if __name__ == "__main__":
    generate_report(json_output=False)

