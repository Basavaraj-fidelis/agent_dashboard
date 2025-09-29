import DeviceDetailView from '../DeviceDetailView';

export default function DeviceDetailViewExample() {
  //todo: remove mock functionality
  const mockDeviceData = {
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

  return (
    <div className="p-6">
      <DeviceDetailView 
        device={mockDeviceData}
        onBack={() => console.log("Back to device list")}
      />
    </div>
  );
}