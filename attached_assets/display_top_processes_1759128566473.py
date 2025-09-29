# display_top_processes.py
import psutil
import time
from tabulate import tabulate
import json
import datetime
import socket

# --- Top Processes ---
def get_top_processes(n=10):
    processes = []

    # Initialize CPU counters
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            proc.cpu_percent(interval=None)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    time.sleep(1)  # measure actual CPU usage

    # Collect process info
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info']):
        try:
            name = proc.info['name'] or "Unknown"
            if not name.strip():
                continue

            mem_mb = proc.info['memory_info'].rss / (1024 * 1024)  # MB
            processes.append({
                'pid': proc.info['pid'],
                'name': name,
                'cpu_percent': proc.info['cpu_percent'],
                'memory_percent': proc.info['memory_percent'],
                'memory_mb': mem_mb
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    # Top N by CPU and memory
    top_cpu = sorted(processes, key=lambda x: (-x['cpu_percent'], x['pid']))[:n]
    top_mem = sorted(processes, key=lambda x: (-x['memory_percent'], x['pid']))[:n]

    return top_cpu, top_mem

def generate_report(n=10, json_output=True):
    hostname = socket.gethostname()
    top_cpu, top_mem = get_top_processes(n)

    report = {
        "hostname": hostname,
        "top_cpu": top_cpu,
        "top_memory": top_mem,
        "collected_at": str(datetime.datetime.now())
    }

    if json_output:
        filename = f"{hostname}_top_processes.json"
        with open(filename, "w") as f:
            json.dump(report, f, indent=4)
        print(f"Top processes report saved to {filename}")
    else:
        total_ram_gb = psutil.virtual_memory().total / (1024**3)
        system_cpu = psutil.cpu_percent(interval=1)
        system_mem = psutil.virtual_memory().percent
        cpu_cores = psutil.cpu_count(logical=True)

        # --- Top CPU Table ---
        cpu_table = [[p['pid'], p['name'], f"{p['cpu_percent']:.2f} %"] for p in top_cpu]
        print(f"=== Top {n} Processes by CPU Usage ({cpu_cores} logical cores) ===")
        print(tabulate(cpu_table, headers=["PID", "Name", "CPU %"], tablefmt="grid"))
        print(f"System-wide CPU Usage: {system_cpu:.2f} %\n")

        # --- Top Memory Table ---
        mem_table = [[p['pid'], p['name'], f"{p['memory_mb']:.2f} MB", f"{p['memory_percent']:.2f} %"] for p in top_mem]
        print(f"=== Top {n} Processes by Memory Usage (Total RAM: {total_ram_gb:.2f} GB) ===")
        print(tabulate(mem_table, headers=["PID", "Name", "Memory (MB)", "Memory %"], tablefmt="grid"))
        print(f"System-wide Memory Usage: {system_mem:.2f} %\n")

    return report

if __name__ == "__main__":
    generate_report(json_output=False, n=10)
