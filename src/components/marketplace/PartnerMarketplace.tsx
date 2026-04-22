import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, CheckCircle2, Clock, Eye, TrendingUp, 
  Sparkles, ChevronRight, Shield
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logo: string;
  industry: string;
  status: "matched" | "reviewing" | "interested";
  matchRate: number;
  estimatedValue: number;
  dataTypes: string[];
}

const partners: Partner[] = [
  {
    id: "samsung-fire",
    name: "삼성화재",
    logo: "🏢",
    industry: "보험",
    status: "matched",
    matchRate: 98,
    estimatedValue: 45000,
    dataTypes: ["건강", "금융"]
  },
  {
    id: "google-health",
    name: "Google Health",
    logo: "🔴",
    industry: "헬스케어",
    status: "reviewing",
    matchRate: 87,
    estimatedValue: 38000,
    dataTypes: ["건강", "이동"]
  },
  {
    id: "hyundai-motor",
    name: "현대자동차",
    logo: "🚗",
    industry: "모빌리티",
    status: "interested",
    matchRate: 72,
    estimatedValue: 28000,
    dataTypes: ["이동", "소비"]
  },
  {
    id: "kakao-bank",
    name: "카카오뱅크",
    logo: "💳",
    industry: "금융",
    status: "matched",
    matchRate: 95,
    estimatedValue: 52000,
    dataTypes: ["금융", "소비"]
  },
  {
    id: "naver-cloud",
    name: "네이버클라우드",
    logo: "🟢",
    industry: "테크",
    status: "reviewing",
    matchRate: 81,
    estimatedValue: 33000,
    dataTypes: ["소비", "금융"]
  },
];

const statusConfig = {
  matched: {
    label: "매칭 완료",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  reviewing: {
    label: "조회 중",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Eye,
  },
  interested: {
    label: "관심 표명",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
};

interface PartnerMarketplaceProps {
  estimatedMonthlyPension?: number;
}

const PartnerMarketplace = ({ estimatedMonthlyPension = 0 }: PartnerMarketplaceProps) => {
  const [activePartners, setActivePartners] = useState(partners);
  const [totalMatched, setTotalMatched] = useState(0);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    const matched = activePartners.filter(p => p.status === "matched").length;
    setTotalMatched(matched);
  }, [activePartners]);

  // 실시간 상태 변화 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePartners(prev => {
        const reviewing = prev.filter(p => p.status === "reviewing");
        if (reviewing.length > 0 && Math.random() > 0.7) {
          const randomPartner = reviewing[Math.floor(Math.random() * reviewing.length)];
          setAnimatingId(randomPartner.id);
          setTimeout(() => setAnimatingId(null), 2000);
          
          return prev.map(p => 
            p.id === randomPartner.id 
              ? { ...p, status: "matched" as const, matchRate: Math.min(p.matchRate + 5, 100) }
              : p
          );
        }
        return prev;
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const totalPotentialValue = activePartners.reduce((sum, p) => sum + p.estimatedValue, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">나의 데이터를 원하는 파트너사</h2>
        </div>
        <span className="text-xs text-muted-foreground">{totalMatched}개 매칭</span>
      </div>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl p-4 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">예상 월 데이터 연금</span>
          </div>
          <Shield className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary">
            ₩{(estimatedMonthlyPension || totalPotentialValue * 0.03).toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">/월</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {activePartners.length}개 파트너사 관심 · 총 예상 가치 ₩{totalPotentialValue.toLocaleString()}
        </p>
      </motion.div>

      {/* Partner List */}
      <div className="space-y-3">
        {activePartners.map((partner, index) => {
          const config = statusConfig[partner.status];
          const StatusIcon = config.icon;
          const isAnimating = animatingId === partner.id;

          return (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: isAnimating ? [1, 1.02, 1] : 1,
                boxShadow: isAnimating 
                  ? ["0 0 0 0 rgba(34, 197, 94, 0)", "0 0 20px 5px rgba(34, 197, 94, 0.3)", "0 0 0 0 rgba(34, 197, 94, 0)"]
                  : "none"
              }}
              transition={{ delay: index * 0.1, duration: isAnimating ? 0.5 : 0.3 }}
              className={`bg-card rounded-xl p-4 border transition-all ${
                isAnimating ? "border-emerald-400" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                  {partner.logo}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{partner.name}</h3>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {partner.industry}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      매칭률 {partner.matchRate}%
                    </span>
                  </div>

                  {/* Data Types */}
                  <div className="flex items-center gap-1 mt-2">
                    {partner.dataTypes.map(type => (
                      <span key={type} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">
                    +₩{partner.estimatedValue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/월 예상</p>
                </div>
              </div>

              {/* Match Animation */}
              <AnimatePresence>
                {isAnimating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-emerald-200"
                  >
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">매칭이 완료되었습니다!</span>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <button className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
        <TrendingUp className="w-4 h-4" />
        더 많은 파트너 찾기
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PartnerMarketplace;
