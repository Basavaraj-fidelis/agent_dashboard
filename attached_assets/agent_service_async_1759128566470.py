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

ITSM_HEARTBEAT_URL = config.get("ITSM", "HEARTBEAT_URL")
ITSM_REPORT_URL = config.get("ITSM", "FULL_REPORT_URL")
ITSM_COMMANDS_URL = config.get("ITSM", "COMMANDS_URL")
ITSM_RESULTS_URL = config.get("ITSM", "RESULTS_URL")

DB_URL = config.get("Database", "DB_URL")

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

def insert_full_report(agent_id, report_json):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO full_report_log(agent_id, report_json, collected_at)
        VALUES (%s, %s, NOW())
    """, (agent_id, json.dumps(report_json)))
    conn.commit()
    cur.close()
    conn.close()

# ======================
# Heartbeat Payload
# ======================
def build_heartbeat_payload():
    system_info = generate_report(json_output=False)
    network_info = system_info.get("network_info", {})
    return {
        "agentId": AGENT_ID,
        "deviceName": system_info.get("device_name"),
        "username": getpass.getuser(),
        "os": system_info.get("os"),
        "edition": system_info.get("edition"),
        "cpu": system_info.get("cpu"),
        "ram": system_info.get("ram"),
        "graphics": system_info.get("graphics"),
        "localIp": network_info.get("local_ip", "127.0.0.1"),
        "publicIp": network_info.get("public_ip", "0.0.0.0"),
        "location": network_info.get("location", "Unknown"),
        "collectedAt": datetime.datetime.utcnow().isoformat()
    }

def send_heartbeat():
    try:
        heartbeat_data = build_heartbeat_payload()
        resp = requests.post(ITSM_HEARTBEAT_URL, json=heartbeat_data, timeout=10)
        if resp.status_code == 200:
            print(f"[Info] Heartbeat sent at {datetime.datetime.now()}")
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

def push_file_to_itsm(filepath):
    try:
        with open(filepath, "rb") as f:
            resp = requests.post(ITSM_REPORT_URL, files={"file": f}, timeout=15)
        if resp.status_code == 200:
            print(f"[Info] Full report sent at {datetime.datetime.now()}")
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
                insert_full_report(AGENT_ID, report_json)
            except Exception as e:
                print(f"[Error] Saving full report to DB failed: {e}")
            push_file_to_itsm(report_file)
            LAST_FULL_REPORT = time.time()

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

        for cmd in commands:
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

if __name__ == "__main__":
    print("[Info] Starting ITSMAgent service...")
    main_loop()
