import { useState } from "react";
import { 
  Check, X, Crown, Zap, Shield, Building2, 
  Phone, ArrowRight, Star, Lock, BarChart3,
  Globe, FileCheck, Activity, Server, Users,
  Sparkles, ChevronLeft, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnterpriseSubscriptionViewProps {
  onBack?: () => void;
  onSelectPlan?: (plan: string) => void;
  onContactSales?: () => void;
}

interface PlanFeature {
  name: string;
  standard: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { name: "V-Core 검증 데이터 접근 권한", standard: "기본", professional: "프리미엄", enterprise: "무제한" },
  { name: "월간 데이터 요청 한도", standard: "10,000건", professional: "100,000건", enterprise: "무제한" },
  { name: "실시간 시계열 대시보드", standard: false, professional: true, enterprise: true },
  { name: "V-Core 실시간 무결성 모니터링", standard: false, professional: true, enterprise: true },
  { name: "글로벌 규제(GDPR/ISO) 준수 리포트", standard: false, professional: true, enterprise: true },
  { name: "HIPAA/CCPA 컴플라이언스 보고서", standard: false, professional: false, enterprise: true },
  { name: "전용 데이터 클린룸", standard: false, professional: false, enterprise: true },
  { name: "맞춤형 V-Core 노드 구축", standard: false, professional: false, enterprise: true },
  { name: "전담 고객 성공 매니저", standard: false, professional: true, enterprise: true },
  { name: "SLA 보장", standard: "99.5%", professional: "99.9%", enterprise: "99.99%" },
  { name: "API 호출 제한", standard: "1,000/일", professional: "50,000/일", enterprise: "무제한" },
  { name: "기술 지원", standard: "이메일", professional: "24/7 채팅", enterprise: "전담팀" },
];

const EnterpriseSubscriptionView = ({ 
  onBack, 
  onSelectPlan, 
  onContactSales 
}: EnterpriseSubscriptionViewProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'standard',
      name: 'Standard',
      description: '중소기업을 위한 기본 데이터 분석',
      monthlyPrice: 990000,
      annualPrice: 790000,
      color: 'from-slate-600 to-slate-700',
      borderColor: 'border-slate-600/30',
      textColor: 'text-slate-300',
      popular: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'V-Core 프리미엄 기능으로 심층 분석',
      monthlyPrice: 2990000,
      annualPrice: 2490000,
      color: 'from-cyan-600 to-blue-700',
      borderColor: 'border-cyan-500/50',
      textColor: 'text-cyan-400',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: '대기업 맞춤형 전용 솔루션',
      monthlyPrice: null,
      annualPrice: null,
      color: 'from-amber-500 to-yellow-600',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-400',
      popular: false,
    },
  ];

  const getFeatureValue = (feature: PlanFeature, planId: string) => {
    const value = feature[planId as keyof PlanFeature];
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-emerald-400" />
      ) : (
        <X className="w-5 h-5 text-slate-600" />
      );
    }
    return <span className="text-sm text-slate-300">{value}</span>;
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return `₩${(price / 10000).toLocaleString()}만`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1428] to-[#0a1a2e]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center justify-between px-6 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm tracking-wider">ENTERPRISE</span>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              VeriNode
            </span>
            {" "}Enterprise Plans
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            V-Core 검증 기술로 신뢰할 수 있는 데이터를 확보하세요.
            글로벌 규제를 준수하는 안전한 데이터 분석 플랫폼입니다.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === 'monthly' 
                  ? "bg-slate-700 text-white" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                billingCycle === 'annual' 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              연간 결제
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                20% 할인
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl p-6 border transition-all duration-300",
                plan.popular 
                  ? "bg-gradient-to-b from-cyan-900/30 to-slate-900/50 border-cyan-500/50 scale-105 z-10" 
                  : "bg-slate-900/30 border-slate-700/50 hover:border-slate-600/50"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/30">
                    <Star className="w-3.5 h-3.5" />
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Enterprise Badge */}
              {plan.id === 'enterprise' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                    <Crown className="w-3.5 h-3.5" />
                    PREMIUM
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6 pt-4">
                <div className={cn(
                  "w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br",
                  plan.color
                )}>
                  {plan.id === 'standard' && <Building2 className="w-7 h-7 text-white" />}
                  {plan.id === 'professional' && <Zap className="w-7 h-7 text-white" />}
                  {plan.id === 'enterprise' && <Crown className="w-7 h-7 text-white" />}
                </div>
                <h3 className={cn("text-xl font-bold", plan.textColor)}>{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="text-center mb-6">
                {plan.monthlyPrice ? (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-white">
                        {formatPrice(billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice)}
                      </span>
                      <span className="text-slate-500">/월</span>
                    </div>
                    {billingCycle === 'annual' && plan.monthlyPrice && (
                      <p className="text-xs text-slate-500 mt-1 line-through">
                        월 {formatPrice(plan.monthlyPrice)}
                      </p>
                    )}
                  </>
                ) : (
                  <div>
                    <span className="text-2xl font-bold text-amber-400">맞춤 견적</span>
                    <p className="text-xs text-slate-500 mt-1">기업 규모에 따라 협의</p>
                  </div>
                )}
              </div>

              {/* Features Preview */}
              <div className="space-y-3 mb-6">
                {features.slice(0, 6).map((feature, idx) => {
                  const value = feature[plan.id as keyof PlanFeature];
                  const isIncluded = value === true || (typeof value === 'string' && value !== '');
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        )
                      ) : (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        isIncluded ? "text-slate-300" : "text-slate-600"
                      )}>
                        {feature.name}
                        {typeof value === 'string' && (
                          <span className="text-cyan-400 ml-1">({value})</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              {plan.id === 'enterprise' ? (
                <div className="space-y-3">
                  <Button
                    onClick={onContactSales}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    영업팀 문의하기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onContactSales}
                    className="w-full h-10 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm"
                  >
                    <Server className="w-4 h-4 mr-2" />
                    맞춤형 V-Core 노드 구축 상담
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => onSelectPlan?.(plan.id)}
                  className={cn(
                    "w-full h-12 font-bold",
                    plan.popular 
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  )}
                >
                  {plan.popular ? '지금 시작하기' : '플랜 선택'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* V-Core Premium Feature Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-gradient-to-r from-cyan-900/30 via-blue-900/20 to-purple-900/30 border border-cyan-500/30 p-8 mb-12"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">V-Core 실시간 무결성 모니터링</h3>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-medium">
                  Professional+
                </span>
              </div>
              <p className="text-slate-400 mb-4">
                베이지안 추론 기반의 실시간 데이터 품질 분석으로 신뢰할 수 있는 인사이트를 제공합니다.
                이상치 탐지, 편향 분석, 시계열 무결성 검증을 한 번에 해결하세요.
              </p>
              
              {/* Feature Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-cyan-400">99.9%</p>
                  <p className="text-xs text-slate-500">탐지 정확도</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-emerald-400">&lt;50ms</p>
                  <p className="text-xs text-slate-500">실시간 응답</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-purple-400">24/7</p>
                  <p className="text-xs text-slate-500">상시 모니터링</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-amber-400">ISO</p>
                  <p className="text-xs text-slate-500">규제 준수</p>
                </div>
              </div>

              {/* Mini Chart Visualization */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">데이터 무결성 지수</span>
                  <span className="text-sm font-bold text-emerald-400">98.7%</span>
                </div>
                <div className="h-16 flex items-end gap-1">
                  {[85, 88, 92, 89, 94, 97, 95, 98, 96, 99, 98, 99].map((val, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                  <span>Jan</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Full Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-slate-900/30 border border-slate-700/50 overflow-hidden mb-12"
        >
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-lg font-bold text-white">상세 기능 비교</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">기능</th>
                  <th className="text-center p-4 text-sm font-medium text-slate-400 w-32">Standard</th>
                  <th className="text-center p-4 text-sm font-medium text-cyan-400 w-32 bg-cyan-500/5">Professional</th>
                  <th className="text-center p-4 text-sm font-medium text-amber-400 w-32">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="p-4 text-sm text-slate-300">{feature.name}</td>
                    <td className="p-4 text-center">{getFeatureValue(feature, 'standard')}</td>
                    <td className="p-4 text-center bg-cyan-500/5">{getFeatureValue(feature, 'professional')}</td>
                    <td className="p-4 text-center">{getFeatureValue(feature, 'enterprise')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Security & Compliance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h4 className="text-lg font-bold text-white">글로벌 보안 및 규제 인증</h4>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            법적 리스크 없는 안전한 구독 서비스를 제공합니다
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { name: 'ISO 27001', desc: '정보보안경영시스템' },
              { name: 'ISO 27701', desc: '개인정보보호경영시스템' },
              { name: 'GDPR', desc: 'EU 개인정보보호규정' },
              { name: 'CCPA', desc: '캘리포니아 소비자보호법' },
              { name: 'HIPAA', desc: '의료정보보호법' },
              { name: 'SOC 2', desc: '서비스조직통제' },
            ].map((cert) => (
              <motion.div
                key={cert.name}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{cert.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{cert.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>500+ 기업 고객</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>12개국 서비스</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>99.99% SLA</span>
            </div>
          </div>
        </motion.div>

        {/* Contact Sales CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border border-amber-500/30 text-center"
        >
          <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Enterprise 맞춤 솔루션이 필요하신가요?
          </h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            전담 솔루션 아키텍트가 귀사의 데이터 전략에 최적화된 V-Core 구축을 지원합니다.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={onContactSales}
              className="h-12 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              상담 예약하기
            </Button>
            <Button
              variant="outline"
              className="h-12 px-6 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              제품 소개서 다운로드
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnterpriseSubscriptionView;
