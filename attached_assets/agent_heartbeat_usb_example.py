
import psutil
import subprocess
import json

def get_usb_devices():
    """Get USB storage devices for heartbeat"""
    usb_devices = []
    
    try:
        # Windows method using WMI
        if platform.system() == "Windows":
            import wmi
            c = wmi.WMI()
            
            # Get USB storage devices
            for disk in c.Win32_DiskDrive():
                if disk.InterfaceType == "USB":
                    usb_devices.append({
                        "DeviceID": disk.DeviceID,
                        "Model": disk.Model or "Unknown USB Device",
                        "SizeGB": round(int(disk.Size) / (1024**3), 2) if disk.Size else None
                    })
                    
    except Exception as e:
        print(f"[Warning] Failed to get USB devices: {e}")
    
    return usb_devices

def build_heartbeat_payload():
    system_info = generate_report(json_output=False)
    
    # Extract data from the nested structure returned by generate_report
    system_data = system_info.get("SystemInfo", {})
    network_data = system_info.get("NetworkInfo", {})
    
    # Get USB devices for this heartbeat
    usb_devices = get_usb_devices()
    
    return {
        "agentId": AGENT_ID,
        "deviceName": system_data.get("deviceName", socket.gethostname()),
        "username": getpass.getuser(),
        "os": system_data.get("os", platform.system()),
        "edition": system_data.get("edition", "Unknown"),
        "cpu": system_data.get("cpu", "Unknown"),
        "ram": system_data.get("ram", "Unknown"),
        "graphics": system_data.get("graphics", "Unknown"),
        "localIp": network_data.get("local_ip", "127.0.0.1"),
        "publicIp": network_data.get("public_ip", "0.0.0.0"),
        "location": network_data.get("location", "Unknown"),
        "usbDevices": usb_devices,  # Include USB devices in heartbeat
        "collectedAt": datetime.datetime.utcnow().isoformat()
    }
