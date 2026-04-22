/**
 * AssetValueCard - 자산 가치 표시 공통 컴포넌트
 * 
 * 다양한 화면에서 사용되는 자산 가치 정보를 일관된 UI로 표시합니다.
 * - 총 자산 가치, 변동률, 보안 등급 등을 표시
 */
import { Shield, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RollingNumber from "@/components/animations/RollingNumber";
import { cn } from "@/lib/utils";

interface AssetValueCardProps {
  totalValue: number;
  valueChange?: number;
  securityLevel?: number;
  lockedAmount?: number;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

const getSecurityGrade = (level: number) => {
  if (level >= 4) return { label: "최고 등급", color: "text-emerald-500", bgColor: "bg-emerald-500/10" };
  if (level >= 3) return { label: "안전", color: "text-primary", bgColor: "bg-primary/10" };
  if (level >= 2) return { label: "보통", color: "text-amber-500", bgColor: "bg-amber-500/10" };
  return { label: "주의 필요", color: "text-red-500", bgColor: "bg-red-500/10" };
};

const AssetValueCard = ({
  totalValue,
  valueChange = 0,
  securityLevel = 3,
  lockedAmount = 0,
  variant = "default",
  className,
}: AssetValueCardProps) => {
  const securityGrade = getSecurityGrade(securityLevel);
  const isPositiveChange = valueChange >= 0;

  if (variant === "compact") {
    return (
      <Card className={cn("p-4 bg-card border-border", className)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">총 자산 가치</p>
            <RollingNumber
              value={totalValue}
              prefix="₩"
              className="text-lg font-bold text-foreground"
            />
          </div>
          <Badge variant="outline" className={cn("text-xs", securityGrade.color, securityGrade.bgColor)}>
            <Shield className="w-3 h-3 mr-1" />
            Lv.{securityLevel}
          </Badge>
        </div>
      </Card>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className={cn("p-5 bg-gradient-to-br from-card to-muted/30 border-border", className)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">보호된 데이터 자산 가치</p>
            <RollingNumber
              value={totalValue}
              prefix="₩"
              className="text-2xl font-bold text-foreground"
            />
          </div>
          <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-1.5", securityGrade.bgColor)}>
            <Shield className={cn("w-4 h-4", securityGrade.color)} />
            <span className={cn("text-sm font-medium", securityGrade.color)}>
              보안 등급: Lv.{securityLevel} ({securityGrade.label})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {isPositiveChange ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={cn("text-sm font-medium", isPositiveChange ? "text-emerald-500" : "text-red-500")}>
              {isPositiveChange ? "+" : ""}{valueChange.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">이번 달</span>
          </div>

          {lockedAmount > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs">
                잠금: ₩{lockedAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("p-4 bg-card border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">총 자산 가치</p>
        <Badge variant="outline" className={cn("text-xs", securityGrade.color, securityGrade.bgColor)}>
          <Shield className="w-3 h-3 mr-1" />
          {securityGrade.label}
        </Badge>
      </div>
      
      <RollingNumber
        value={totalValue}
        prefix="₩"
        className="text-xl font-bold text-foreground mb-2"
      />

      <div className="flex items-center gap-1.5">
        {isPositiveChange ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
        )}
        <span className={cn("text-xs font-medium", isPositiveChange ? "text-emerald-500" : "text-red-500")}>
          {isPositiveChange ? "+" : ""}{valueChange.toFixed(1)}% 이번 달
        </span>
      </div>
    </Card>
  );
};

export default AssetValueCard;
