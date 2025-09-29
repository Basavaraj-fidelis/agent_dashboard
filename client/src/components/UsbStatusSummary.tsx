
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemoryStick, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface UsbStatusSummaryProps {
  agentId: string;
}

export default function UsbStatusSummary({ agentId }: UsbStatusSummaryProps) {
  const { data: usbHistory, isLoading } = useQuery({
    queryKey: ['usb-status', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/usb-history`);
      if (!response.ok) throw new Error('Failed to fetch USB status');
      return response.json();
    },
    enabled: !!agentId,
    refetchInterval: 30000
  });

  const getUsbStatus = () => {
    if (!usbHistory?.history || usbHistory.history.length === 0) {
      return { status: 'none', message: 'No USB devices detected', count: 0 };
    }

    const connectedDevices = usbHistory.history.filter((record: any) => record.status === 'connected');
    
    if (connectedDevices.length > 0) {
      return { 
        status: 'connected', 
        message: `${connectedDevices.length} USB device${connectedDevices.length > 1 ? 's' : ''} connected`,
        count: connectedDevices.length,
        latestDevice: connectedDevices[0]?.deviceModel
      };
    }

    return { status: 'disconnected', message: 'No USB devices currently connected', count: 0 };
  };

  const usbStatus = getUsbStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MemoryStick className="w-5 h-5" />
          USB Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {usbStatus.status === 'connected' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium">{usbStatus.message}</p>
              {usbStatus.latestDevice && (
                <p className="text-xs text-muted-foreground">{usbStatus.latestDevice}</p>
              )}
            </div>
          </div>
          <Badge variant={usbStatus.status === 'connected' ? "default" : "secondary"}>
            {usbStatus.status === 'connected' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          View detailed connection history in the History tab
        </div>
      </CardContent>
    </Card>
  );
}
