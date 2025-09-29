
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Usb, AlertTriangle, Clock } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface DiskData {
  Device: string;
  Total: string;
  Used: string;
  Free: string;
  "Usage %": string;
  diskType?: 'system' | 'removable';
  usbContext?: {
    hasConnectedUsb: boolean;
    connectedDevices: number;
    likelyUsbDrive: boolean;
  };
}

interface EnhancedDiskResponse {
  agentId: string;
  diskInfo: DiskData[];
  reportSource: string;
  reportAge: number;
  usbSummary: {
    connectedDevices: number;
    totalUsbHistory: number;
  };
  lastUpdated: string;
}

interface DiskInfoProps {
  diskData?: DiskData[];
  agentId?: string;
}

export default function DiskInfo({ diskData, agentId }: DiskInfoProps) {
  // Use the new enhanced disk info endpoint if agentId is available
  const { data: enhancedDiskInfo, isLoading, error } = useQuery({
    queryKey: ['enhanced-disk-info', agentId],
    queryFn: async (): Promise<EnhancedDiskResponse> => {
      if (!agentId) throw new Error('No agent ID provided');
      const response = await fetch(`/api/agents/${agentId}/disk-info`);
      if (!response.ok) throw new Error('Failed to fetch disk information');
      return response.json();
    },
    enabled: !!agentId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getUsagePercentage = (usageStr: string) => {
    const percentage = parseFloat(usageStr.replace('%', ''));
    return isNaN(percentage) ? 0 : percentage;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "secondary";
    return "default";
  };

  const getDiskIcon = (disk: DiskData) => {
    if (disk.diskType === 'removable' && disk.usbContext?.likelyUsbDrive) {
      return <Usb className="w-4 h-4 text-blue-500" />;
    }
    return <HardDrive className="w-4 h-4 text-muted-foreground" />;
  };

  const getDiskBadge = (disk: DiskData) => {
    if (disk.diskType === 'removable') {
      if (disk.usbContext?.likelyUsbDrive) {
        return <Badge variant="outline" className="text-xs">USB Drive</Badge>;
      } else {
        return <Badge variant="secondary" className="text-xs">Removable</Badge>;
      }
    }
    return <Badge variant="default" className="text-xs">System</Badge>;
  };

  // Use enhanced data if available, otherwise fall back to provided diskData
  const currentDiskData = enhancedDiskInfo?.diskInfo || diskData || [];
  const isUsingEnhancedData = !!enhancedDiskInfo;

  if (isLoading && agentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Disk Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading disk information...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && agentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Disk Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm">Using cached data - unable to fetch latest disk information</p>
          </div>
          {diskData && diskData.length > 0 && (
            <div className="mt-4 space-y-4">
              {diskData.map((disk, index) => (
                <div key={index} className="space-y-2 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{disk.Device}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Cached</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {disk.Total} total • {disk.Used} used • {disk.Free} free
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!currentDiskData || currentDiskData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Disk Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No disk information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Disk Information
          {isUsingEnhancedData && enhancedDiskInfo.reportAge && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Clock className="w-3 h-3" />
              Updated {enhancedDiskInfo.reportAge}m ago
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isUsingEnhancedData && enhancedDiskInfo.usbSummary.connectedDevices > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Usb className="w-4 h-4" />
              <span className="text-sm font-medium">
                {enhancedDiskInfo.usbSummary.connectedDevices} USB device{enhancedDiskInfo.usbSummary.connectedDevices > 1 ? 's' : ''} connected
              </span>
            </div>
          </div>
        )}

        {currentDiskData.map((disk, index) => {
          const usagePercentage = getUsagePercentage(disk["Usage %"] || disk.usage || "0%");
          const deviceName = disk.Device || disk.device || disk.Mountpoint || `Drive ${index + 1}`;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDiskIcon(disk)}
                  <span className="font-medium">{deviceName}</span>
                  {getDiskBadge(disk)}
                </div>
                <Badge variant={getUsageColor(usagePercentage)}>
                  {disk["Usage %"] || disk.usage || "N/A"}
                </Badge>
              </div>
              
              <Progress value={usagePercentage} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-mono">{disk.Total || disk.total || "N/A"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Used:</span>
                  <div className="font-mono">{disk.Used || disk.used || "N/A"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Free:</span>
                  <div className="font-mono">{disk.Free || disk.free || disk.Available || "N/A"}</div>
                </div>
              </div>
              
              {disk.usbContext && (
                <div className="text-xs text-muted-foreground">
                  {disk.usbContext.likelyUsbDrive 
                    ? "This appears to be a USB storage device" 
                    : "Removable drive (no USB devices currently connected)"}
                </div>
              )}
            </div>
          );
        })}
        
        {isUsingEnhancedData && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Data from {enhancedDiskInfo.reportSource} • 
            {enhancedDiskInfo.usbSummary.totalUsbHistory > 0 && 
              ` ${enhancedDiskInfo.usbSummary.totalUsbHistory} USB connection records`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
