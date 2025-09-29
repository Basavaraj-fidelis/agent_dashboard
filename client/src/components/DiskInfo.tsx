
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface DiskData {
  Device: string;
  Total: string;
  Used: string;
  Free: string;
  "Usage %": string;
}

interface DiskInfoProps {
  diskData: DiskData[];
  agentId?: string;
}

export default function DiskInfo({ diskData, agentId }: DiskInfoProps) {
  // Get USB connection history to filter out disconnected USB drives
  const { data: usbHistory } = useQuery({
    queryKey: ['usb-history', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const response = await fetch(`/api/agents/${agentId}/usb-history`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!agentId,
    refetchInterval: 30000
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

  // Filter out USB drives that are currently disconnected
  const filterActiveDrives = (drives: DiskData[]) => {
    if (!usbHistory?.history || !Array.isArray(usbHistory.history)) {
      return drives; // If no USB history, show all drives
    }

    // Get currently connected USB drives
    const connectedUsbDrives = usbHistory.history
      .filter((record: any) => record.status === 'connected')
      .map((record: any) => record.deviceModel);

    // Filter out disconnected USB drives (typically drives E:, F:, etc.)
    return drives.filter(drive => {
      const deviceName = drive.Device || drive.device || drive.Mountpoint || '';
      
      // Always keep system drives (C:, typically)
      if (deviceName.startsWith('C:') || deviceName.startsWith('/')) {
        return true;
      }

      // For other drives (E:, F:, etc.), check if there's a connected USB device
      if (deviceName.match(/^[D-Z]:/i)) {
        return connectedUsbDrives.length > 0; // Show if any USB is connected
      }

      return true; // Keep other drives
    });
  };

  const filteredDiskData = filterActiveDrives(diskData || []);

  if (!filteredDiskData || filteredDiskData.length === 0) {
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredDiskData.map((disk, index) => {
          const usagePercentage = getUsagePercentage(disk["Usage %"] || disk.usage || "0%");
          const deviceName = disk.Device || disk.device || disk.Mountpoint || `Drive ${index + 1}`;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{deviceName}</span>
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
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
