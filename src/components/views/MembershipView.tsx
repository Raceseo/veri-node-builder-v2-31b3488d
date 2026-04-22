import { useState } from "react";
import { 
  ArrowLeft, 
  Check, 
  Crown, 
  Zap, 
  Star, 
  Shield, 
  TrendingUp,
  Gift,
  Clock,
  Users,
  Sparkles,
  ChevronRight,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import MembershipPaymentSheet from "@/components/payment/MembershipPaymentSheet";

interface MembershipViewProps {
  onBack: () => void;
}

type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

interface Plan {
  id: PlanType;
  name: string;
  nameKr: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  icon: React.ElementType;
  popular?: boolean;
  features: string[];
  dataBonus: string;
  surveyPriority: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    nameKr: '무료',
    price: 0,
    period: '영구 무료',
    description: '기본 데이터 수익화 시작',
    color: 'text-slate-400',
    bgGradient: 'from-slate-800 to-slate-900',
    borderColor: 'border-slate-700',
    icon: Zap,
    features: [
      '기본 설문 참여',
      '월 5회 데이터 분석',
      '기본 보상 지급',
      '이메일 지원'
    ],
    dataBonus: '1x 보상',
    surveyPriority: '일반'
  },
  {
    id: 'basic',
    name: 'Basic',
    nameKr: '베이직',
    price: 9900,
    originalPrice: 14900,
    period: '월',
    description: '효율적인 데이터 수익화',
    color: 'text-blue-400',
    bgGradient: 'from-blue-900/50 to-indigo-900/50',
    borderColor: 'border-blue-500/30',
    icon: Star,
    features: [
      '모든 Free 기능 포함',
      '월 20회 데이터 분석',
      '우선 설문 매칭',
      '실시간 채팅 지원',
      '데이터 인사이트 리포트'
    ],
    dataBonus: '1.5x 보상',
    surveyPriority: '우선'
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKr: '프로',
    price: 29900,
    originalPrice: 39900,
    period: '월',
    description: '프리미엄 데이터 파트너',
    color: 'text-violet-400',
    bgGradient: 'from-violet-900/50 to-purple-900/50',
    borderColor: 'border-violet-500/50',
    icon: Crown,
    popular: true,
    features: [
      '모든 Basic 기능 포함',
      '무제한 데이터 분석',
      'VIP 설문 독점 참여',
      '전담 매니저 배정',
      'Private Vault 전체 잠금해제',
      'AI 페르소나 심층 분석',
      '수익금 즉시 출금'
    ],
    dataBonus: '3x 보상',
    surveyPriority: 'VIP'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameKr: '엔터프라이즈',
    price: 99900,
    period: '월',
    description: '기업 맞춤형 솔루션',
    color: 'text-amber-400',
    bgGradient: 'from-amber-900/30 to-orange-900/30',
    borderColor: 'border-amber-500/30',
    icon: Shield,
    features: [
      '모든 Pro 기능 포함',
      '기업 전용 설문 설계',
      '화이트라벨 브랜딩',
      'API 액세스',
      '맞춤형 데이터 분석',
      '전용 서버 환경',
      '법인 세금계산서 발행'
    ],
    dataBonus: '5x 보상',
    surveyPriority: '최우선'
  }
];

export const MembershipView = ({ onBack }: MembershipViewProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const selectedPlanData = plans.find(p => p.id === selectedPlan)!;

  const yearlyDiscount = 0.2; // 20% off

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return 0;
    if (billingCycle === 'yearly') {
      return Math.round(plan.price * 12 * (1 - yearlyDiscount));
    }
    return plan.price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white">데이터 구독 멤버십</h1>
            <p className="text-xs text-white/50">더 큰 보상을 위한 프리미엄 혜택</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            데이터 수익을 <span className="text-violet-400">극대화</span>하세요
          </h2>
          <p className="text-white/60 text-sm">
            멤버십 등급에 따라 최대 5배 보상을 받으세요
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 p-1 bg-slate-800/50 rounded-2xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
              billingCycle === 'monthly'
                ? "bg-white text-slate-900"
                : "text-white/60 hover:text-white"
            )}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all relative",
              billingCycle === 'yearly'
                ? "bg-white text-slate-900"
                : "text-white/60 hover:text-white"
            )}
          >
            연간 결제
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
              -20%
            </span>
          </button>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const price = getPrice(plan);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "relative p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer",
                  `bg-gradient-to-br ${plan.bgGradient}`,
                  isSelected
                    ? `${plan.borderColor} shadow-lg`
                    : "border-white/10 hover:border-white/20"
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 px-4 py-1 text-xs font-bold shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      가장 인기
                    </Badge>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                    plan.id === 'pro' 
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" 
                      : "bg-white/10"
                  )}>
                    <Icon className={cn(
                      "w-7 h-7",
                      plan.id === 'pro' ? "text-white" : plan.color
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                      <span className="text-sm text-white/50">{plan.nameKr}</span>
                    </div>
                    <p className="text-sm text-white/60 mb-3">{plan.description}</p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      {plan.originalPrice && billingCycle === 'monthly' && (
                        <span className="text-sm text-white/40 line-through">
                          ₩{plan.originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-white">
                        {price === 0 ? '무료' : `₩${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span className="text-white/50 text-sm">
                          /{billingCycle === 'yearly' ? '년' : plan.period}
                        </span>
                      )}
                    </div>

                    {/* Bonus Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={cn(
                        "border-0 font-medium text-xs",
                        plan.id === 'free' ? "bg-slate-700 text-slate-300" :
                        plan.id === 'basic' ? "bg-blue-500/20 text-blue-300" :
                        plan.id === 'pro' ? "bg-violet-500/20 text-violet-300" :
                        "bg-amber-500/20 text-amber-300"
                      )}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {plan.dataBonus}
                      </Badge>
                      <Badge className="bg-white/10 text-white/70 border-0 font-medium text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {plan.surveyPriority} 매칭
                      </Badge>
                    </div>

                    {/* Features - Only show for selected plan */}
                    {isSelected && (
                      <div className="space-y-2 pt-3 border-t border-white/10 animate-fade-in">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center",
                              plan.id === 'free' ? "bg-slate-700" :
                              plan.id === 'basic' ? "bg-blue-500/20" :
                              plan.id === 'pro' ? "bg-violet-500/20" :
                              "bg-amber-500/20"
                            )}>
                              <Check className={cn(
                                "w-3 h-3",
                                plan.id === 'free' ? "text-slate-300" :
                                plan.id === 'basic' ? "text-blue-400" :
                                plan.id === 'pro' ? "text-violet-400" :
                                "text-amber-400"
                              )} />
                            </div>
                            <span className="text-sm text-white/80">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isSelected
                      ? "bg-violet-500 border-violet-500"
                      : "border-white/30"
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Summary */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">멤버십 공통 혜택</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/70">데이터 암호화 보호</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/70">언제든 해지 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/70">7일 무료 체험</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/70">환불 보장</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent -mx-4 px-4">
          <Button 
            onClick={() => selectedPlan !== 'free' && setShowPaymentSheet(true)}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-violet-500/25"
          >
            {selectedPlan === 'free' ? '무료로 시작하기' : '멤버십 시작하기'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-center text-white/40 text-xs mt-3">
            구독은 언제든지 취소할 수 있습니다
          </p>
        </div>
      </div>

      {/* Payment Sheet */}
      {selectedPlan !== 'free' && (
        <MembershipPaymentSheet
          open={showPaymentSheet}
          onOpenChange={setShowPaymentSheet}
          plan={{
            id: selectedPlanData.id,
            name: selectedPlanData.name,
            nameKr: selectedPlanData.nameKr,
            price: selectedPlanData.price,
            originalPrice: selectedPlanData.originalPrice,
            features: selectedPlanData.features,
          }}
          billingCycle={billingCycle}
          onComplete={() => {
            onBack();
          }}
        />
      )}
    </div>
  );
};

export default MembershipView;
