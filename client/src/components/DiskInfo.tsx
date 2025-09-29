
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

interface DiskData {
  Device: string;
  Total: string;
  Used: string;
  Free: string;
  "Usage %": string;
}

interface DiskInfoProps {
  diskData: DiskData[];
}

export default function DiskInfo({ diskData }: DiskInfoProps) {
  const getUsagePercentage = (usageStr: string) => {
    const percentage = parseFloat(usageStr.replace('%', ''));
    return isNaN(percentage) ? 0 : percentage;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "secondary";
    return "default";
  };

  if (!diskData || diskData.length === 0) {
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
        {diskData.map((disk, index) => {
          const usagePercentage = getUsagePercentage(disk["Usage %"]);
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{disk.Device}</span>
                </div>
                <Badge variant={getUsageColor(usagePercentage)}>
                  {disk["Usage %"]}
                </Badge>
              </div>
              
              <Progress value={usagePercentage} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <div className="font-mono">{disk.Total}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Used:</span>
                  <div className="font-mono">{disk.Used}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Free:</span>
                  <div className="font-mono">{disk.Free}</div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
