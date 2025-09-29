import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    label: "Online",
    pulse: true
  },
  offline: {
    color: "bg-gray-400",
    label: "Offline", 
    pulse: false
  },
  warning: {
    color: "bg-yellow-500",
    label: "Warning",
    pulse: true
  },
  error: {
    color: "bg-red-500", 
    label: "Error",
    pulse: true
  }
};

const sizeConfig = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4"
};

export default function StatusIndicator({ 
  status, 
  size = "md", 
  showLabel = false, 
  label,
  className 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={`status-${status}`}>
      <div className="relative">
        <div className={cn(
          "rounded-full",
          config.color,
          sizeConfig[size]
        )} />
        {config.pulse && (
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping",
            config.color,
            sizeConfig[size]
          )} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground" data-testid={`text-${status}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
}