import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StatusIndicator from "./StatusIndicator";
import ProcessTable from "./ProcessTable";
import SecurityOverview from "./SecurityOverview";
import NetworkInfo from "./NetworkInfo";
import InstalledApps from "./InstalledApps";
import DiskInfo from "./DiskInfo"; // Assuming DiskInfo component exists
import { ArrowLeft, Monitor, Cpu, HardDrive, MemoryStick, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { useQuery } from '@tanstack/react-query';

interface DeviceData {
  // Basic device info
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";

  // System info
  systemInfo?: {
    cpu: string;
    ram: string;
    graphics: string;
    totalDisk: string;
  };

  // Disk info
  diskInfo?: Array<{
    Device: string;
    Total: string;
    Used: string;
    Free: string;
    "Usage %": string;
  }>;

  // Process data
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

  // Network data
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

  // Security data
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

  // Installed apps
  installedApps?: Array<{
    name: string;
    version: string;
    publisher: string;
    install_location: string;
  }>;

  // Open ports (optional)
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

interface DeviceDetailViewProps {
  device: DeviceData;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function DeviceDetailView({ device, onBack, isLoading }: DeviceDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const last = new Date(timestamp);
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const { data: reportData, error: reportError, isLoading: isLoadingReport } = useQuery({
    queryKey: ["agent-report", device.agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${device.agentId}/latest-report`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const data = await response.json();
      console.log('[DEBUG] Frontend received report data:', data);
      console.log('[DEBUG] Report data keys:', Object.keys(data || {}));
      return data;
    },
    enabled: !!device.agentId,
    retry: 1,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Extract system information from the report data with comprehensive fallbacks
  const extractData = (reportData: any, ...paths: string[]) => {
    for (const path of paths) {
      const keys = path.split('.');
      let current = reportData;
      let found = true;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          found = false;
          break;
        }
      }

      if (found && current !== undefined && current !== null) {
        return current;
      }
    }
    return null;
  };

  const systemInfo = extractData(reportData, 'system_info.SystemInfo', 'SystemInfo', 'system_info');
  const diskInfo = extractData(reportData, 'system_info.DiskInfo', 'DiskInfo', 'disk_info', 'diskInfo');
  const topProcesses = extractData(reportData, 'top_processes', 'TopProcesses', 'topProcesses');
  const networkInfo = extractData(reportData, 'system_info.NetworkInfo', 'NetworkInfo', 'network_info', 'networkInfo');
  const windowsSecurity = extractData(reportData, 'windows_security', 'WindowsSecurity', 'windowsSecurity');
  const installedApps = extractData(reportData, 'installed_apps.installed_apps', 'installed_apps', 'InstalledApps', 'installedApps');

  console.log('[DEBUG] Extracted data:', {
    systemInfo: !!systemInfo,
    diskInfo: !!diskInfo,
    topProcesses: !!topProcesses,
    networkInfo: !!networkInfo,
    windowsSecurity: !!windowsSecurity,
    installedApps: !!installedApps
  });


  return (
    <div className="space-y-6" data-testid={`device-detail-${device.hostname}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{device.hostname}</h1>
              <StatusIndicator status={device.status} size="lg" showLabel />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{device.agentId}</span>
              <span>•</span>
              <span>{device.os}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Last seen: {getTimeSince(device.lastHeartbeat)}</span>
              </div>
            </div>
          </div>
        </div>
        <Badge variant={device.status === "online" ? "default" : "secondary"} className="text-sm">
          {device.status === "online" ? "Active" : device.status === "warning" ? "Issues Detected" : "Offline"}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="font-semibold text-sm">{systemInfo?.cpu.split('(')[0].trim() || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MemoryStick className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">RAM</p>
                <p className="font-semibold text-sm">{systemInfo?.ram || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="font-semibold text-sm">{systemInfo?.totalDisk || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold text-sm">{device.location.split(' - ')[0] || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="processes" data-testid="tab-processes">Processes</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="network" data-testid="tab-network">Network</TabsTrigger>
          <TabsTrigger value="applications" data-testid="tab-applications">Apps</TabsTrigger>
          <TabsTrigger value="storage" data-testid="tab-storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading || isLoadingReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="col-span-2 h-4 bg-muted rounded"></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            </div>
          ) : reportError ? (
            <div className="text-center text-red-500 p-8">Failed to load device report.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {systemInfo ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">CPU:</span>
                          <span className="col-span-2">{systemInfo.cpu}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">RAM:</span>
                          <span className="col-span-2">{systemInfo.ram}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">Graphics:</span>
                          <span className="col-span-2">{systemInfo.graphics}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">Total Disk:</span>
                          <span className="col-span-2">{systemInfo.totalDisk || systemInfo.total_disk || 'N/A'}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">System information not available</p>
                    )}
                  </CardContent>
                </Card>

                <DiskInfo diskData={diskInfo || []} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ProcessTable
                  processes={topProcesses?.top_cpu || []}
                  title="Top CPU Processes"
                  type="cpu"
                  systemUsage={{ cpu: 15.4, memory: 65.2 }}
                />
                <ProcessTable
                  processes={topProcesses?.top_memory || []}
                  title="Top Memory Processes"
                  type="memory"
                  systemUsage={{ memory: 65.2, totalRam: systemInfo?.ram || "Unknown" }}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="processes" className="space-y-6">
          {isLoading || isLoadingReport ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="animate-pulse h-96">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-full bg-muted rounded"></div>
                </CardContent>
              </Card>
              <Card className="animate-pulse h-96">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-full bg-muted rounded"></div>
                </CardContent>
              </Card>
            </div>
          ) : reportError ? (
            <div className="text-center text-red-500 p-8">Failed to load device report.</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ProcessTable
                processes={topProcesses?.top_cpu.slice(0, 10) || []}
                title="Top CPU Processes"
                type="cpu"
                systemUsage={{ cpu: 15.4, memory: 65.2 }}
              />
              <ProcessTable
                processes={topProcesses?.top_memory.slice(0, 10) || []}
                title="Top Memory Processes"
                type="memory"
                systemUsage={{ memory: 65.2 }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {isLoading || isLoadingReport ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ) : reportError ? (
            <div className="text-center text-red-500 p-8">Failed to load device report.</div>
          ) : (
            <SecurityOverview
              windowsDefender={windowsSecurity?.windows_defender}
              firewall={windowsSecurity?.firewall || []}
              uacStatus={windowsSecurity?.uac_status}
              installedAv={windowsSecurity?.installed_av || []}
              restartPending={windowsSecurity?.restart_pending}
              recentPatches={windowsSecurity?.recent_patches || []}
            />
          )}
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          {isLoading || isLoadingReport ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ) : reportError ? (
            <div className="text-center text-red-500 p-8">Failed to load device report.</div>
          ) : (
            <NetworkInfo
              localIp={networkInfo?.local_ip || device.systemInfo?.localIp || "N/A"}
              publicIp={networkInfo?.public_ip || device.systemInfo?.publicIp || "N/A"}
              location={networkInfo?.location || device.location || "N/A"}
              nicDetails={Array.isArray(networkInfo?.nic_details) ? networkInfo.nic_details : []}
              openPorts={device.openPorts || []}
            />
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {isLoading || isLoadingReport ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : reportError ? (
            <div className="text-center text-red-500 p-8">Failed to load device report.</div>
          ) : (
            <InstalledApps apps={Array.isArray(installedApps) ? installedApps : []} />
          )}
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          {isLoading || isLoadingReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(2)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-5 bg-muted rounded w-1/3"></div>
                      <div className="h-6 w-16 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reportError ? (
            <div className="text-center text-red-500 p-8">Failed to load device report.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(diskInfo || []).map((disk, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{disk.Device}</h4>
                      <Badge variant="outline">{disk["Usage %"]}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span>{disk.Total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Used:</span>
                        <span>{disk.Used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free:</span>
                        <span>{disk.Free}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}