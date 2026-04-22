/**
 * TrustScoreDisplay - 신뢰점수 표시 공통 컴포넌트
 * 
 * 사용자의 신뢰점수를 다양한 형태로 일관되게 표시합니다.
 * - 게이지형, 배지형, 인라인형 등 다양한 variant 지원
 */
import { Shield, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TrustScoreDisplayProps {
  score: number;
  maxScore?: number;
  variant?: "gauge" | "badge" | "inline" | "card";
  showLabel?: boolean;
  showProgress?: boolean;
  className?: string;
}

const getScoreGrade = (score: number) => {
  if (score >= 90) return { grade: "S", label: "최상위", color: "text-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" };
  if (score >= 80) return { grade: "A", label: "우수", color: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" };
  if (score >= 70) return { grade: "B", label: "양호", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30" };
  if (score >= 60) return { grade: "C", label: "보통", color: "text-sky-500", bgColor: "bg-sky-500/10", borderColor: "border-sky-500/30" };
  return { grade: "D", label: "개선 필요", color: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-muted" };
};

const TrustScoreDisplay = ({
  score,
  maxScore = 100,
  variant = "card",
  showLabel = true,
  showProgress = true,
  className,
}: TrustScoreDisplayProps) => {
  const gradeInfo = getScoreGrade(score);
  const percentage = Math.min((score / maxScore) * 100, 100);

  if (variant === "badge") {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1 font-medium",
          gradeInfo.color,
          gradeInfo.bgColor,
          gradeInfo.borderColor,
          className
        )}
      >
        <Shield className="w-3 h-3" />
        {score}점
        {showLabel && <span className="text-xs opacity-80">({gradeInfo.label})</span>}
      </Badge>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", gradeInfo.bgColor)}>
          <span className={cn("text-sm font-bold", gradeInfo.color)}>{gradeInfo.grade}</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{score}점</span>
          {showLabel && (
            <span className="text-xs text-muted-foreground ml-1">/ {maxScore}</span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "gauge") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className={cn(
          "w-24 h-24 rounded-full border-4 flex items-center justify-center",
          gradeInfo.borderColor,
          gradeInfo.bgColor
        )}>
          <div className="text-center">
            <span className={cn("text-2xl font-bold", gradeInfo.color)}>{score}</span>
            <p className="text-xs text-muted-foreground">/ {maxScore}</p>
          </div>
        </div>
        {showLabel && (
          <div className="mt-2 text-center">
            <Badge variant="outline" className={cn("text-xs", gradeInfo.color, gradeInfo.bgColor)}>
              {gradeInfo.grade}등급 · {gradeInfo.label}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn("p-4 bg-card border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", gradeInfo.bgColor)}>
            <Shield className={cn("w-4 h-4", gradeInfo.color)} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">신뢰점수</p>
            {showLabel && (
              <p className={cn("text-xs", gradeInfo.color)}>{gradeInfo.grade}등급 · {gradeInfo.label}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-xl font-bold", gradeInfo.color)}>{score}</span>
          <span className="text-sm text-muted-foreground">/{maxScore}</span>
        </div>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              인증 완료
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +5점 가능
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TrustScoreDisplay;
