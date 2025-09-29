import DeviceList from "@/components/DeviceList";

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



  const handleRefresh = () => {
    console.log('Refreshing device data...');
    // In real app, this would fetch fresh data from the API
  };

  return (
    <DeviceList 
      devices={mockDevices}
      onRefresh={handleRefresh}
    />
  );
}