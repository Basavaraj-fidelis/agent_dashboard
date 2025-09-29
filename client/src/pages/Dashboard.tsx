
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Activity, Server, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface Device {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
}

interface DashboardStats {
  total: number;
  online: number;
  offline: number;
  warning: number;
  locations: string[];
  osTypes: { [key: string]: number };
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    online: 0,
    offline: 0,
    warning: 0,
    locations: [],
    osTypes: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Device[] = await response.json();
        setDevices(data);
        
        // Calculate statistics
        const newStats: DashboardStats = {
          total: data.length,
          online: data.filter(d => d.status === 'online').length,
          offline: data.filter(d => d.status === 'offline').length,
          warning: data.filter(d => d.status === 'warning').length,
          locations: [...new Set(data.map(d => d.location))],
          osTypes: data.reduce((acc, device) => {
            const osType = device.os.includes('Windows') ? 'Windows' : device.os.split(' ')[0];
            acc[osType] = (acc[osType] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number })
        };
        setStats(newStats);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const recentAlerts = devices
    .filter(d => d.status === 'offline' || d.status === 'warning')
    .slice(0, 5);

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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor your infrastructure at a glance</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.locations.length} locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
            <p className="text-xs text-muted-foreground">
              Need investigation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Systems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Operating Systems
            </CardTitle>
            <CardDescription>Distribution across your fleet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.osTypes).map(([os, count]) => (
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
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
            <CardDescription>Devices requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts - all systems running smoothly!</p>
            ) : (
              recentAlerts.map((device) => (
                <div key={device.agentId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{device.hostname}</p>
                      <p className="text-xs text-muted-foreground">{device.location}</p>
                    </div>
                  </div>
                  <Badge variant={device.status === 'offline' ? 'destructive' : 'secondary'}>
                    {device.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Locations Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Global Distribution</CardTitle>
          <CardDescription>Agents across different locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.locations.map((location) => {
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
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
