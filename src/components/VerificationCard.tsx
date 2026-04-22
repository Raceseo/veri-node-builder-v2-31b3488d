import { ReactNode } from "react";
import { CheckCircle2, ChevronRight, Coins } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface VerificationCardProps {
  step: number;
  title: string;
  description: string;
  icon: ReactNode;
  isCompleted: boolean;
  isActive: boolean;
  buttonText: string;
  onAction: () => void;
  reward?: string;
}

const VerificationCard = ({
  step,
  title,
  description,
  icon,
  isCompleted,
  isActive,
  buttonText,
  onAction,
  reward,
}: VerificationCardProps) => {
  return (
    <div
      className={cn(
        "relative bg-card rounded-2xl p-5 border-2 transition-all duration-300 shadow-card",
        isCompleted && "border-success/50 bg-success/5",
        isActive && !isCompleted && "border-primary shadow-lg",
        !isActive && !isCompleted && "border-border opacity-60"
      )}
      style={{
        animationDelay: `${step * 0.1}s`,
      }}
    >
      {/* Step Badge */}
      <div className="absolute -top-3 left-5">
        <div
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
            isCompleted && "bg-success text-success-foreground",
            isActive && !isCompleted && "bg-primary text-primary-foreground",
            !isActive && !isCompleted && "bg-muted text-muted-foreground"
          )}
        >
          Step {step}
        </div>
      </div>

      <div className="flex items-start gap-4 mt-2">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            isCompleted && "bg-success/10 text-success",
            isActive && !isCompleted && "bg-primary/10 text-primary",
            !isActive && !isCompleted && "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {description}
          </p>

          {/* Reward Badge */}
          {reward && !isCompleted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 text-gold-dark text-xs font-semibold mb-3">
              <Coins className="w-3.5 h-3.5" />
              <span>완료 시 {reward} 획득</span>
            </div>
          )}

          {/* Action Button */}
          <Button
            variant={isCompleted ? "secondary" : isActive ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={onAction}
            disabled={!isActive && !isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                인증 완료
              </>
            ) : (
              <>
                {buttonText}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerificationCard;