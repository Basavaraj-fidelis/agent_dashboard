import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Wifi, Network, MapPin, Shield, AlertTriangle } from "lucide-react";

interface NicDetail {
  Description: string;
  MAC: string;
  ConnectionType: string;
  "IP Addresses": string;
}

interface OpenPort {
  ip: string;
  local_port: number;
  process_name: string;
  protocol: string;
  service: string;
  critical: boolean;
  recommendation: string;
}

interface NetworkInfoProps {
  localIp: string;
  publicIp: string;
  location: string;
  nicDetails: NicDetail[];
  openPorts?: OpenPort[];
}

export default function NetworkInfo({
  localIp,
  publicIp,
  location,
  nicDetails,
  openPorts = []
}: NetworkInfoProps) {
  const criticalPorts = openPorts.filter(port => port.critical);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            IP Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Local IP</span>
              <span className="font-mono text-sm" data-testid="text-local-ip">{localIp}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Public IP</span>
              <span className="font-mono text-sm" data-testid="text-public-ip">{publicIp}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-card-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-location">{location}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Network Adapters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {nicDetails.map((nic, index) => (
            <div key={index} className="space-y-2 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                {nic.ConnectionType === "Wi-Fi" ? 
                  <Wifi className="w-4 h-4" /> : 
                  <Network className="w-4 h-4" />
                }
                <span className="font-medium text-sm truncate" title={nic.Description}>
                  {nic.Description.length > 25 ? 
                    `${nic.Description.substring(0, 25)}...` : 
                    nic.Description
                  }
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>MAC: <span className="font-mono">{nic.MAC}</span></div>
                <div>IPs: <span className="font-mono">{nic["IP Addresses"]}</span></div>
              </div>
              <Badge variant="outline" className="text-xs">
                {nic.ConnectionType}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {criticalPorts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Critical Ports
              <Badge variant="destructive" className="ml-2">
                {criticalPorts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalPorts.slice(0, 5).map((port, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-orange-200 dark:border-orange-800 rounded">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="font-mono text-sm" data-testid={`text-port-${port.local_port}`}>
                      {port.local_port}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {port.service}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{port.process_name}</div>
                  <Badge variant="outline" className="text-xs">
                    {port.protocol}
                  </Badge>
                </div>
              </div>
            ))}
            {criticalPorts.length > 5 && (
              <div className="text-center pt-2">
                <Badge variant="secondary" className="text-xs">
                  +{criticalPorts.length - 5} more ports
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}