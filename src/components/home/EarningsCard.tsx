import { DollarSign, TrendingUp, TrendingDown, Coins } from "lucide-react";

interface EarningsCardProps {
  amount: number;
  monthlyChange?: number;
  totalEarnings?: number;
}

const EarningsCard = ({ amount, monthlyChange = 0, totalEarnings = 0 }: EarningsCardProps) => {
  const isPositiveChange = monthlyChange >= 0;
  
  return (
    <div className="bg-gradient-primary rounded-2xl p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm mb-1">
              보유 VN 토큰
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary-foreground">
                {amount.toLocaleString()}
              </p>
              <span className="text-primary-foreground/70 text-sm">VN</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Coins className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          {/* Monthly Change */}
          <div className="flex-1">
            <p className="text-primary-foreground/60 text-xs mb-1">이번 달</p>
            <div className="flex items-center gap-1">
              {isPositiveChange ? (
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-300" />
              )}
              <span className={`text-sm font-medium ${isPositiveChange ? 'text-emerald-300' : 'text-red-300'}`}>
                {isPositiveChange ? '+' : ''}{monthlyChange.toLocaleString()} VN
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20" />

          {/* Total Earnings */}
          <div className="flex-1">
            <p className="text-primary-foreground/60 text-xs mb-1">누적 수익</p>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-primary-foreground/70" />
              <span className="text-sm font-medium text-primary-foreground">
                {totalEarnings.toLocaleString()} VN
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsCard;
