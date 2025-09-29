import DeviceList from "@/components/DeviceList";
import DeviceDetailView from "@/components/DeviceDetailView";
import { useState, useEffect } from "react";

interface Device {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
}

interface DetailedDevice {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
  systemInfo?: {
    cpu: string;
    ram: string;
    graphics: string;
    totalDisk: string;
  };
  diskInfo?: Array<{
    Device: string;
    Total: string;
    Used: string;
    Free: string;
    "Usage %": string;
  }>;
  topProcesses?: {
    top_cpu: Array<{
      pid: number;
      name: string;
      cpu_percent: number;
      memory_percent: number;
      memory_mb: number;
    }>;
    top_memory: Array<{
      pid: number;
      name: string;
      cpu_percent: number;
      memory_percent: number;
      memory_mb: number;
    }>;
  };
  networkInfo?: {
    local_ip: string;
    public_ip: string;
    location: string;
    nic_details: Array<{
      Description: string;
      MAC: string;
      ConnectionType: string;
      "IP Addresses": string;
    }>;
  };
  windowsSecurity?: {
    windows_defender: {
      antivirus_enabled: boolean;
      real_time_protection: boolean;
      am_service_running: boolean;
      last_quick_scan_days_ago: number;
    };
    firewall: Array<{
      profile: string;
      enabled: boolean;
    }>;
    uac_status: string;
    installed_av: Array<{
      name: string;
      state: string;
    }>;
    restart_pending: boolean;
    recent_patches: Array<{
      hotfix_id: string;
      installed_on: string;
    }>;
  };
  installedApps?: Array<{
    name: string;
    version: string;
    publisher: string;
    install_location: string;
  }>;
  openPorts?: Array<{
    ip: string;
    local_port: number;
    process_name: string;
    protocol: string;
    service: string;
    critical: boolean;
    recommendation: string;
  }>;
}

export default function SystemMonitor() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [detailedDevice, setDetailedDevice] = useState<DetailedDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Device[] = await response.json();
      setDevices(data || []);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeviceDetails = async (agentId: string) => {
    try {
      setIsLoadingDetails(true);

      // Fetch the latest report for this agent
      const reportResponse = await fetch(`/api/agents/${agentId}/latest-report`);
      let reportData = null;

      if (reportResponse.ok) {
        reportData = await reportResponse.json();
      }

      // Combine basic device info with detailed report data
      const baseDevice = devices.find(d => d.agentId === agentId);
      if (!baseDevice) return null;

      const detailed: DetailedDevice = {
        ...baseDevice,
        systemInfo: reportData?.system_info?.SystemInfo ? {
          cpu: reportData.system_info.SystemInfo.cpu || "Unknown",
          ram: reportData.system_info.SystemInfo.ram || "Unknown",
          graphics: reportData.system_info.SystemInfo.graphics || "Unknown",
          totalDisk: reportData.system_info.SystemInfo.total_disk || "Unknown"
        } : undefined,
        diskInfo: reportData?.system_info?.DiskInfo?.map((disk: any) => ({
          Device: disk.Device || disk.Mountpoint || "Unknown",
          Total: disk.Total || "Unknown",
          Used: disk.Used || "Unknown",
          Free: disk.Free || "Unknown",
          "Usage %": disk["Usage %"] || "Unknown"
        })) || undefined,
        topProcesses: reportData?.top_processes ? {
          top_cpu: reportData.top_processes.top_cpu || [],
          top_memory: reportData.top_processes.top_memory || []
        } : undefined,
        networkInfo: reportData?.system_info?.NetworkInfo ? {
          local_ip: reportData.system_info.NetworkInfo.local_ip || "Unknown",
          public_ip: reportData.system_info.NetworkInfo.public_ip || "Unknown",
          location: reportData.system_info.NetworkInfo.location || "Unknown",
          nic_details: reportData.system_info.NetworkInfo.nic_details || []
        } : undefined,
        windowsSecurity: reportData?.windows_security || undefined,
        installedApps: reportData?.installed_apps?.installed_apps || [],
        openPorts: reportData?.open_ports?.open_ports || []
      };

      setDetailedDevice(detailed);
    } catch (error) {
      console.error("Failed to fetch device details:", error);
      // Still set basic device info even if detailed data fails
      const baseDevice = devices.find(d => d.agentId === agentId);
      if (baseDevice) {
        setDetailedDevice(baseDevice as DetailedDevice);
      }
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeviceSelect = async (device: Device) => {
    console.log("Selected device:", device.hostname);
    setSelectedDevice(device);
    await fetchDeviceDetails(device.agentId);
  };

  const handleBackToList = () => {
    setSelectedDevice(null);
    setDetailedDevice(null);
  };

  const handleRefresh = () => {
    console.log('Refreshing system monitor data...');
    fetchDevices();
  };

  if (selectedDevice && detailedDevice) {
    return (
      <DeviceDetailView
        device={detailedDevice}
        onBack={handleBackToList}
        isLoading={isLoadingDetails}
      />
    );
  }

  return (
    <DeviceList
      devices={devices}
      onDeviceSelect={handleDeviceSelect}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    />
  );
}