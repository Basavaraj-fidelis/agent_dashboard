import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusIndicator from "./StatusIndicator";
import { cn } from "@/lib/utils";
import { Monitor, MapPin, User, Clock } from "lucide-react";

interface DeviceCardProps {
  agentId: string;
  hostname: string;
  os: string;
  location: string;
  username: string;
  lastHeartbeat: string;
  status: "online" | "offline" | "warning";
  onClick?: () => void;
  className?: string;
}

export default function DeviceCard({
  agentId,
  hostname,
  os,
  location,
  username,
  lastHeartbeat,
  status,
  onClick,
  className
}: DeviceCardProps) {
  // Calculate time since last heartbeat
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

  return (
    <Card 
      className={cn(
        "hover-elevate cursor-pointer transition-all duration-200 border-card-border",
        className
      )}
      onClick={onClick}
      data-testid={`card-device-${agentId}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-md">
              <Monitor className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-base" data-testid={`text-hostname-${hostname}`}>
                {hostname}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`text-agent-${agentId}`}>
                {agentId}
              </p>
            </div>
          </div>
          <StatusIndicator status={status} size="md" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="w-4 h-4" />
            <span data-testid={`text-os-${hostname}`}>{os}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid={`text-user-${username}`}>{username}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span data-testid={`text-location-${hostname}`}>{location}</span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-card-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid={`text-heartbeat-${hostname}`}>{getTimeSince(lastHeartbeat)}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {status === "online" ? "Active" : status === "warning" ? "Issues" : "Offline"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}