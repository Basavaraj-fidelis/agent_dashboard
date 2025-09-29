import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StatusIndicator from "@/components/StatusIndicator";
import { Activity, AlertTriangle, CheckCircle, XCircle, Users, Monitor, AlertOctagon, Wifi, HardDrive, Shield } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface Device {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
  networkInfo?: {
    local_ip?: string;
  };
  usbDevices?: {
    name: string;
    status: string;
  }[];
}

interface DashboardStats {
  total: number;
  online: number;
  offline: number;
  warning: number;
  locations: string[];
  osTypes: { [key: string]: number };
}

// Placeholder for the DiskInfo component, assuming it will be created elsewhere.
// This is a minimal placeholder to resolve the import error.
const DiskInfo = () => {
  return <div className="text-sm text-muted-foreground">Disk Info Placeholder</div>;
};

export default function Dashboard() {
  // Fetch real agent data
  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await fetch("/api/agents");
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      return response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Calculate stats from real data
  const stats: DashboardStats = {
    total: devices.length,
    online: devices.filter((device: Device) => device.status === "online").length,
    offline: devices.filter((device: Device) => device.status === "offline").length,
    warning: devices.filter((device: Device) => device.status === "warning").length,
    locations: [...new Set(devices.map(d => d.location))],
    osTypes: devices.reduce((acc, device) => {
      const osType = device.os.includes('Windows') ? 'Windows' : device.os.split(' ')[0];
      acc[osType] = (acc[osType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number })
  };

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

  // Get recent devices (last 5) for the activity feed
  const recentDevices = devices.slice(0, 5).map((device: Device) => ({
    hostname: device.hostname,
    status: device.status,
    lastSeen: getTimeSince(device.lastHeartbeat),
    os: device.os
  }));

  const getUptime = () => {
    if (stats.total === 0) return '0%';
    const uptimePercentage = ((stats.online / stats.total) * 100).toFixed(1);
    return `${uptimePercentage}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Placeholder for other sections while loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle><div className="h-6 w-48 bg-muted rounded"></div></CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex items-center justify-between p-3 border rounded-lg"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-muted rounded-full"></div><div className="space-y-1"><div className="h-4 w-32 bg-muted rounded"></div><div className="h-3 w-24 bg-muted rounded"></div></div></div><div className="h-6 w-16 bg-muted rounded"></div></div></div></CardContent></Card>
          <Card><CardHeader><CardTitle><div className="h-6 w-48 bg-muted rounded"></div></CardTitle></CardHeader><CardContent><div className="space-y-4"><div className="h-8 bg-muted rounded w-full mb-2"></div><div className="h-8 bg-muted rounded w-full mb-2"></div><div className="h-8 bg-muted rounded w-full"></div></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle><div className="h-6 w-32 bg-muted rounded mb-2"></div><div className="h-3 w-48 bg-muted rounded"></div></CardTitle></CardHeader><CardContent><div className="space-y-4"><div className="h-8 bg-muted rounded w-full"></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle><div className="h-6 w-32 bg-muted rounded mb-2"></div><div className="h-3 w-48 bg-muted rounded"></div></CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-4"><div className="h-12 bg-muted rounded w-full"></div><div className="h-12 bg-muted rounded w-full"></div><div className="h-12 bg-muted rounded w-full"></div></div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg"></div>
        <div className="relative p-6">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            IT Infrastructure Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Real-time monitoring and insights across your entire IT environment
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Uptime
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : `${getUptime()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${stats.online} of ${stats.total} systems online`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Devices
            </CardTitle>
            <Monitor className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : stats.online}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently connected and reporting
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Warnings
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isLoading ? "..." : stats.warning}
            </div>
            <p className="text-xs text-muted-foreground">
              Systems requiring attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offline
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? "..." : stats.offline}
            </div>
            <p className="text-xs text-muted-foreground">
              Systems not responding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Device Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Device Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Device Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-48"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded"></div>
                  </div>
                ))
              ) : devices.length > 0 ? (
                devices.slice(0, 3).map((device: Device) => (
                  <div key={device.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={device.status} />
                      <div>
                        <p className="font-medium">{device.hostname}</p>
                        <p className="text-sm text-muted-foreground">{device.os}</p>
                      </div>
                    </div>
                    <Badge variant={device.status === "online" ? "default" : device.status === "warning" ? "secondary" : "destructive"}>
                      {device.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No agents connected</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Health Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Healthy Systems</span>
                </div>
                <span className="text-green-600 font-bold">{isLoading ? "..." : stats.online}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Needs Attention</span>
                </div>
                <span className="text-yellow-600 font-bold">{isLoading ? "..." : stats.warning}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Critical Issues</span>
                </div>
                <span className="text-red-600 font-bold">{isLoading ? "..." : stats.offline}</span>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* USB Devices Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            USB Devices
          </CardTitle>
          <CardDescription>Status of USB devices across agents</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-muted rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : devices.length > 0 ? (
            <div className="space-y-4">
              {devices.flatMap(device => device.usbDevices ? device.usbDevices.map(usb => ({ ...usb, hostname: device.hostname })) : []).slice(0, 5).map((usb, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      usb.status === 'connected' ? 'bg-green-500' :
                      usb.status === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{usb.name}</p>
                      <p className="text-xs text-muted-foreground">{usb.hostname}</p>
                    </div>
                  </div>
                  <Badge variant={usb.status === "connected" ? "default" : usb.status === "warning" ? "secondary" : "destructive"}>
                    {usb.status}
                  </Badge>
                </div>
              ))}
              {/* Add a message if no USB devices are found */}
              {devices.flatMap(device => device.usbDevices || []).length === 0 && (
                 <p className="text-muted-foreground text-center py-4">No USB devices detected</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No agents connected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating Systems Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Operating Systems
          </CardTitle>
          <CardDescription>Distribution across your fleet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ) : Object.entries(stats.osTypes).length === 0 && stats.total === 0 ? (
            <p className="text-sm text-muted-foreground">No OS data available.</p>
          ) : (
            Object.entries(stats.osTypes).map(([os, count]) => (
              <div key={os} className="flex items-center justify-between">
                <span className="font-medium">{os}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Locations Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Global Distribution</CardTitle>
          <CardDescription>Agents across different locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full py-8 text-center">
                <p className="text-muted-foreground">Loading locations...</p>
              </div>
            ) : stats.locations.length === 0 && stats.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 col-span-full">No location data available.</p>
            ) : (
              stats.locations.map((location) => {
                const locationDevices = devices.filter(d => d.location === location);
                const locationStats = {
                  total: locationDevices.length,
                  online: locationDevices.filter(d => d.status === 'online').length,
                  offline: locationDevices.filter(d => d.status === 'offline').length,
                  warning: locationDevices.filter(d => d.status === 'warning').length
                };

                return (
                  <div key={location} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{location}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total: {locationStats.total}</span>
                      </div>
                      <div className="flex gap-1">
                        {locationStats.online > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs">{locationStats.online}</span>
                          </div>
                        )}
                        {locationStats.warning > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs">{locationStats.warning}</span>
                          </div>
                        )}
                        {locationStats.offline > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs">{locationStats.offline}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}