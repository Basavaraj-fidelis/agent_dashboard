import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from '../AppSidebar';

export default function AppSidebarExample() {
  const mockAgentCount = {
    online: 12,
    total: 15
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar agentCount={mockAgentCount} />
        <div className="flex-1 p-6">
          <h3 className="text-lg font-semibold mb-4">Application Sidebar</h3>
          <p className="text-muted-foreground">
            This sidebar provides navigation for the multi-agent monitoring dashboard.
            It shows the current agent status and provides access to all monitoring features.
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}