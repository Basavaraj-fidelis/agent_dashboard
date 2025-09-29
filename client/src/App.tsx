import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/monitor" component={() => <div className="p-6"><h1>System Monitor</h1><p>Performance metrics coming soon...</p></div>} />
      <Route path="/security" component={() => <div className="p-6"><h1>Security Overview</h1><p>Security dashboard coming soon...</p></div>} />
      <Route path="/network" component={() => <div className="p-6"><h1>Network Monitor</h1><p>Network analysis coming soon...</p></div>} />
      <Route path="/applications" component={() => <div className="p-6"><h1>Application Manager</h1><p>Application management coming soon...</p></div>} />
      <Route path="/agents" component={() => <div className="p-6"><h1>Agent Management</h1><p>Agent administration coming soon...</p></div>} />
      <Route path="/database" component={() => <div className="p-6"><h1>Database</h1><p>Data management interface coming soon...</p></div>} />
      <Route path="/settings" component={() => <div className="p-6"><h1>Settings</h1><p>System configuration coming soon...</p></div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  const mockAgentCount = {
    online: 12,
    total: 15
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style}>
          <div className="flex h-screen w-full">
            <AppSidebar agentCount={mockAgentCount} />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
