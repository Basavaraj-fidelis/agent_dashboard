
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Usb, HardDrive } from "lucide-react";

interface UsbDevice {
  DeviceID: string;
  Model: string;
  SizeGB: string | number;
  Status: string;
}

interface UsbDevicesProps {
  usbDevices: UsbDevice[];
}

export default function UsbDevices({ usbDevices }: UsbDevicesProps) {
  const getStatusColor = (status?: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'ok':
      case 'ready':
        return "default";
      case 'warning':
        return "secondary";
      case 'error':
      case 'failed':
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!usbDevices || usbDevices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="w-5 h-5" />
            USB Storage Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No USB storage devices detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Usb className="w-5 h-5" />
          USB Storage Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usbDevices.map((device, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{device.Model || 'Unknown USB Device'}</p>
                <p className="text-xs text-muted-foreground">
                  {device.DeviceID} • {device.SizeGB ? `${device.SizeGB} GB` : 'Unknown size'}
                </p>
              </div>
            </div>
            <Badge variant={getStatusColor(device.Status)}>
              {device.Status || 'Unknown'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
