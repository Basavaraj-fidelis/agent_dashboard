import DeviceList from "@/components/DeviceList";
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

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/agents'); // Assuming your API endpoint is /api/agents
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Device[] = await response.json();
        setDevices(data);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
        // Handle error appropriately, maybe set an error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleRefresh = () => {
    console.log('Refreshing device data...');
    setIsLoading(true); // Set loading to true on refresh
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/agents'); // Assuming your API endpoint is /api/agents
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Device[] = await response.json();
        setDevices(data);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();
  };

  return (
    <DeviceList
      devices={devices}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    />
  );
}