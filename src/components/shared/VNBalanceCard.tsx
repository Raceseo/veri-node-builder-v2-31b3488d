/**
 * VNBalanceCard - VN 잔액 표시 공통 컴포넌트
 * 
 * VeriNode 토큰(VN) 잔액을 다양한 형태로 일관되게 표시합니다.
 * - 사용 가능 잔액, 잠금 잔액, 출금 가능 금액 등 표시
 */
import { Wallet, Lock, ArrowUpRight, CircleDollarSign, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RollingNumber from "@/components/animations/RollingNumber";
import { cn } from "@/lib/utils";

interface VNBalanceCardProps {
  balance: number;
  lockedBalance?: number;
  pendingBalance?: number;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  onWithdraw?: () => void;
  onCharge?: () => void;
  className?: string;
}

const VNBalanceCard = ({
  balance,
  lockedBalance = 0,
  pendingBalance = 0,
  variant = "default",
  showActions = false,
  onWithdraw,
  onCharge,
  className,
}: VNBalanceCardProps) => {
  const availableBalance = balance - lockedBalance;
  const totalBalance = balance + pendingBalance;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Coins className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">VN 잔액</p>
          <RollingNumber
            value={balance}
            suffix=" VN"
            className="text-sm font-bold text-foreground"
          />
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className={cn("p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20", className)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 VN 잔액</p>
              <RollingNumber
                value={totalBalance}
                suffix=" VN"
                className="text-2xl font-bold text-foreground"
              />
            </div>
          </div>
          {pendingBalance > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              +{pendingBalance.toLocaleString()} 정산 대기
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-card/50 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">사용 가능</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {availableBalance.toLocaleString()} VN
            </p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">잠금 중</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {lockedBalance.toLocaleString()} VN
            </p>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onCharge}
            >
              <Coins className="w-4 h-4 mr-1" />
              충전
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={onWithdraw}
              disabled={availableBalance <= 0}
            >
              <ArrowUpRight className="w-4 h-4 mr-1" />
              출금
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("p-4 bg-card border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">VN 잔액</p>
            <RollingNumber
              value={balance}
              suffix=" VN"
              className="text-lg font-bold text-foreground"
            />
          </div>
        </div>
        
        {lockedBalance > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            {lockedBalance.toLocaleString()} 잠금
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={onCharge}
          >
            충전
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={onWithdraw}
            disabled={availableBalance <= 0}
          >
            출금
          </Button>
        </div>
      )}
    </Card>
  );
};

export default VNBalanceCard;
