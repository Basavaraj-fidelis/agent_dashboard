# display_agent_data.py
import platform
import psutil
import requests
from tabulate import tabulate
import datetime
import socket
import wmi
import json
import os

# --- System Info ---
def get_system_info():
    SKU_MAP = {
        48: "Home",
        100: "Home Single Language",
        101: "Pro",
        103: "Pro Education",
        121: "Education",
        123: "Enterprise",
    }

    c = wmi.WMI()
    os_info = c.Win32_OperatingSystem()[0]
    computer = c.Win32_ComputerSystem()[0]
    cpu = c.Win32_Processor()[0]

    gpus = [gpu.Name for gpu in c.Win32_VideoController()]

    total_disk = sum([int(d.Size) for d in c.Win32_LogicalDisk() if d.Size])
    total_disk_gb = round(total_disk / (1024**3), 2)

    info = {
        "Device Name": computer.Name,
        "OS": f"{os_info.Caption} ({os_info.Version})",
        "Edition": SKU_MAP.get(os_info.OperatingSystemSKU, f"Unknown ({os_info.OperatingSystemSKU})"),
        "CPU": f"{cpu.Name} ({cpu.NumberOfCores} cores / {cpu.NumberOfLogicalProcessors} threads, {cpu.MaxClockSpeed} MHz)",
        "RAM": f"{round(int(computer.TotalPhysicalMemory) / (1024**3), 2)} GB",
        "Graphics": ", ".join(gpus) if gpus else "Unknown",
        "Users": ", ".join([u.name for u in psutil.users()]),
        "Total Disk": f"{total_disk_gb} GB"
    }

    return info

# --- Disk Info ---
def get_disk_info():
    disk_info = []
    for partition in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            disk_info.append({
                "Device": partition.device,
                "Mountpoint": partition.mountpoint,
                "FileSystem": partition.fstype,
                "Total": f"{usage.total / (1024**3):.2f} GB",
                "Used": f"{usage.used / (1024**3):.2f} GB",
                "Free": f"{usage.free / (1024**3):.2f} GB",
                "Usage %": f"{usage.percent} %"
            })
        except PermissionError:
            continue
    return disk_info

# --- Network Info ---
def get_local_ipv4():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "Unknown"

def get_public_ip_info():
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        geo = requests.get("https://ipwhois.app/json/", headers=headers, timeout=5).json()
        public_ip = geo.get("ip", "Unknown")
        city = geo.get("city", "")
        region = geo.get("region", "")
        country = geo.get("country", "")
        flag_img = geo.get("flag", {}).get("img", "")
        flag_emoji = geo.get("flag", {}).get("emoji", "")
        location = f"{city} - {region} - {country} {flag_emoji}"
        return public_ip, location, flag_img
    except Exception as e:
        print(f"[Warning] Could not fetch public IP / location: {e}")
        return "Unknown", "Unknown", ""

def get_nic_info():
    c = wmi.WMI()
    nic_info = []
    for nic in c.Win32_NetworkAdapterConfiguration(IPEnabled=True):
        mac = nic.MACAddress if nic.MACAddress else "Unknown"
        conn_type = "Wi-Fi" if "Wireless" in (nic.Description or "") else "LAN"
        ip_addresses = ", ".join(nic.IPAddress) if nic.IPAddress else "Unknown"
        nic_info.append({
            "Description": nic.Description,
            "MAC": mac,
            "ConnectionType": conn_type,
            "IP Addresses": ip_addresses
        })
    return nic_info

def get_network_info():
    local_ip = get_local_ipv4()
    public_ip, location, flag_img = get_public_ip_info()
    nic_details = get_nic_info()
    return {
        "Local IP": local_ip,
        "Public IP": public_ip,
        "Location": location,
        "Flag URL": flag_img,
        "NIC Details": nic_details
    }

# --- USB Info ---
def get_usb_storage_devices():
    c = wmi.WMI()
    devices = []
    for disk in c.Win32_DiskDrive(InterfaceType="USB"):
        device_info = {
            "DeviceID": disk.DeviceID,
            "Model": disk.Model,
            "SizeGB": round(int(disk.Size) / (1024**3), 2) if disk.Size else "N/A",
            "Status": disk.Status
        }
        devices.append(device_info)
    return devices

# --- Display Data ---
def display_data():
    system_info = get_system_info()
    network_info = get_network_info()
    disk_info = get_disk_info()
    usb_devices = get_usb_storage_devices()

    # System Info Table
    sys_table = [[k, v] for k, v in system_info.items()]
    print("=== System Info ===")
    print(tabulate(sys_table, headers=["Property", "Value"], tablefmt="grid"))
    print()

    # Network Info Table
    net_table = [[k, v] for k, v in network_info.items() if k != "NIC Details"]
    print("=== Network Info ===")
    print(tabulate(net_table, headers=["Property", "Value"], tablefmt="grid"))
    print()

    # NIC Details Table
    nic_list = network_info.get("NIC Details", [])
    if nic_list:
        nic_table = [[d["Description"], d["MAC"], d["ConnectionType"], d["IP Addresses"]] for d in nic_list]
        print("=== NIC Details ===")
        print(tabulate(nic_table, headers=["Description", "MAC", "Connection Type", "IP Addresses"], tablefmt="grid"))
        print()

    # Disk Info Table
    if disk_info:
        disk_table = [[d["Device"], d["Mountpoint"], d["FileSystem"], d["Total"], d["Used"], d["Free"], d["Usage %"]] for d in disk_info]
        print("=== Disk Partitions & Usage ===")
        print(tabulate(disk_table, headers=["Device", "Mountpoint", "FS", "Total", "Used", "Free", "Usage %"], tablefmt="grid"))
        print()
    else:
        print("=== Disk Partitions & Usage ===")
        print("No disk partitions found.\n")

    # USB Info Table
    if usb_devices:
        usb_table = [[d["DeviceID"], d["Model"], d["SizeGB"], d["Status"]] for d in usb_devices]
        print("=== USB Storage Devices ===")
        print(tabulate(usb_table, headers=["DeviceID", "Model", "Size (GB)", "Status"], tablefmt="grid"))
        print()
    else:
        print("=== USB Storage Devices ===")
        print("No USB storage devices found.\n")

# --- Generate Report ---
def generate_report(json_output=True):
    system_info_raw = get_system_info()
    network_info_raw = get_network_info()
    disk_info = get_disk_info()
    usb_devices = get_usb_storage_devices()

    # Normalize keys
    system_info = {
        "deviceName": system_info_raw.get("Device Name"),
        "os": system_info_raw.get("OS"),
        "edition": system_info_raw.get("Edition"),
        "cpu": system_info_raw.get("CPU"),
        "ram": system_info_raw.get("RAM"),
        "graphics": system_info_raw.get("Graphics"),
        "users": system_info_raw.get("Users"),
        "total_disk": system_info_raw.get("Total Disk")
    }

    network_info = {
        "local_ip": network_info_raw.get("Local IP"),
        "public_ip": network_info_raw.get("Public IP"),
        "location": network_info_raw.get("Location"),
        "flag_url": network_info_raw.get("Flag URL"),
        "nic_details": network_info_raw.get("NIC Details")
    }

    report = {
        "SystemInfo": system_info,
        "NetworkInfo": network_info,
        "DiskInfo": disk_info,
        "USBDevices": usb_devices,
        "CollectedAt": str(datetime.datetime.now())
    }

    if json_output:
        hostname = system_info.get("deviceName", "agent_report")
        filename = f"{hostname}.json"
        with open(filename, "w") as f:
            json.dump(report, f, indent=4)
        print(f"System info report saved to {filename}")
    else:
        display_data()

    return report

if __name__ == "__main__":
    display_data()
