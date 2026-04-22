/**
 * DataFreshnessAlert - 데이터 신선도 경고 공통 컴포넌트
 * 
 * 사용자 데이터의 신선도(최근 업데이트 시점)를 표시하고
 * 오래된 경우 업데이트를 권장합니다.
 */
import { Clock, AlertTriangle, CheckCircle2, RefreshCw, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface DataFreshnessAlertProps {
  lastUpdated: Date | string | null;
  warningThresholdDays?: number;
  criticalThresholdDays?: number;
  variant?: "alert" | "badge" | "inline";
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  className?: string;
}

type FreshnessStatus = "fresh" | "warning" | "critical" | "unknown";

const getFreshnessStatus = (
  lastUpdated: Date | string | null,
  warningDays: number,
  criticalDays: number
): { status: FreshnessStatus; daysAgo: number } => {
  if (!lastUpdated) {
    return { status: "unknown", daysAgo: -1 };
  }

  const lastDate = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysAgo >= criticalDays) return { status: "critical", daysAgo };
  if (daysAgo >= warningDays) return { status: "warning", daysAgo };
  return { status: "fresh", daysAgo };
};

const statusConfig = {
  fresh: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "최신",
    message: "데이터가 최신 상태입니다",
  },
  warning: {
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "업데이트 권장",
    message: "데이터 업데이트를 권장합니다",
  },
  critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "업데이트 필요",
    message: "데이터가 오래되었습니다. 업데이트가 필요합니다",
  },
  unknown: {
    icon: Calendar,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
    label: "정보 없음",
    message: "마지막 업데이트 정보가 없습니다",
  },
};

const DataFreshnessAlert = ({
  lastUpdated,
  warningThresholdDays = 7,
  criticalThresholdDays = 30,
  variant = "alert",
  showRefreshButton = true,
  onRefresh,
  className,
}: DataFreshnessAlertProps) => {
  const { status, daysAgo } = getFreshnessStatus(lastUpdated, warningThresholdDays, criticalThresholdDays);
  const config = statusConfig[status];
  const Icon = config.icon;

  const timeAgoText = lastUpdated
    ? formatDistanceToNow(typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated, {
        addSuffix: true,
        locale: ko,
      })
    : "알 수 없음";

  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1",
          config.color,
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
        <span className="opacity-70">({timeAgoText})</span>
      </Badge>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("w-3.5 h-3.5", config.color)} />
        </div>
        <div className="flex-1">
          <span className={cn("text-xs", config.color)}>{config.label}</span>
          <span className="text-xs text-muted-foreground ml-1">· {timeAgoText}</span>
        </div>
        {showRefreshButton && status !== "fresh" && onRefresh && (
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onRefresh}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  // Alert variant (default)
  if (status === "fresh" && !showRefreshButton) {
    return null; // Don't show alert if data is fresh and no refresh button
  }

  return (
    <Alert className={cn(config.bgColor, config.borderColor, className)}>
      <Icon className={cn("w-4 h-4", config.color)} />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className={cn("font-medium", config.color)}>{config.label}</span>
          <span className="text-sm text-muted-foreground ml-2">
            {config.message} ({timeAgoText})
          </span>
        </div>
        {showRefreshButton && onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="ml-2">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            업데이트
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DataFreshnessAlert;
