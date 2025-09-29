import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusIndicator from "./StatusIndicator";
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface WindowsDefenderStatus {
  antivirus_enabled: boolean;
  real_time_protection: boolean;
  am_service_running: boolean;
  last_quick_scan_days_ago: string | number;
}

interface FirewallProfile {
  profile: string;
  enabled: boolean;
}

interface AntivirusProduct {
  name: string;
  state: string;
}

interface SecurityOverviewProps {
  windowsDefender: WindowsDefenderStatus;
  firewall: FirewallProfile[];
  uacStatus: string;
  installedAv: AntivirusProduct[];
  restartPending: boolean;
  recentPatches: Array<{
    hotfix_id: string;
    installed_on: string;
  }>;
}

export default function SecurityOverview({
  windowsDefender,
  firewall,
  uacStatus,
  installedAv,
  restartPending,
  recentPatches
}: SecurityOverviewProps) {
  const getSecurityStatus = () => {
    if (!windowsDefender.antivirus_enabled || !windowsDefender.real_time_protection) {
      return "error";
    }
    if (restartPending || uacStatus === "Disabled") {
      return "warning";
    }
    return "online";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="card-security-overview">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Windows Defender
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Antivirus Protection</span>
            <StatusIndicator 
              status={windowsDefender.antivirus_enabled ? "online" : "error"}
              showLabel
              label={windowsDefender.antivirus_enabled ? "Enabled" : "Disabled"}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Real-time Protection</span>
            <StatusIndicator 
              status={windowsDefender.real_time_protection ? "online" : "error"}
              showLabel
              label={windowsDefender.real_time_protection ? "Enabled" : "Disabled"}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Service Status</span>
            <StatusIndicator 
              status={windowsDefender.am_service_running ? "online" : "error"}
              showLabel
              label={windowsDefender.am_service_running ? "Running" : "Stopped"}
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-card-border">
            <span className="text-sm">Last Scan</span>
            <Badge variant="outline" className="text-xs">
              {typeof windowsDefender.last_quick_scan_days_ago === 'number' 
                ? `${windowsDefender.last_quick_scan_days_ago} days ago`
                : windowsDefender.last_quick_scan_days_ago
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            System Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">User Account Control</span>
            <StatusIndicator 
              status={uacStatus === "Enabled" ? "online" : "warning"}
              showLabel
              label={uacStatus}
            />
          </div>
          
          {firewall.map((profile, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{profile.profile} Firewall</span>
              <StatusIndicator 
                status={profile.enabled ? "online" : "error"}
                showLabel
                label={profile.enabled ? "Enabled" : "Disabled"}
              />
            </div>
          ))}

          {restartPending && (
            <div className="flex items-center justify-between pt-2 border-t border-card-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Restart Required</span>
              </div>
              <Badge variant="destructive">Pending</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Security Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPatches.slice(0, 6).map((patch, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-mono text-sm" data-testid={`text-patch-${patch.hotfix_id}`}>
                    {patch.hotfix_id}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(patch.installed_on).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {installedAv.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Third-party Antivirus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedAv.map((av, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="font-medium" data-testid={`text-av-${av.name}`}>{av.name}</span>
                  <StatusIndicator 
                    status={av.state === "Enabled" ? "online" : "error"}
                    showLabel
                    label={av.state}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}