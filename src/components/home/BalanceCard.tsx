import { Wallet, Lock, ArrowUpRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BalanceCardProps {
  totalBalance: number;
  lockedBalance: number;
  isLoading?: boolean;
}

const BalanceCard = ({ totalBalance, lockedBalance, isLoading }: BalanceCardProps) => {
  const availableBalance = totalBalance - lockedBalance;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border animate-pulse">
        <div className="space-y-4">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-32 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      {/* 총 잔액 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">총 VN 잔액</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">VN은 VeriNode 플랫폼의 보상 토큰입니다</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mb-5">
        <span className="text-4xl font-bold font-display text-foreground">
          {totalBalance.toLocaleString()}
        </span>
        <span className="text-lg text-muted-foreground ml-1">VN</span>
      </div>

      {/* 잔액 구분 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 인출 가능 잔액 */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">인출 가능</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-green-700">
              {availableBalance.toLocaleString()}
            </span>
            <span className="text-xs text-green-600/70">VN</span>
          </div>
        </div>

        {/* 잠긴 잔액 */}
        <div className={cn(
          "rounded-xl p-3 border",
          lockedBalance > 0 
            ? "bg-orange-500/10 border-orange-500/20" 
            : "bg-muted/50 border-border"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Lock className={cn(
              "w-4 h-4",
              lockedBalance > 0 ? "text-orange-600" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              lockedBalance > 0 ? "text-orange-700" : "text-muted-foreground"
            )}>보안 검토 중</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-xl font-bold",
              lockedBalance > 0 ? "text-orange-700" : "text-muted-foreground"
            )}>
              {lockedBalance.toLocaleString()}
            </span>
            <span className={cn(
              "text-xs",
              lockedBalance > 0 ? "text-orange-600/70" : "text-muted-foreground/70"
            )}>VN</span>
          </div>
          {lockedBalance > 0 && (
            <p className="text-[10px] text-orange-600/70 mt-1">
              보안 검토 후 인출 가능
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
