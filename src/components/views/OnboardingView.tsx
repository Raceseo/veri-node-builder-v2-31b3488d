import { useState, useEffect } from "react";
import { Settings, Shield, Brain, Crown, Zap, ChevronRight, ShieldCheck, ShieldAlert, Droplets, Upload } from "lucide-react";
import DataAssetDashboard from "@/components/views/DataAssetDashboard";
import UrgentDataCallModal from "@/components/modals/UrgentDataCallModal";
import { cn } from "@/lib/utils";

interface OnboardingViewProps {
  onVerificationComplete: (amount: number) => void;
  onOpenDataCustomization?: () => void;
  onOpenPrivateVault?: () => void;
  onOpenPersonaAnalysis?: () => void;
  onOpenMembership?: () => void;
  onOpenCleanRoom?: () => void;
  onOpenAntiCherryPicker?: () => void;
  onOpenDataTrust?: () => void;
  onOpenMyDataUpload?: () => void;
}

const OnboardingView = ({ 
  onVerificationComplete, 
  onOpenDataCustomization, 
  onOpenPrivateVault, 
  onOpenPersonaAnalysis, 
  onOpenMembership,
  onOpenCleanRoom,
  onOpenAntiCherryPicker,
  onOpenDataTrust,
  onOpenMyDataUpload
}: OnboardingViewProps) => {
  const [showUrgentCall, setShowUrgentCall] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowUrgentCall(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleParticipate = () => {
    setShowUrgentCall(false);
    onVerificationComplete(4000);
  };

  const menuItems = [
    {
      title: "데이터 커스터마이징",
      description: "정보 제공 설정으로 수익 극대화",
      icon: Settings,
      iconBg: "bg-gold/10",
      iconColor: "text-gold",
      onClick: onOpenDataCustomization,
    },
    {
      title: "Private Vault",
      description: "시크릿 금고 · 3X 보상",
      icon: Shield,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      badge: "Premium",
      badgeColor: "bg-success/10 text-success",
      onClick: onOpenPrivateVault,
    },
    {
      title: "My Digital Twin",
      description: "AI 페르소나 분석",
      icon: Brain,
      iconBg: "bg-trust/10",
      iconColor: "text-trust",
      badge: "AI",
      badgeColor: "bg-trust/10 text-trust",
      onClick: onOpenPersonaAnalysis,
    },
    {
      title: "데이터 구독 멤버십",
      description: "최대 5배 보상 받기",
      icon: Crown,
      iconBg: "bg-gold/10",
      iconColor: "text-gold",
      badge: "PRO",
      badgeColor: "bg-gold/10 text-gold-dark",
      onClick: onOpenMembership,
    },
    {
      title: "마이데이터 업로드",
      description: "1초 만에 데이터 연동 · 2배 보상",
      icon: Upload,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: "빠름",
      badgeColor: "bg-primary/10 text-primary",
      onClick: onOpenMyDataUpload,
    },
    {
      title: "데이터 신뢰 대시보드",
      description: "오늘의 순도 지수 · 무결성 리포트",
      icon: Droplets,
      iconBg: "bg-trust/10",
      iconColor: "text-trust",
      badge: "NEW",
      badgeColor: "bg-trust/10 text-trust",
      onClick: onOpenDataTrust,
    },
    {
      title: "데이터 클린룸",
      description: "Purity Score 확인 · 검증 현황",
      icon: ShieldCheck,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      onClick: onOpenCleanRoom,
    },
    {
      title: "정직한 응답 설문",
      description: "AI 신뢰 검증 · 50 VN",
      icon: ShieldAlert,
      iconBg: "bg-trust/10",
      iconColor: "text-trust",
      badge: "안전",
      badgeColor: "bg-trust/10 text-trust",
      onClick: onOpenAntiCherryPicker,
    },
  ];

  return (
    <div className="min-h-full">
      {/* Data Asset Dashboard */}
      <DataAssetDashboard />

      {/* Quick Access Buttons */}
      <div className="px-4 pb-6 space-y-3">
        {/* Urgent Survey Banner */}
        <button
          onClick={() => setShowUrgentCall(true)}
          className="w-full bg-primary rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-primary-foreground flex items-center gap-2">
                🚨 골든 타임 설문 진행 중
              </h3>
              <p className="text-sm text-primary-foreground/70">보상 2배 + 등급 점수 3배 증정!</p>
            </div>
            <span className="px-3 py-1.5 bg-gold rounded-full text-xs text-primary font-bold animate-bounce">
              2X
            </span>
          </div>
        </button>

        {/* Menu Items */}
        {menuItems.map((item, index) => item.onClick && (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full bg-card rounded-2xl p-4 border border-border shadow-card hover:shadow-lg hover:border-primary/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", item.iconBg)}>
                <item.icon className={cn("w-6 h-6", item.iconColor)} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {item.badge ? (
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", item.badgeColor)}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Urgent Data Call Modal */}
      <UrgentDataCallModal
        isOpen={showUrgentCall}
        onClose={() => setShowUrgentCall(false)}
        onParticipate={handleParticipate}
      />
    </div>
  );
};

export default OnboardingView;