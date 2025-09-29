
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Usb, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface UsbHistoryRecord {
  id: string;
  deviceId: string;
  deviceModel: string;
  sizeGb: string | null;
  status: 'connected' | 'disconnected';
  connectedAt: string;
  disconnectedAt: string | null;
  duration: string;
}

interface UsbHistoryResponse {
  agentId: string;
  history: UsbHistoryRecord[];
  totalRecords: number;
}

interface UsbDevicesProps {
  agentId: string;
}

export default function UsbDevices({ agentId }: UsbDevicesProps) {
  const { data: usbHistory, isLoading, error } = useQuery({
    queryKey: ['usb-history', agentId],
    queryFn: async (): Promise<UsbHistoryResponse> => {
      const response = await fetch(`/api/agents/${agentId}/usb-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch USB history');
      }
      return response.json();
    },
    enabled: !!agentId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return "default";
      case 'disconnected':
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (duration: string) => {
    // If it's already formatted from the server, return as is
    if (duration.includes('minutes') || duration === 'Still connected') {
      return duration;
    }
    
    // Try to parse as number (minutes)
    const minutes = parseInt(duration);
    if (!isNaN(minutes)) {
      if (minutes < 60) {
        return `${minutes} minutes`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      }
    }
    
    return duration;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="w-5 h-5" />
            USB Devices (History)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading USB connection history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="w-5 h-5" />
            USB Devices (History)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">Failed to load USB connection history</p>
        </CardContent>
      </Card>
    );
  }

  if (!usbHistory?.history || usbHistory.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="w-5 h-5" />
            USB Devices (History)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No USB connection history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Usb className="w-5 h-5" />
          USB Devices (History)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Device</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Connected At</th>
                <th className="text-left py-2 px-3">Disconnected At</th>
                <th className="text-left py-2 px-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {usbHistory.history.map((record) => (
                <tr key={record.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3">
                    <div>
                      <p className="font-medium">{record.deviceModel}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.sizeGb ? `${record.sizeGb} GB` : 'Unknown size'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <Badge variant={getStatusColor(record.status)}>
                        {record.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs">
                      {formatDateTime(record.connectedAt)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs">
                      {record.disconnectedAt 
                        ? formatDateTime(record.disconnectedAt)
                        : (record.status === 'connected' 
                            ? <span className="text-muted-foreground italic">Still connected</span>
                            : <span className="text-muted-foreground italic">-</span>
                          )
                      }
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs">
                      {formatDuration(record.duration)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Total records: {usbHistory.totalRecords}
        </div>
      </CardContent>
    </Card>
  );
}
