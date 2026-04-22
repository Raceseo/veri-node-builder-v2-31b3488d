import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityShieldProps {
  securityLevel: number;
  trustScore: number;
  isLoading?: boolean;
}

const SecurityShield = ({ securityLevel, trustScore, isLoading }: SecurityShieldProps) => {
  // 보안 등급에 따른 스타일 결정
  const getShieldConfig = () => {
    if (securityLevel >= 2) {
      return {
        icon: ShieldCheck,
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "border-primary/30",
        label: "인증 완료",
        description: "최상위 보안 등급",
        glowClass: "shadow-[0_0_20px_rgba(49,130,246,0.3)]"
      };
    } else if (securityLevel === 1) {
      return {
        icon: ShieldAlert,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        label: "기본 인증",
        description: "추가 인증 권장",
        glowClass: "shadow-[0_0_20px_rgba(249,115,22,0.3)]"
      };
    } else {
      return {
        icon: Shield,
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        borderColor: "border-muted",
        label: "미인증",
        description: "신원 인증 필요",
        glowClass: ""
      };
    }
  };

  const config = getShieldConfig();
  const IconComponent = config.icon;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-6 w-16 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-2xl p-4 border transition-all duration-300",
      config.borderColor,
      config.glowClass
    )}>
      <div className="flex items-center gap-4">
        {/* 방패 아이콘 */}
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
          config.bgColor
        )}>
          <IconComponent className={cn("w-8 h-8", config.color)} />
        </div>

        {/* 보안 정보 */}
        <div className="flex-1">
          <h3 className="font-display font-bold text-foreground">
            VeriNode Security Shield
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              config.bgColor,
              config.color
            )}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {config.description}
            </span>
          </div>
        </div>

        {/* 신뢰 점수 */}
        <div className="text-right">
          <div className={cn("text-2xl font-bold font-display", config.color)}>
            {trustScore}
          </div>
          <div className="text-xs text-muted-foreground">Trust Score</div>
        </div>
      </div>

      {/* 보안 등급 바 */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>보안 등급</span>
          <span>Level {securityLevel}/3</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              securityLevel >= 2 ? "bg-primary" : securityLevel === 1 ? "bg-orange-500" : "bg-muted-foreground/30"
            )}
            style={{ width: `${(securityLevel / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SecurityShield;
