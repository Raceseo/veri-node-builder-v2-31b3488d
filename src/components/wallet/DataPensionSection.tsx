import { useState, useEffect } from "react";
import { Wallet, Calendar, TrendingUp, Coins, Database, Heart, Banknote, ShieldAlert, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

interface DataPensionSectionProps {
  estimatedMonthlyPension?: number; // VCoreAssetDashboard에서 연동되는 예상 월 연금
}

const DataPensionSection = ({ estimatedMonthlyPension }: DataPensionSectionProps) => {
  const { user } = useAuth();
  const [currentReward, setCurrentReward] = useState(18500);
  const baseTargetReward = 35000;
  // 외부에서 전달받은 예상 월 연금이 있으면 사용, 없으면 기본값
  const targetReward = estimatedMonthlyPension || baseTargetReward;
  const nextPaymentDate = "12월 25일";

  // 도용 방지: 실명 인증 여부 확인 (User metadata 등에서 확인한다고 가정)
  // 이 예제에서는 user 객체가 존재하면 인증된 것으로 간주하지만, 
  // 실제로는 user.user_metadata.is_verified 등을 체크해야 함.
  const isVerified = user !== null; // Mock condition for this component

  const subscriptions = [
    { id: 1, title: "금융 데이터 임대 중", amount: 2000, icon: Banknote, status: "active" },
    { id: 2, title: "건강 데이터 임대 중", amount: 3000, icon: Heart, status: "active" },
    { id: 3, title: "소비 패턴 분석 제공", amount: 1500, icon: Database, status: "active" },
  ];

  // Simulate real-time reward accumulation
  useEffect(() => {
    // 보안: 미인증 사용자는 자산 가치 산정 제외 (Zero Valuation)
    if (!isVerified) {
      setCurrentReward(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentReward(prev => {
        const increment = Math.random() * 50 + 10;
        const newValue = prev + increment;
        return newValue >= targetReward ? targetReward : Math.round(newValue);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [targetReward, isVerified]);

  const progressPercentage = (currentReward / targetReward) * 100;
  const totalMonthlyIncome = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  if (!isVerified) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
             <Lock className="w-4 h-4 text-white" />
           </div>
           <h2 className="font-bold text-foreground">나의 월간 데이터 연금</h2>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700 text-center">
           <ShieldAlert className="w-12 h-12 text-gray-500 mx-auto mb-3" />
           <h3 className="text-lg font-semibold text-gray-300">데이터 가치 산정 일시 중지</h3>
           <p className="text-sm text-gray-500 mt-2">
             실명 인증이 완료되지 않아 데이터 자산 가치가 '0'으로 산정되고 있습니다.<br/>
             보안을 위해 본인 인증을 완료해주세요.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-bold text-foreground">나의 월간 데이터 연금</h2>
      </div>

      {/* Main Pension Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-900 p-6 shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />
        
        <div className="relative">
          {/* Real-time Gauge */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-200 text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                이번 달 기본 유지 보상
              </span>
              <span className="text-amber-300 text-xs animate-pulse">● 실시간 누적 중</span>
            </div>
            
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold text-white">
                ₩{currentReward.toLocaleString()}
              </span>
              <span className="text-emerald-300 text-sm mb-1">
                / ₩{targetReward.toLocaleString()} 예상
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="relative h-3 bg-emerald-950/50 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            
            <p className="text-emerald-300/70 text-xs mt-2">
              {Math.round(progressPercentage)}% 달성 · 목표까지 ₩{(targetReward - currentReward).toLocaleString()} 남음
            </p>
          </div>

          {/* Subscription Status */}
          <div className="space-y-2 mb-6">
            <p className="text-emerald-200 text-xs font-medium mb-2">현재 임대 중인 데이터</p>
            {subscriptions.map((sub) => {
              const Icon = sub.icon;
              return (
                <div 
                  key={sub.id}
                  className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-emerald-400/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-amber-500/30 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="flex-1 text-white text-sm">{sub.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-300 font-bold text-sm">+₩{sub.amount.toLocaleString()}</span>
                    <span className="text-emerald-400 text-xs">/월</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Total */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 mb-4 border border-amber-400/30">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-emerald-100 text-sm">예상 월 정기 수익</span>
            </div>
            <span className="text-2xl font-bold text-amber-300">
              +₩{totalMonthlyIncome.toLocaleString()}
            </span>
          </div>

          {/* Next Payment Date */}
          <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-800/50 via-amber-800/30 to-emerald-800/50 rounded-xl border border-emerald-500/20">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-emerald-100 text-sm">
              다음 데이터 정산일: <span className="font-bold text-amber-300">{nextPaymentDate}</span>
            </span>
          </div>
          
          {/* Trust Message */}
          <p className="text-center text-emerald-300/60 text-xs mt-3">
            🔒 매달 안정적으로 데이터 수익이 정산됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataPensionSection;