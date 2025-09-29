import SecurityOverview from '../SecurityOverview';

export default function SecurityOverviewExample() {
  //todo: remove mock functionality
  const mockSecurityData = {
    windowsDefender: {
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
    uacStatus: "Enabled",
    installedAv: [
      { name: "Windows Defender", state: "Enabled" }
    ],
    restartPending: false,
    recentPatches: [
      { hotfix_id: "KB5034441", installed_on: "2024-01-15T10:30:00Z" },
      { hotfix_id: "KB5034123", installed_on: "2024-01-10T14:20:00Z" },
      { hotfix_id: "KB5033375", installed_on: "2024-01-05T09:15:00Z" },
      { hotfix_id: "KB5032906", installed_on: "2023-12-28T16:45:00Z" }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Security Overview</h3>
      <SecurityOverview {...mockSecurityData} />
    </div>
  );
}