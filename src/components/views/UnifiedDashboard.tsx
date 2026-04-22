import { useState, useEffect, useCallback } from "react";
import { 
  Menu, X, ChevronRight, Activity, Wallet, Clock,
  Building2, Zap, Shield, TrendingUp, CreditCard,
  Database, ShoppingBag, Heart, MapPin, ArrowLeftRight,
  CheckCircle2, Loader2, Lock, ShieldCheck, Link2, Cpu, PiggyBank, Map,
  Sparkles, ArrowRight, Fingerprint, BarChart3, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import RollingNumber from "@/components/animations/RollingNumber";
import PartnerMarketplace from "@/components/marketplace/PartnerMarketplace";

interface UnifiedDashboardProps {
  trustScore?: number;
  vnBalance?: number;
  displayName?: string;
  isVerified?: boolean;
  onStartVerification?: () => void;
  onOpenPortfolio?: () => void;
  onOpenCategoryMonitor?: () => void;
  onOpenAssetOptimization?: () => void;
  onOpenWallet?: () => void;
  onOpenTerminal?: () => void;
  onOpenMyDataUpload?: () => void;
  onOpenPolicyDashboard?: () => void;
  onOpenMasterRoadmap?: () => void;
  onOpenVCoreAnonymization?: () => void;
  onOpenConsumptionReport?: () => void;
  onOpenUnifiedPortfolio?: () => void;
}

// V-Core 검증 프로세스 타입
type VerificationStep = "idle" | "anonymizing" | "validating" | "confirming" | "complete";

// Automatic Pipeline (자동 연결) 데이터 - 기존 API → Automatic Pipeline으로 변경
const autoPipelines = [
  { 
    id: "finance", 
    name: "금융 자동 연결", 
    icon: CreditCard, 
    status: "active", 
    requests: 1247,
    revenue: 324500,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30"
  },
  { 
    id: "retail", 
    name: "유통 자동 연결", 
    icon: ShoppingBag, 
    status: "active", 
    requests: 892,
    revenue: 187200,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30"
  },
  { 
    id: "health", 
    name: "건강 자동 연결", 
    icon: Heart, 
    status: "active", 
    requests: 456,
    revenue: 98700,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30"
  },
  { 
    id: "mobility", 
    name: "동선 자동 연결", 
    icon: MapPin, 
    status: "pending", 
    requests: 0,
    revenue: 0,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30"
  },
];

// 최근 정산 내역 (Asset Income - 자산 소득)
const recentSettlements = [
  { id: 1, company: "삼성카드", category: "금융", amount: 45000, date: "오늘 14:23" },
  { id: 2, company: "롯데마트", category: "유통", amount: 32000, date: "오늘 11:45" },
  { id: 3, company: "삼성생명", category: "건강", amount: 28500, date: "어제 18:30" },
  { id: 4, company: "신한은행", category: "금융", amount: 67000, date: "어제 09:15" },
];

// 기업용 데이터 상품
const enterpriseProducts = [
  { id: 1, name: "소비 패턴 분석", samples: 12500, price: 2500000, quality: 98.5 },
  { id: 2, name: "금융 행동 데이터", samples: 8700, price: 3200000, quality: 97.2 },
  { id: 3, name: "건강 지표 세트", samples: 5400, price: 1800000, quality: 99.1 },
];

// 3단계 메뉴 구조: 수집(연결) - 가공(V-Core) - 수익(연금)
const menuStructure = [
  {
    stage: "수집",
    subtitle: "데이터 연결",
    icon: Link2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    items: [
      { label: "데이터 추가", icon: Database, key: "upload" },
      { label: "카테고리 관제", icon: Activity, key: "category" },
    ]
  },
  {
    stage: "가공",
    subtitle: "V-Core 검증",
    icon: Cpu,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    items: [
      { label: "익명화 엔진", icon: Shield, key: "anonymization" },
      { label: "포트폴리오", icon: Database, key: "portfolio" },
      { label: "종합 포트폴리오", icon: Briefcase, key: "unifiedPortfolio" },
      { label: "가치 최적화", icon: TrendingUp, key: "optimization" },
      { label: "소비 성향 리포트", icon: BarChart3, key: "consumptionReport" },
    ]
  },
  {
    stage: "수익",
    subtitle: "자산 연금",
    icon: PiggyBank,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    items: [
      { label: "지갑", icon: Wallet, key: "wallet" },
      { label: "프로 터미널", icon: Zap, key: "terminal" },
      { label: "마스터 로드맵", icon: Map, key: "roadmap" },
    ]
  }
];

const UnifiedDashboard = ({
  trustScore = 72,
  vnBalance = 1250,
  displayName = "사용자",
  isVerified = false,
  onStartVerification,
  onOpenPortfolio,
  onOpenCategoryMonitor,
  onOpenAssetOptimization,
  onOpenWallet,
  onOpenTerminal,
  onOpenMyDataUpload,
  onOpenPolicyDashboard,
  onOpenMasterRoadmap,
  onOpenVCoreAnonymization,
  onOpenConsumptionReport,
  onOpenUnifiedPortfolio,
}: UnifiedDashboardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"individual" | "enterprise">("individual");
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("idle");
  const [totalAssetValue, setTotalAssetValue] = useState(2847320);
  const [missedIncome, setMissedIncome] = useState(0);
  const [securityScanning, setSecurityScanning] = useState(false);
  
  // 스와이프 제스처
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(59, 130, 246, 0.1)", "rgba(0, 0, 0, 0)", "rgba(16, 185, 129, 0.1)"]
  );

  // 실시간 자산 가치 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalAssetValue(prev => prev + Math.floor(Math.random() * 100 - 30));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 놓치고 있는 수익 실시간 카운터 (상실 회피 심리)
  useEffect(() => {
    const interval = setInterval(() => {
      setMissedIncome(prev => prev + Math.floor(Math.random() * 15 + 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 보안 스캔 애니메이션
  const triggerSecurityScan = useCallback(() => {
    setSecurityScanning(true);
    setTimeout(() => setSecurityScanning(false), 3000);
  }, []);

  // V-Core 검증 시뮬레이션
  const runVerification = useCallback(() => {
    triggerSecurityScan();
    setVerificationStep("anonymizing");
    setTimeout(() => setVerificationStep("validating"), 1500);
    setTimeout(() => setVerificationStep("confirming"), 3000);
    setTimeout(() => setVerificationStep("complete"), 4500);
    setTimeout(() => setVerificationStep("idle"), 6000);
  }, [triggerSecurityScan]);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) {
      setMode("enterprise");
    } else if (info.offset.x > 100) {
      setMode("individual");
    }
  };

  const getStepLabel = () => {
    switch (verificationStep) {
      case "anonymizing": return "1단계: 익명화 처리 중...";
      case "validating": return "2단계: 통계적 유의성 확인 중...";
      case "confirming": return "3단계: 가치 확정 중...";
      case "complete": return "검증 완료";
      default: return "대기 중";
    }
  };

  const handleMenuAction = (key: string) => {
    switch (key) {
      case "upload": onOpenMyDataUpload?.(); break;
      case "category": onOpenCategoryMonitor?.(); break;
      case "anonymization": onOpenVCoreAnonymization?.(); break;
      case "portfolio": onOpenPortfolio?.(); break;
      case "unifiedPortfolio": onOpenUnifiedPortfolio?.(); break;
      case "optimization": onOpenAssetOptimization?.(); break;
      case "consumptionReport": onOpenConsumptionReport?.(); break;
      case "wallet": onOpenWallet?.(); break;
      case "terminal": onOpenTerminal?.(); break;
      case "roadmap": onOpenMasterRoadmap?.(); break;
    }
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Military-Grade Security Status Bar */}
      <motion.div 
        className={`px-4 py-2 flex items-center justify-center gap-2 ${
          securityScanning 
            ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-[length:200%_100%]" 
            : "bg-slate-900"
        }`}
        animate={securityScanning ? {
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        } : {}}
        transition={{ duration: 2, repeat: securityScanning ? Infinity : 0 }}
      >
        <motion.div
          animate={securityScanning ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2, repeat: securityScanning ? Infinity : 0, ease: "linear" }}
        >
          <ShieldCheck className={`w-4 h-4 ${securityScanning ? "text-white" : "text-emerald-400"}`} />
        </motion.div>
        <span className={`text-xs font-medium ${securityScanning ? "text-white" : "text-emerald-400"}`}>
          {securityScanning ? "Security Scan in Progress..." : "Military-Grade Encryption Active"}
        </span>
        {!securityScanning && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </motion.div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(true)} className="p-2 -ml-2 hover:bg-slate-50 rounded-xl">
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">VeriNode</p>
              <h1 className="text-sm font-bold text-slate-900">{displayName}님</h1>
            </div>
          </div>
          
          {/* 모드 전환 표시 */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${mode === "individual" ? "text-emerald-600" : "text-slate-400"}`}>
              개인
            </span>
            <button 
              onClick={() => setMode(mode === "individual" ? "enterprise" : "individual")}
              className={`w-12 h-6 rounded-full transition-colors ${
                mode === "individual" ? "bg-emerald-500" : "bg-blue-500"
              }`}
            >
              <motion.div 
                className="w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ x: mode === "individual" ? 2 : 26 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-xs font-medium ${mode === "enterprise" ? "text-blue-600" : "text-slate-400"}`}>
              기업
            </span>
          </div>
        </div>
      </header>

      {/* 햄버거 메뉴 - 3단계 구조 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl"
            >
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900">메뉴</h2>
                  <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold">{displayName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500">V-Core: {trustScore}점</p>
                  </div>
                </div>
              </div>
              
              {/* 3단계 구조 메뉴 */}
              <nav className="p-4 space-y-4">
                {menuStructure.map((stage) => (
                  <div key={stage.stage}>
                    <div className={`flex items-center gap-2 px-2 py-1.5 ${stage.bgColor} rounded-lg mb-2`}>
                      <stage.icon className={`w-4 h-4 ${stage.color}`} />
                      <span className={`text-xs font-bold ${stage.color}`}>{stage.stage}</span>
                      <span className="text-[10px] text-slate-500">• {stage.subtitle}</span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {stage.items.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => handleMenuAction(item.key)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                        >
                          <item.icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 개인 모드 */}
      <AnimatePresence mode="wait">
        {mode === "individual" ? (
          <motion.div
            key="individual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ background }}
            className="pb-8"
          >
            {/* 미인증 사용자 인증 CTA 배너 */}
            {!isVerified && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mt-4 p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden relative"
              >
                {/* 배경 패턴 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Fingerprint className="w-5 h-5 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white mb-1">
                        실제 존재 증명이 필요합니다
                      </h3>
                      <p className="text-xs text-white/80 mb-3">
                        AI가 당신의 신뢰도를 검증합니다. 인증 완료 시 더 높은 보상과 프리미엄 설문 참여 기회!
                      </p>
                      <Button
                        onClick={onStartVerification}
                        className="w-full bg-white hover:bg-white/90 text-indigo-600 font-semibold text-sm h-10 rounded-xl shadow-md"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        지금 인증하기
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 하단 통계 */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                    <div className="text-center">
                      <p className="text-[10px] text-white/60">평균 소요시간</p>
                      <p className="text-xs font-bold text-white">3분</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/60">첫 인증 보상</p>
                      <p className="text-xs font-bold text-emerald-300">+100 VN</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/60">수익 증가</p>
                      <p className="text-xs font-bold text-amber-300">+35%</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 놓치고 있는 수익 카운터 - 상실 회피 심리 */}
            <motion.div 
              className="mx-4 mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">지금 이 순간 놓치고 있는 예상 수익</span>
                </div>
                <motion.span 
                  className="text-sm font-bold text-amber-600"
                  key={missedIncome}
                  initial={{ scale: 1.2, color: "#dc2626" }}
                  animate={{ scale: 1, color: "#d97706" }}
                  transition={{ duration: 0.3 }}
                >
                  +₩{missedIncome.toLocaleString()}
                </motion.span>
              </div>
              <p className="text-[10px] text-amber-600 mt-1">
                연결되지 않은 데이터에서 발생 중 • 지금 연결하면 수익 시작
              </p>
            </motion.div>

            {/* 실시간 데이터 자산 가치 */}
            <section className="px-4 py-6">
              <div className="text-center mb-6">
                <p className="text-xs text-slate-500 mb-1">실시간 데이터 자산 가치</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold text-slate-900">₩</span>
                  <RollingNumber 
                    value={totalAssetValue} 
                    className="text-3xl font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +12.4% 이번 달
                  </span>
                  <span className="text-xs text-slate-400">실시간 갱신</span>
                </div>
              </div>

              {/* V-Core 검증 프로세스 */}
              <motion.div 
                className="bg-slate-50 rounded-2xl p-4 mb-4"
                animate={verificationStep !== "idle" ? { 
                  borderColor: "rgba(59, 130, 246, 0.5)",
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.1)"
                } : {}}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">V-Core Integrity Check</span>
                  </div>
                  {verificationStep === "idle" ? (
                    <button 
                      onClick={runVerification}
                      className="text-xs text-blue-600 font-medium"
                    >
                      검증 시작
                    </button>
                  ) : verificationStep === "complete" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                </div>

                {/* 단계별 프로그레스 */}
                <div className="space-y-2 mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex-1">
                        <div className={`h-1.5 rounded-full transition-colors ${
                          (verificationStep === "anonymizing" && step === 1) ||
                          (verificationStep === "validating" && step <= 2) ||
                          (verificationStep === "confirming" && step <= 3) ||
                          verificationStep === "complete"
                            ? "bg-blue-500"
                            : "bg-slate-200"
                        }`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className={verificationStep !== "idle" ? "text-blue-600" : ""}>익명화</span>
                    <span className={["validating", "confirming", "complete"].includes(verificationStep) ? "text-blue-600" : ""}>통계 검증</span>
                    <span className={["confirming", "complete"].includes(verificationStep) ? "text-blue-600" : ""}>가치 확정</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 text-center">
                  {getStepLabel()}
                </p>
              </motion.div>

              {/* 종합 포트폴리오 진입 카드 */}
              {isVerified && onOpenUnifiedPortfolio && (
                <motion.button
                  onClick={onOpenUnifiedPortfolio}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl mb-4 shadow-md active:scale-[0.98] transition-transform"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">종합 데이터 포트폴리오</p>
                        <p className="text-xs opacity-80">금융 + 정부 마이데이터 통합 분석</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-80" />
                  </div>
                </motion.button>
              )}
            </section>

            {/* Automatic Pipeline (자동 연결) */}
            <section className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Automatic Pipeline</h2>
                <span className="text-xs text-slate-500">4개 자동 연결</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {autoPipelines.map((pipeline) => (
                  <motion.div
                    key={pipeline.id}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border ${pipeline.borderColor} ${pipeline.bgColor}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <pipeline.icon className={`w-4 h-4 ${pipeline.color}`} />
                      <span className="text-xs font-medium text-slate-900">{pipeline.name}</span>
                      {pipeline.status === "active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    {pipeline.status === "active" ? (
                      <>
                        <p className="text-lg font-bold text-slate-900">
                          ₩{pipeline.revenue.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {pipeline.requests.toLocaleString()} 연결/일
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">연결 대기 중</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Asset Income (자산 소득) - 최근 정산 내역 */}
            <section className="px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Asset Income</h2>
                <button className="text-xs text-blue-600 font-medium">전체 보기</button>
              </div>
              
              <div className="space-y-2">
                {recentSettlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{settlement.company}</p>
                        <p className="text-[10px] text-slate-500">{settlement.category} • {settlement.date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">+₩{settlement.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Phase 3: Partner Marketplace */}
            <section className="px-4 mt-6">
              <PartnerMarketplace />
            </section>

            {/* 스와이프 힌트 */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center">
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ArrowLeftRight className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-500">스와이프하여 기업 모드 전환</span>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* 기업 모드 */
          <motion.div
            key="enterprise"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ background }}
            className="pb-8"
          >
            {/* 기업 모드 헤더 */}
            <section className="px-4 py-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-900">기업용 데이터 마켓플레이스</span>
                </div>
                <Button
                  size="sm"
                  onClick={onOpenPolicyDashboard}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono"
                >
                  정책 대시보드
                </Button>
              </div>
              <p className="text-xs text-slate-600">
                AI 검증된 고품질 데이터를 안전하게 구매하세요
              </p>
            </section>

            {/* 데이터 상품 카드 */}
            <section className="px-4 py-4">
              <h2 className="text-sm font-bold text-slate-900 mb-3">추천 데이터 상품</h2>
              
              <div className="space-y-3">
                {enterpriseProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {product.samples.toLocaleString()} 샘플 • 품질 {product.quality}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] text-emerald-700 font-medium">V-Core 검증</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">가격</p>
                        <p className="text-lg font-bold text-slate-900">
                          ₩{product.price.toLocaleString()}
                        </p>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                        구매하기
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 보안 배지 */}
            <section className="px-4 py-4">
              <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600">차등 프라이버시</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600">익명화 보장</span>
                </div>
              </div>
            </section>

            {/* 스와이프 힌트 */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center">
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ArrowLeftRight className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">스와이프하여 개인 모드 전환</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedDashboard;
