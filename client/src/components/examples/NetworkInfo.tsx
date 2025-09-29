import NetworkInfo from '../NetworkInfo';

export default function NetworkInfoExample() {
  //todo: remove mock functionality
  const mockNetworkData = {
    localIp: "192.168.1.80",
    publicIp: "139.167.219.110", 
    location: "Bengaluru - Karnataka - India",
    nicDetails: [
      {
        Description: "Realtek Gaming GbE Family Controller",
        MAC: "84:69:93:6F:43:04",
        ConnectionType: "LAN",
        "IP Addresses": "192.168.1.80, fe80::ba77:9754:bc7:6e3b"
      },
      {
        Description: "Intel(R) Wi-Fi 6 AX201 160MHz",
        MAC: "A4:BB:6D:7E:1F:2C",
        ConnectionType: "Wi-Fi",
        "IP Addresses": "192.168.1.100"
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
      },
      {
        ip: "0.0.0.0",
        local_port: 135,
        process_name: "svchost.exe",
        protocol: "TCP",
        service: "RPC",
        critical: true,
        recommendation: "Check / Restrict Access"
      },
      {
        ip: "127.0.0.1",
        local_port: 5432,
        process_name: "postgres.exe",
        protocol: "TCP",
        service: "PostgreSQL",
        critical: true,
        recommendation: "Check / Restrict Access"
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Network Information</h3>
      <NetworkInfo {...mockNetworkData} />
    </div>
  );
}