#agent_serivce_async.py
import time
import datetime
import threading
import os
import json
import subprocess
import requests
import configparser
import psycopg2
import getpass
import platform
import socket
from display_agent_data import generate_report
import nmap
import asyncio
from agent_remote_desktop import start_remote_desktop_service

# ======================
# Load config
# ======================
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.ini")
config = configparser.ConfigParser()
config.read(CONFIG_FILE)

HEARTBEAT_INTERVAL = config.getint("GENERAL", "HEARTBEAT_INTERVAL", fallback=300)
FULL_REPORT_INTERVAL = config.getint("GENERAL", "FULL_REPORT_INTERVAL", fallback=3600)
FULL_REPORT_FILENAME = config.get("GENERAL", "FULL_REPORT_FILENAME", fallback="full_system_report.json")
AGENT_ID = config.get("GENERAL", "AGENT_ID", fallback="AGENT001")
REMOTE_DESKTOP_SERVER_URL = config.get("GENERAL", "REMOTE_DESKTOP_SERVER_URL", fallback="ws://0.0.0.0:5000")

# ITSM URLs are now dynamically constructed using AGENT_ID
ITSM_HEARTBEAT_URL = config.get("ITSM", "HEARTBEAT_URL").replace('{AGENT_ID}', AGENT_ID)
ITSM_REPORT_URL = config.get("ITSM", "FULL_REPORT_URL").replace('{AGENT_ID}', AGENT_ID)
ITSM_COMMANDS_URL = config.get("ITSM", "COMMANDS_URL").replace('{AGENT_ID}', AGENT_ID)
ITSM_RESULTS_URL = config.get("ITSM", "RESULTS_URL").replace('{AGENT_ID}', AGENT_ID)

# Use environment variable for database URL (same as the main app)
DB_URL = os.environ.get("DATABASE_URL", config.get("Database", "DB_URL", fallback=""))

# ======================
# Globals
# ======================
LAST_FULL_REPORT = None
LOCK = threading.Lock()

# ======================
# PostgreSQL helpers
# ======================
def get_db_connection():
    return psycopg2.connect(DB_URL, sslmode='require')

def ensure_agent_registered(conn, agent_id, hostname, os_name, location, username):
    """
    Ensure the agent row exists in the database and update all fields
    to reflect current system info.
    """
    # Ensure no null values for required fields
    hostname = hostname or socket.gethostname()
    os_name = os_name or platform.system()
    location = location or "Unknown"
    username = username or getpass.getuser()
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO agents (agent_id, hostname, os, location, last_heartbeat, username)
            VALUES (%s, %s, %s, %s, NOW(), %s)
            ON CONFLICT (agent_id)
            DO UPDATE SET last_heartbeat = EXCLUDED.last_heartbeat,
                          hostname = EXCLUDED.hostname,
                          os = EXCLUDED.os,
                          location = EXCLUDED.location,
                          username = EXCLUDED.username;
        """, (agent_id, hostname, os_name, location, username))
        conn.commit()

def insert_heartbeat(agent_id, heartbeat_data):
    try:
        conn = get_db_connection()
        ensure_agent_registered(conn,
                                agent_id,
                                heartbeat_data["deviceName"],
                                heartbeat_data["os"],
                                heartbeat_data["location"],
                                heartbeat_data["username"])
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO heartbeat_current(agent_id, collected_at, local_ip, public_ip, location)
            VALUES (%s, NOW(), %s, %s, %s)
            ON CONFLICT (agent_id)
            DO UPDATE SET collected_at = NOW(),
                          local_ip = EXCLUDED.local_ip,
                          public_ip = EXCLUDED.public_ip,
                          location = EXCLUDED.location;
        """, (agent_id, heartbeat_data.get("localIp"), heartbeat_data.get("publicIp"), heartbeat_data.get("location")))
        cur.execute("""
            INSERT INTO heartbeat_history(agent_id, collected_at, local_ip, public_ip, location)
            VALUES (%s, NOW(), %s, %s, %s)
        """, (agent_id, heartbeat_data.get("localIp"), heartbeat_data.get("publicIp"), heartbeat_data.get("location")))
        conn.commit()
        cur.close()
        conn.close()
        print(f"[Info] Heartbeat data saved to database")
    except Exception as e:
        print(f"[Warning] Failed to save heartbeat to database: {e}")

def insert_full_report(agent_id, report_json):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO agent_reports(agent_id, report_type, report_data, collected_at)
            VALUES (%s, %s, %s, NOW())
        """, (agent_id, "full_system_report", json.dumps(report_json)))
        conn.commit()
        cur.close()
        conn.close()
        print(f"[Info] Full report saved to database")
    except Exception as e:
        print(f"[Warning] Failed to save full report to database: {e}")

# ======================
# Heartbeat Payload
# ======================
def build_heartbeat_payload():
    system_info = generate_report(json_output=False)
    
    # Extract data from the nested structure returned by generate_report
    system_data = system_info.get("SystemInfo", {})
    network_data = system_info.get("NetworkInfo", {})
    
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
        "collectedAt": datetime.datetime.utcnow().isoformat()
    }

def send_heartbeat():
    try:
        heartbeat_data = build_heartbeat_payload()
        print(f"[DEBUG] Sending heartbeat to: {ITSM_HEARTBEAT_URL}")
        print(f"[DEBUG] Heartbeat data: {json.dumps(heartbeat_data, indent=2)}")
        
        resp = requests.post(ITSM_HEARTBEAT_URL, json=heartbeat_data, timeout=10)
        if resp.status_code == 200:
            print(f"[Info] Heartbeat sent successfully at {datetime.datetime.now()}")
        else:
            print(f"[Warning] Heartbeat failed: {resp.status_code}, {resp.text}")
        insert_heartbeat(AGENT_ID, heartbeat_data)
        return True
    except Exception as e:
        print(f"[Error] Heartbeat exception: {e}")
        return False

# ======================
# Full Report
# ======================
def run_full_report():
    try:
        subprocess.run(["python", "full_system_report.py"], check=True)
        if os.path.exists(FULL_REPORT_FILENAME):
            return FULL_REPORT_FILENAME
        else:
            print(f"[Error] Full report not found: {FULL_REPORT_FILENAME}")
            return None
    except Exception as e:
        print(f"[Error] Running full_system_report.py failed: {e}")
        return None

def push_report_to_itsm(report_data):
    try:
        print(f"[DEBUG] Pushing report to: {ITSM_REPORT_URL}")
        print(f"[DEBUG] Report data keys: {list(report_data.keys()) if report_data else 'No data'}")
        
        resp = requests.post(ITSM_REPORT_URL, json=report_data, timeout=15)
        if resp.status_code == 200:
            print(f"[Info] Full report sent successfully at {datetime.datetime.now()}")
            return True
        else:
            print(f"[Error] Failed to push report: {resp.status_code}, {resp.text}")
            return False
    except Exception as e:
        print(f"[Error] Exception while pushing full report: {e}")
        return False

def full_report_worker():
    global LAST_FULL_REPORT
    with LOCK:
        report_file = run_full_report()
        if report_file:
            try:
                with open(report_file, "r") as f:
                    report_json = json.load(f)
                print(f"[DEBUG] Full report generated with keys: {list(report_json.keys())}")
                insert_full_report(AGENT_ID, report_json)
                push_report_to_itsm(report_json)
                LAST_FULL_REPORT = time.time()
            except Exception as e:
                print(f"[Error] Processing full report failed: {e}")

# ======================
# Command Polling
# ======================
def poll_commands():
    try:
        resp = requests.get(f"{ITSM_COMMANDS_URL}?agent_id={AGENT_ID}", timeout=10)
        if resp.status_code != 200:
            print(f"[Warning] Failed to fetch commands: {resp.status_code}")
            return
        if not resp.text.strip():
            return
        try:
            commands = resp.json()
        except json.JSONDecodeError:
            print("[Warning] Command polling returned non-JSON data")
            return

        # Ensure commands is a list
        if not isinstance(commands, list):
            print(f"[Warning] Expected list of commands, got {type(commands)}: {commands}")
            return

        for cmd in commands:
            # Ensure each command is a dictionary
            if not isinstance(cmd, dict):
                print(f"[Warning] Expected command dict, got {type(cmd)}: {cmd}")
                continue
            if cmd.get("command") == "remote_session":
                ...

            elif cmd.get("command") == "network_scan":
                target = cmd.get("target", "127.0.0.1")
                ports = cmd.get("ports", "1-1024")
                print(f"[Info] Starting network scan on {target} ports {ports}")
                try:
                    result = perform_network_scan(target, ports)
                    status = "completed"
                except Exception as e:
                    print(f"[Error] Network scan failed: {e}")
                    result = {"error": str(e)}
                    status = "failed"
                payload = {
                    "agent_id": AGENT_ID,
                    "command": "network_scan",
                    "status": status,
                    "target": target,
                    "ports": ports,
                    "result": result,
                    "timestamp": str(datetime.datetime.now())
                }
                try:
                    requests.post(ITSM_RESULTS_URL, json=payload, timeout=15)
                    print(f"[Info] Network scan results sent to ITSM")
                except Exception as e:
                    print(f"[Error] Failed to send network scan results: {e}")
    except Exception as e:
        print(f"[Error] Command polling failed: {e}")

# ======================
# Network Scan
# ======================
def perform_network_scan(target="127.0.0.1", ports="1-1024"):
    nm = nmap.PortScanner()
    scan_result = {}
    try:
        nm.scan(hosts=target, ports=ports, arguments='-sS')
        for host in nm.all_hosts():
            scan_result[host] = {}
            for proto in nm[host].all_protocols():
                scan_result[host][proto] = []
                for port in nm[host][proto].keys():
                    scan_result[host][proto].append({
                        "port": port,
                        "state": nm[host][proto][port]["state"],
                        "name": nm[host][proto][port]["name"]
                    })
    except Exception as e:
        scan_result["error"] = str(e)
    return scan_result

# ======================
# Main Loop
# ======================
def main_loop():
    global LAST_FULL_REPORT
    last_command_poll = 0
    COMMAND_POLL_INTERVAL = 60

    # Ensure agent row is updated immediately on startup
    try:
        heartbeat_data = build_heartbeat_payload()
        conn = get_db_connection()
        ensure_agent_registered(conn,
                                AGENT_ID,
                                heartbeat_data["deviceName"],
                                heartbeat_data["os"],
                                heartbeat_data["location"],
                                heartbeat_data["username"])
        conn.close()
    except Exception as e:
        print(f"[Error] Initial agent registration failed: {e}")

    while True:
        heartbeat_ok = send_heartbeat()
        now = time.time()

        if heartbeat_ok:
            with LOCK:
                if LAST_FULL_REPORT is None or (now - LAST_FULL_REPORT) >= FULL_REPORT_INTERVAL:
                    threading.Thread(target=full_report_worker, daemon=True).start()

        if now - last_command_poll >= COMMAND_POLL_INTERVAL:
            poll_commands()
            last_command_poll = now

        time.sleep(HEARTBEAT_INTERVAL)

async def main_async():
    """Main async function to run both services"""
    # Start remote desktop service as a background task
    remote_desktop_task = asyncio.create_task(
        start_remote_desktop_service(AGENT_ID, REMOTE_DESKTOP_SERVER_URL)
    )
    
    # Run the main loop in a separate thread since it's synchronous
    import threading
    main_thread = threading.Thread(target=main_loop, daemon=True)
    main_thread.start()
    
    # Keep the async event loop running
    try:
        await remote_desktop_task
    except KeyboardInterrupt:
        print("[Info] Shutting down services...")

if __name__ == "__main__":
    print("[Info] Starting ITSMAgent service with Remote Desktop...")
    # Check if we're already in an event loop
    try:
        loop = asyncio.get_running_loop()
        # If we're in a loop, create a task
        asyncio.create_task(start_remote_desktop_service(AGENT_ID, REMOTE_DESKTOP_SERVER_URL))
        main_loop()
    except RuntimeError:
        # No event loop running, start our own
        asyncio.run(main_async())