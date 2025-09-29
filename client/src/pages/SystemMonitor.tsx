import DeviceList from "@/components/DeviceList";
import DeviceDetailView from "@/components/DeviceDetailView";
import { useState } from "react";

interface Device {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
}

export default function SystemMonitor() {
  //todo: remove mock functionality
  const mockDevices: Device[] = [
    {
      agentId: "AGENT005",
      hostname: "DESKTOP-CMM8H3C",
      os: "Windows 11 Home Single Language",
      location: "Bengaluru - Karnataka - India",
      username: "basav",
      lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
      status: "online"
    },
    {
      agentId: "AGENT003", 
      hostname: "WORKSTATION-01",
      os: "Windows 11 Pro",
      location: "New York - NY - USA",
      username: "john.doe",
      lastHeartbeat: new Date(Date.now() - 1800000).toISOString(),
      status: "warning"
    },
    {
      agentId: "AGENT001",
      hostname: "LAPTOP-DEV",
      os: "Windows 10 Enterprise",
      location: "London - England - UK", 
      username: "jane.smith",
      lastHeartbeat: new Date(Date.now() - 7200000).toISOString(),
      status: "offline"
    },
    {
      agentId: "AGENT007",
      hostname: "SERVER-PROD-01",
      os: "Windows Server 2022",
      location: "Tokyo - Tokyo - Japan",
      username: "admin.server",
      lastHeartbeat: new Date(Date.now() - 60000).toISOString(),
      status: "online"
    }
  ];

  //todo: remove mock functionality - detailed device data
  const mockDetailedDevice = {
    agentId: "AGENT005",
    hostname: "DESKTOP-CMM8H3C", 
    os: "Microsoft Windows 11 Home Single Language (10.0.26100)",
    location: "Bengaluru - Karnataka - India",
    username: "basav",
    lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
    status: "online" as const,
    
    systemInfo: {
      cpu: "AMD Ryzen 5 5600H with Radeon Graphics (6 cores / 12 threads, 3301 MHz)",
      ram: "7.35 GB",
      graphics: "AMD Radeon(TM) Graphics, Radeon RX 5500M",
      totalDisk: "476.11 GB"
    },
    
    diskInfo: [
      {
        Device: "C:\\",
        Total: "389.79 GB",
        Used: "231.05 GB", 
        Free: "158.74 GB",
        "Usage %": "59.3 %"
      },
      {
        Device: "E:\\",
        Total: "86.31 GB",
        Used: "21.10 GB",
        Free: "65.22 GB", 
        "Usage %": "24.4 %"
      }
    ],
    
    topProcesses: {
      top_cpu: [
        {
          pid: 48408,
          name: "WmiPrvSE.exe",
          cpu_percent: 25.2,
          memory_percent: 0.505,
          memory_mb: 37.98
        },
        {
          pid: 5264,
          name: "am_aiops_agent_restart.exe", 
          cpu_percent: 15.6,
          memory_percent: 0.076,
          memory_mb: 5.69
        }
      ],
      top_memory: [
        {
          pid: 21908,
          name: "brave.exe",
          cpu_percent: 0.0,
          memory_percent: 4.095,
          memory_mb: 308.05
        },
        {
          pid: 3488,
          name: "MemCompression",
          cpu_percent: 0.0, 
          memory_percent: 3.245,
          memory_mb: 244.12
        }
      ]
    },
    
    networkInfo: {
      local_ip: "192.168.1.80",
      public_ip: "139.167.219.110",
      location: "Bengaluru - Karnataka - India",
      nic_details: [
        {
          Description: "Realtek Gaming GbE Family Controller",
          MAC: "84:69:93:6F:43:04",
          ConnectionType: "LAN",
          "IP Addresses": "192.168.1.80, fe80::ba77:9754:bc7:6e3b"
        }
      ]
    },
    
    windowsSecurity: {
      windows_defender: {
        antivirus_enabled: true,
        real_time_protection: true,
        am_service_running: true,
        last_quick_scan_days_ago: 2
      },
      firewall: [
        { profile: "Domain", enabled: true },
        { profile: "Private", enabled: true },
        { profile: "Public", enabled: true }
      ],
      uac_status: "Enabled",
      installed_av: [
        { name: "Windows Defender", state: "Enabled" }
      ],
      restart_pending: false,
      recent_patches: [
        { hotfix_id: "KB5034441", installed_on: "2024-01-15T10:30:00Z" },
        { hotfix_id: "KB5034123", installed_on: "2024-01-10T14:20:00Z" }
      ]
    },
    
    installedApps: [
      {
        name: "Google Chrome",
        version: "140.0.7339.208",
        publisher: "Google LLC",
        install_location: "Unknown"
      },
      {
        name: "Docker Desktop",
        version: "4.38.0",
        publisher: "Docker Inc.", 
        install_location: "C:\\Program Files\\Docker\\Docker"
      },
      {
        name: "Cursor 0.45.14",
        version: "0.45.14",
        publisher: "Cursor AI, Inc.",
        install_location: "Unknown"
      },
      {
        name: "PostgreSQL 17",
        version: "17.5-2",
        publisher: "PostgreSQL Global Development Group",
        install_location: "C:\\Program Files\\PostgreSQL\\17"
      }
    ],
    
    openPorts: [
      {
        ip: "0.0.0.0",
        local_port: 445,
        process_name: "System",
        protocol: "TCP",
        service: "SMB",
        critical: true,
        recommendation: "Check / Restrict Access"
      }
    ]
  };

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleBackToList = () => {
    setSelectedDevice(null);
  };

  const handleRefresh = () => {
    console.log('Refreshing system monitor data...');
    // In real app, this would fetch fresh data from the API
  };

  if (selectedDevice) {
    return (
      <DeviceDetailView 
        device={mockDetailedDevice}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <DeviceList 
      devices={mockDevices}
      onDeviceSelect={handleDeviceSelect}
      onRefresh={handleRefresh}
    />
  );
}