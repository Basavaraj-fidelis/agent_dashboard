import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Process {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  memory_mb: number;
}

interface ProcessTableProps {
  processes: Process[];
  title: string;
  type: "cpu" | "memory";
  systemUsage?: {
    cpu?: number;
    memory?: number;
    totalRam?: string;
  };
}

export default function ProcessTable({ 
  processes, 
  title, 
  type,
  systemUsage 
}: ProcessTableProps) {
  const formatBytes = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <Card data-testid={`card-process-${type}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {systemUsage && (
            <div className="flex gap-4 text-sm">
              {systemUsage.cpu !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">System CPU:</span>
                  <Badge variant="outline" data-testid="text-system-cpu">
                    {systemUsage.cpu.toFixed(1)}%
                  </Badge>
                </div>
              )}
              {systemUsage.memory !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">System Memory:</span>
                  <Badge variant="outline" data-testid="text-system-memory">
                    {systemUsage.memory.toFixed(1)}%
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PID</TableHead>
              <TableHead>Process Name</TableHead>
              <TableHead className="text-right">
                {type === "cpu" ? "CPU %" : "Memory"}
              </TableHead>
              <TableHead className="text-right">
                {type === "cpu" ? "Memory" : "Memory %"}
              </TableHead>
              <TableHead className="w-[100px]">Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((process, index) => (
              <TableRow key={`${process.pid}-${index}`} data-testid={`row-process-${process.pid}`}>
                <TableCell className="font-mono text-sm">
                  {process.pid}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {process.name}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {type === "cpu" 
                    ? `${process.cpu_percent.toFixed(1)}%`
                    : formatBytes(process.memory_mb)
                  }
                </TableCell>
                <TableCell className="text-right font-mono">
                  {type === "cpu"
                    ? formatBytes(process.memory_mb)
                    : `${process.memory_percent.toFixed(1)}%`
                  }
                </TableCell>
                <TableCell>
                  <Progress 
                    value={type === "cpu" ? process.cpu_percent : process.memory_percent}
                    className="h-2"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}