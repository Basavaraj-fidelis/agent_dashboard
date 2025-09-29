import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

interface InstalledApp {
  name: string;
  version: string;
  publisher: string;
  install_location: string;
}

interface InstalledAppsProps {
  apps: InstalledApp[];
}

export default function InstalledApps({ apps }: InstalledAppsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [publisherFilter, setPublisherFilter] = useState("all");

  const publishers = useMemo(() => {
    const publisherSet = new Set(apps.map(app => app.publisher));
    const uniquePublishers = Array.from(publisherSet);
    return uniquePublishers.filter(p => p !== "Unknown").sort();
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = searchQuery === "" || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.publisher.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPublisher = publisherFilter === "all" || app.publisher === publisherFilter;
      
      return matchesSearch && matchesPublisher;
    });
  }, [apps, searchQuery, publisherFilter]);

  return (
    <Card data-testid="card-installed-apps">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Installed Applications
            <Badge variant="outline" className="ml-2">
              {filteredApps.length} of {apps.length}
            </Badge>
          </CardTitle>
        </div>
        <div className="flex gap-4 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-apps"
            />
          </div>
          <select
            value={publisherFilter}
            onChange={(e) => setPublisherFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-input bg-background rounded-md"
            data-testid="select-publisher-filter"
          >
            <option value="all">All Publishers</option>
            {publishers.slice(0, 10).map(publisher => (
              <option key={publisher} value={publisher}>
                {publisher.length > 30 ? `${publisher.substring(0, 30)}...` : publisher}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredApps.map((app, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 border border-card-border rounded-md hover-elevate"
              data-testid={`row-app-${index}`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate" title={app.name}>
                  {app.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {app.publisher}
                  </span>
                  {app.version !== "Unknown" && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        v{app.version}
                      </span>
                    </>
                  )}
                </div>
                {app.install_location !== "Unknown" && (
                  <div className="text-xs text-muted-foreground font-mono mt-1 truncate" title={app.install_location}>
                    {app.install_location}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Installed
                </Badge>
              </div>
            </div>
          ))}
          
          {filteredApps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No applications found matching your criteria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}