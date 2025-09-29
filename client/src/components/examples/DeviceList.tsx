import DeviceList from '../DeviceList';

export default function DeviceListExample() {
  //todo: remove mock functionality
  const mockDevices = [
    {
      agentId: "AGENT005",
      hostname: "DESKTOP-CMM8H3C",
      os: "Windows 11 Home Single Language",
      location: "Bengaluru - Karnataka - India",
      username: "basav",
      lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
      status: "online" as const
    },
    {
      agentId: "AGENT003", 
      hostname: "WORKSTATION-01",
      os: "Windows 11 Pro",
      location: "New York - NY - USA",
      username: "john.doe",
      lastHeartbeat: new Date(Date.now() - 1800000).toISOString(),
      status: "warning" as const
    },
    {
      agentId: "AGENT001",
      hostname: "LAPTOP-DEV",
      os: "Windows 10 Enterprise",
      location: "London - England - UK", 
      username: "jane.smith",
      lastHeartbeat: new Date(Date.now() - 7200000).toISOString(),
      status: "offline" as const
    },
    {
      agentId: "AGENT007",
      hostname: "SERVER-PROD-01",
      os: "Windows Server 2022",
      location: "Tokyo - Tokyo - Japan",
      username: "admin.server",
      lastHeartbeat: new Date(Date.now() - 60000).toISOString(),
      status: "online" as const
    },
    {
      agentId: "AGENT002",
      hostname: "DEV-MACHINE",
      os: "Windows 11 Pro",
      location: "San Francisco - CA - USA",
      username: "dev.user",
      lastHeartbeat: new Date(Date.now() - 3600000).toISOString(), 
      status: "warning" as const
    },
    {
      agentId: "AGENT004",
      hostname: "QA-TESTING",
      os: "Windows 10 Pro",
      location: "Berlin - Berlin - Germany",
      username: "qa.tester",
      lastHeartbeat: new Date(Date.now() - 10800000).toISOString(),
      status: "offline" as const
    }
  ];

  return (
    <div className="p-6">
      <DeviceList 
        devices={mockDevices}
        onDeviceSelect={(device) => console.log('Selected:', device.hostname)}
        onRefresh={() => console.log('Refreshing devices...')}
        isLoading={false}
      />
    </div>
  );
}