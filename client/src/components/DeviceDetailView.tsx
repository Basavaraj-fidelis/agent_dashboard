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
                <p className="font-semibold text-sm">{device.systemInfo?.cpu.split('(')[0].trim() || 'N/A'}</p>
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
                <p className="font-semibold text-sm">{device.systemInfo?.ram || 'N/A'}</p>
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
                <p className="font-semibold text-sm">{device.systemInfo?.totalDisk || 'N/A'}</p>
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
          {isLoading ? (
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
                    {device.systemInfo ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">CPU:</span>
                          <span className="col-span-2">{device.systemInfo.cpu}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">RAM:</span>
                          <span className="col-span-2">{device.systemInfo.ram}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">Graphics:</span>
                          <span className="col-span-2">{device.systemInfo.graphics}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="font-medium">Total Disk:</span>
                          <span className="col-span-2">{device.systemInfo.totalDisk}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">System information not available</p>
                    )}
                  </CardContent>
                </Card>

                <DiskInfo diskData={device.diskInfo || []} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ProcessTable 
                  processes={device.topProcesses?.top_cpu || []} 
                  title="Top CPU Processes" 
                  type="cpu"
                  systemUsage={{ cpu: 15.4, memory: 65.2 }}
                />
                <ProcessTable 
                  processes={device.topProcesses?.top_memory || []} 
                  title="Top Memory Processes" 
                  type="memory"
                  systemUsage={{ memory: 65.2, totalRam: device.systemInfo?.ram || "Unknown" }}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="processes" className="space-y-6">
          {isLoading ? (
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
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ProcessTable
                processes={device.topProcesses?.top_cpu.slice(0, 10) || []}
                title="Top CPU Processes"
                type="cpu"
                systemUsage={{ cpu: 15.4, memory: 65.2 }}
              />
              <ProcessTable
                processes={device.topProcesses?.top_memory.slice(0, 10) || []}
                title="Top Memory Processes"
                type="memory"
                systemUsage={{ memory: 65.2 }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {isLoading ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ) : (
            <SecurityOverview
              windowsDefender={device.windowsSecurity?.windows_defender}
              firewall={device.windowsSecurity?.firewall || []}
              uacStatus={device.windowsSecurity?.uac_status}
              installedAv={device.windowsSecurity?.installed_av || []}
              restartPending={device.windowsSecurity?.restart_pending}
              recentPatches={device.windowsSecurity?.recent_patches || []}
            />
          )}
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          {isLoading ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ) : (
            <NetworkInfo
              localIp={device.networkInfo?.local_ip}
              publicIp={device.networkInfo?.public_ip}
              location={device.networkInfo?.location}
              nicDetails={device.networkInfo?.nic_details || []}
              openPorts={device.openPorts || []}
            />
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {isLoading ? (
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
          ) : (
            <InstalledApps apps={device.installedApps || []} />
          )}
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          {isLoading ? (
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(device.diskInfo || []).map((disk, index) => (
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