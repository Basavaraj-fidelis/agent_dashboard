import InstalledApps from '../InstalledApps';

export default function InstalledAppsExample() {
  //todo: remove mock functionality
  const mockApps = [
    {
      name: "Google Chrome",
      version: "140.0.7339.208",
      publisher: "Google LLC",
      install_location: "Unknown"
    },
    {
      name: "Cursor 0.45.14",
      version: "0.45.14",
      publisher: "Cursor AI, Inc.",
      install_location: "Unknown"
    },
    {
      name: "Docker Desktop",
      version: "4.38.0",
      publisher: "Docker Inc.",
      install_location: "C:\\Program Files\\Docker\\Docker"
    },
    {
      name: "PostgreSQL 17",
      version: "17.5-2",
      publisher: "PostgreSQL Global Development Group",
      install_location: "C:\\Program Files\\PostgreSQL\\17"
    },
    {
      name: "VLC media player",
      version: "3.0.16",
      publisher: "VideoLAN",
      install_location: "C:\\Program Files\\VideoLAN\\VLC"
    },
    {
      name: "7-Zip 23.01 (x64)",
      version: "23.01",
      publisher: "Igor Pavlov",
      install_location: "C:\\Program Files\\7-Zip\\"
    },
    {
      name: "Node.js",
      version: "22.12.0",
      publisher: "Node.js Foundation",
      install_location: "Unknown"
    },
    {
      name: "Git",
      version: "2.44.0",
      publisher: "The Git Development Community",
      install_location: "C:\\Program Files\\Git\\"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Installed Applications</h3>
      <InstalledApps apps={mockApps} />
    </div>
  );
}