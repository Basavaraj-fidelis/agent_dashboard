import DeviceCard from '../DeviceCard';

export default function DeviceCardExample() {
  //todo: remove mock functionality
  const mockDevices = [
    {
      agentId: "AGENT005",
      hostname: "DESKTOP-CMM8H3C",
      os: "Windows 11 Home Single Language",
      location: "Bengaluru - Karnataka - India",
      username: "basav",
      lastHeartbeat: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
      status: "online" as const
    },
    {
      agentId: "AGENT003",
      hostname: "WORKSTATION-01",
      os: "Windows 11 Pro",
      location: "New York - NY - USA",
      username: "john.doe",
      lastHeartbeat: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
      status: "warning" as const
    },
    {
      agentId: "AGENT001",
      hostname: "LAPTOP-DEV",
      os: "Windows 10 Enterprise",
      location: "London - England - UK",
      username: "jane.smith",
      lastHeartbeat: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      status: "offline" as const
    }
  ];

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Device Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockDevices.map((device) => (
          <DeviceCard
            key={device.agentId}
            {...device}
            onClick={() => console.log(`Selected device: ${device.hostname}`)}
          />
        ))}
      </div>
    </div>
  );
}