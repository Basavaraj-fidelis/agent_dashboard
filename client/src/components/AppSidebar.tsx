import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import StatusIndicator from "./StatusIndicator";
import ThemeToggle from "./ThemeToggle";
import { Monitor, Activity, Shield, Network, Package, Settings, Database, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

interface AppSidebarProps {
  agentCount?: {
    online: number;
    total: number;
  };
}

export default function AppSidebar({ agentCount = { online: 0, total: 0 } }: AppSidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Monitor,
      description: "Agent overview"
    },
    {
      title: "System Monitor",
      url: "/monitor",
      icon: Activity,
      description: "Performance metrics"
    },
    {
      title: "Security",
      url: "/security", 
      icon: Shield,
      description: "Security status"
    },
    {
      title: "Network",
      url: "/network",
      icon: Network,
      description: "Network details"
    },
    {
      title: "Applications",
      url: "/applications",
      icon: Package,
      description: "Installed software"
    }
  ];

  const adminItems = [
    {
      title: "Agent Management",
      url: "/agents",
      icon: Users,
      description: "Manage agents"
    },
    {
      title: "Database",
      url: "/database",
      icon: Database,
      description: "Data management"
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      description: "System settings"
    }
  ];

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Monitor className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sidebar-foreground">Agent Monitor</h2>
            <p className="text-xs text-sidebar-foreground/60">Multi-endpoint dashboard</p>
          </div>
        </div>
        <div className="px-2 pb-3">
          <div className="flex items-center justify-between p-2 bg-sidebar-accent rounded-md">
            <div className="flex items-center gap-2">
              <StatusIndicator status="online" size="sm" />
              <span className="text-sm text-sidebar-foreground">
                {agentCount.online}/{agentCount.total} Agents
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between p-2">
          <div className="text-xs text-sidebar-foreground/60">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}