# Display_agent_open_ports.py
import psutil
import socket
from tabulate import tabulate
import datetime
import json

SERVICE_MAP = {
    135: ("RPC", True),
    139: ("NetBIOS", True),
    445: ("SMB", True),
    5000: ("Web/Flask", True),
    5432: ("PostgreSQL", True),
    7070: ("AnyDesk/Remote", True),
    8080: ("HTTP-alt", True),
}

def get_open_ports():
    """Return list of open ports with details."""
    connections = psutil.net_connections(kind="inet")
    open_ports = []

    for conn in connections:
        laddr = conn.laddr
        if not laddr:
            continue
        ip = laddr.ip
        port = laddr.port
        proto = "TCP" if conn.type == socket.SOCK_STREAM else "UDP"
        proc_name = "Unknown"
        try:
            if conn.pid:
                proc_name = psutil.Process(conn.pid).name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

        service, critical = SERVICE_MAP.get(port, ("Unknown", False))
        recommendation = "Check / Restrict Access" if critical else "Monitor"

        if critical:  # only critical ports for report
            open_ports.append({
                "ip": ip,
                "local_port": port,
                "process_name": proc_name,
                "protocol": proto,
                "service": service,
                "critical": critical,
                "recommendation": recommendation,
            })

    return open_ports

def display_open_ports():
    """Print the open ports grouped by IP."""
    ports = get_open_ports()
    grouped = {}
    for entry in ports:
        grouped.setdefault(entry["ip"], []).append(entry)

    for ip, entries in grouped.items():
        print(f"\nIP: {ip}")
        table = [[e["local_port"], e["process_name"], e["protocol"], e["service"],
                  e["critical"], e["recommendation"]] for e in entries]
        print(tabulate(table, headers=["LocalPort", "ProcessName", "Protocol", "Service",
                                       "Critical", "Recommendation"], tablefmt="grid"))

def generate_report(json_output=True):
    hostname = socket.gethostname()
    ports = get_open_ports()
    report = {
        "hostname": hostname,
        "open_ports": ports,
        "collected_at": str(datetime.datetime.now())
    }

    if json_output:
        filename = f"{hostname}_open_ports.json"
        with open(filename, "w") as f:
            json.dump(report, f, indent=4)
        print(f"Open ports report saved to {filename}")
    else:
        display_open_ports()

    return report

if __name__ == "__main__":
    generate_report(json_output=False)
