import { TrendingUp, Sparkles } from "lucide-react";

interface EarningsWidgetProps {
  baseAmount: number;
  bonusAmount: number;
  trustLevel: string;
}

const EarningsWidget = ({ baseAmount, bonusAmount, trustLevel }: EarningsWidgetProps) => {
  const totalAmount = baseAmount + bonusAmount;

  return (
    <div className="relative overflow-hidden bg-gradient-trust rounded-2xl p-6 text-trust-foreground">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-trust-foreground/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-trust-foreground/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium opacity-90">인증 완료 시 예상 설문 단가</span>
        </div>

        <div className="flex items-end gap-3 mb-4">
          <span className="text-4xl font-bold tracking-tight">
            {totalAmount.toLocaleString()}원
          </span>
          <div className="flex items-center gap-1 text-sm opacity-80 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>일반 대비 +{Math.round((bonusAmount / baseAmount) * 100)}%</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-trust-foreground/20 text-xs font-medium">
            <span>기본 단가</span>
            <span className="font-bold">{baseAmount.toLocaleString()}원</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/30 text-xs font-medium">
            <span>신뢰 보너스</span>
            <span className="font-bold">+{bonusAmount.toLocaleString()}원</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-trust-foreground/10 text-xs font-medium">
            <span>🏅 {trustLevel} 등급</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsWidget;
