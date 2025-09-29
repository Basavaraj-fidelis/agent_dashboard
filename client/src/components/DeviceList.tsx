import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DeviceCard from "./DeviceCard";
import StatusIndicator from "./StatusIndicator";
import { Search, Filter, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface Device {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
}

interface DeviceListProps {
  devices: Device[];
  onDeviceSelect?: (device: Device) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function DeviceList({ 
  devices, 
  onDeviceSelect, 
  onRefresh,
  isLoading = false 
}: DeviceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline" | "warning">("all");

  const stats = useMemo(() => {
    const online = devices.filter(d => d.status === "online").length;
    const offline = devices.filter(d => d.status === "offline").length;
    const warning = devices.filter(d => d.status === "warning").length;
    return { online, offline, warning, total: devices.length };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = searchQuery === "" || 
        device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || device.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [devices, searchQuery, statusFilter]);

  return (
    <div className="space-y-6" data-testid="device-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage Windows endpoints</p>
        </div>
        <Button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="gap-2"
          data-testid="button-refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <StatusIndicator status="online" size="lg" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <StatusIndicator status="warning" size="lg" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
                <p className="text-sm text-muted-foreground">Warning</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <StatusIndicator status="offline" size="lg" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-primary rounded-full" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Devices
              <Badge variant="outline">
                {filteredDevices.length} of {devices.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by hostname, agent ID, location, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-devices"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-input bg-background rounded-md min-w-[120px]"
              data-testid="select-status-filter"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Device Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.agentId}
                  {...device}
                  onClick={() => {
                    console.log(`Selected device: ${device.hostname}`);
                    onDeviceSelect?.(device);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No devices found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "No devices are currently registered"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}