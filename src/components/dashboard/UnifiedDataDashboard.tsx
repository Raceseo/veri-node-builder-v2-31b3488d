/**
 * UnifiedDataDashboard - 통합 데이터 대시보드
 * 
 * 기존 14개 대시보드를 통합한 단일 컴포넌트:
 * - IndividualDashboard, UnifiedDashboard, DataAssetDashboard 등의 기능 통합
 * - mode prop으로 표시 모드 전환 (simple, detailed, asset)
 * 
 * 사용법:
 * <UnifiedDataDashboard mode="simple" />
 * <UnifiedDataDashboard mode="detailed" />
 * <UnifiedDataDashboard mode="asset" onOpenPortfolio={...} />
 */
import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, Wallet, Shield, ChevronRight, Sparkles, 
  Activity, RefreshCw, Zap, BarChart3, Clock, Crown,
  Gift, Calendar, Heart, Building2, Briefcase, ShoppingBag,
  Car, GraduationCap, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import RollingNumber from "@/components/animations/RollingNumber";
import { cn } from "@/lib/utils";
import { useProfileContext } from "@/contexts/ProfileContext";

type DashboardMode = "simple" | "detailed" | "asset";

interface DataCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  monthlyValue: number;
  connected: boolean;
  lastSync: string;
  healthScore: number;
}

interface UnifiedDataDashboardProps {
  mode?: DashboardMode;
  onOpenWallet?: () => void;
  onOpenPortfolio?: () => void;
  onOpenSurvey?: () => void;
  onOpenMyDataUpload?: () => void;
  onOpenTerminal?: () => void;
  onOpenCategoryMonitor?: () => void;
  onOpenAssetOptimization?: () => void;
  onBack?: () => void;
}

// Chart data generation
const generateChartData = (baseValue: number, decayed: boolean) => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const value = decayed 
      ? baseValue * Math.max(0.5, 1 - (23 - i) * 0.02) + Math.random() * 50 - 25
      : baseValue + Math.random() * 100 - 50;
    data.push({ time: `${i}:00`, value: Math.max(0, Math.round(value)) });
  }
  return data;
};

// Initial categories
const initialCategories: DataCategory[] = [
  { id: "finance", name: "금융 데이터", icon: Building2, color: "text-emerald-400", bgColor: "from-emerald-500/20 to-teal-500/20", monthlyValue: 12000, connected: true, lastSync: "방금 전", healthScore: 95 },
  { id: "health", name: "건강 데이터", icon: Heart, color: "text-rose-400", bgColor: "from-rose-500/20 to-pink-500/20", monthlyValue: 18000, connected: true, lastSync: "1시간 전", healthScore: 88 },
  { id: "career", name: "직무 데이터", icon: Briefcase, color: "text-blue-400", bgColor: "from-blue-500/20 to-indigo-500/20", monthlyValue: 15000, connected: true, lastSync: "3시간 전", healthScore: 72 },
  { id: "shopping", name: "소비 데이터", icon: ShoppingBag, color: "text-amber-400", bgColor: "from-amber-500/20 to-orange-500/20", monthlyValue: 8000, connected: false, lastSync: "연결 안됨", healthScore: 0 },
  { id: "mobility", name: "이동 데이터", icon: Car, color: "text-violet-400", bgColor: "from-violet-500/20 to-purple-500/20", monthlyValue: 6000, connected: false, lastSync: "연결 안됨", healthScore: 0 },
  { id: "education", name: "학습 데이터", icon: GraduationCap, color: "text-cyan-400", bgColor: "from-cyan-500/20 to-sky-500/20", monthlyValue: 5000, connected: true, lastSync: "어제", healthScore: 65 },
];

const UnifiedDataDashboard = ({
  mode = "simple",
  onOpenWallet,
  onOpenPortfolio,
  onOpenSurvey,
  onOpenMyDataUpload,
  onOpenTerminal,
  onOpenCategoryMonitor,
  onOpenAssetOptimization,
  onBack,
}: UnifiedDataDashboardProps) => {
  const { trustScore, vnBalance, displayName } = useProfileContext();
  
  const [dataFreshness, setDataFreshness] = useState(68);
  const [assetValue, setAssetValue] = useState(2847);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartData, setChartData] = useState(() => generateChartData(2847, true));
  const [showBayesianEffect, setShowBayesianEffect] = useState(false);
  const [categories, setCategories] = useState<DataCategory[]>(initialCategories);

  // Real-time value decay simulation
  useEffect(() => {
    if (mode !== "simple") {
      const interval = setInterval(() => {
        if (!isRefreshing && dataFreshness > 30) {
          setDataFreshness(prev => Math.max(30, prev - 0.5));
          setAssetValue(prev => Math.max(prev * 0.998, 1500));
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRefreshing, dataFreshness, mode]);

  // Bayesian Update Animation
  const handleBayesianRefresh = useCallback(() => {
    setIsRefreshing(true);
    setShowBayesianEffect(true);

    setTimeout(() => setDataFreshness(85), 500);
    setTimeout(() => setDataFreshness(95), 1000);
    setTimeout(() => {
      const newValue = Math.round(assetValue * 1.5);
      setAssetValue(newValue);
      setChartData(generateChartData(newValue, false));
      setDataFreshness(100);
    }, 1500);
    setTimeout(() => {
      setIsRefreshing(false);
      setShowBayesianEffect(false);
    }, 2500);
  }, [assetValue]);

  const getFreshnessColor = () => {
    if (dataFreshness >= 80) return "text-emerald-400";
    if (dataFreshness >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getChartColor = () => {
    if (dataFreshness >= 80) return "#10b981";
    if (dataFreshness >= 50) return "#f59e0b";
    return "#f43f5e";
  };

  // Asset mode calculations
  const connectedCategories = categories.filter(c => c.connected);
  const totalMonthlyValue = connectedCategories.reduce((sum, c) => sum + c.monthlyValue, 0);
  const totalAssetValue = totalMonthlyValue * 12 * 3;
  const tier = totalMonthlyValue >= 50000 ? "Diamond" : totalMonthlyValue >= 40000 ? "Platinum" : totalMonthlyValue >= 30000 ? "Gold" : "Silver";
  const tierColor = tier === "Diamond" ? "from-cyan-300 via-blue-400 to-purple-500" : tier === "Platinum" ? "from-slate-300 to-slate-100" : tier === "Gold" ? "from-amber-400 to-yellow-300" : "from-slate-400 to-slate-300";

  const handleToggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(c => 
      c.id === categoryId 
        ? { ...c, connected: !c.connected, lastSync: c.connected ? "연결 안됨" : "방금 전", healthScore: c.connected ? 0 : 100 } 
        : c
    ));
  };

  // ============ SIMPLE MODE ============
  if (mode === "simple") {
    return (
      <div className="space-y-4">
        {/* Trust Score Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">V-Core 신뢰지수</span>
            </div>
            <span className="text-2xl font-bold text-primary">{trustScore}</span>
          </div>
          <Progress value={trustScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            상위 {Math.max(1, 100 - trustScore)}% 신뢰 등급
          </p>
        </div>

        {/* Balance Card */}
        <div 
          className="bg-gradient-primary rounded-2xl p-5 cursor-pointer"
          onClick={onOpenWallet}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs">보유 잔액</p>
                <p className="text-xl font-bold text-white">
                  <RollingNumber value={vnBalance} suffix=" VN" />
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={onOpenMyDataUpload}
            className="bg-card rounded-xl p-3 border border-border hover:border-primary/50 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">데이터 추가</p>
          </button>
          <button 
            onClick={onOpenSurvey}
            className="bg-card rounded-xl p-3 border border-border hover:border-primary/50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">설문 참여</p>
          </button>
          <button 
            onClick={onOpenPortfolio}
            className="bg-card rounded-xl p-3 border border-border hover:border-primary/50 transition-colors"
          >
            <Activity className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">포트폴리오</p>
          </button>
        </div>
      </div>
    );
  }

  // ============ DETAILED MODE ============
  if (mode === "detailed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 pt-10 pb-6 border-b border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-500 text-xs font-mono">INDIVIDUAL TERMINAL</p>
              <h1 className="text-xl font-bold text-white">{displayName} <span className="text-slate-500 font-normal">님</span></h1>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          {/* Trust Score */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-xs">V-Core 신뢰지수</span>
                <span className="text-cyan-400 font-bold text-lg font-mono">{trustScore}</span>
              </div>
              <Progress value={trustScore} className="h-1.5 bg-slate-800" />
            </div>
            <div className="text-right">
              <span className="text-emerald-400 text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />+5
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Asset Chart */}
        <div className="px-4 pt-4">
          <motion.div 
            className={cn(
              "rounded-2xl p-4 border transition-all duration-500",
              showBayesianEffect 
                ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50" 
                : "bg-slate-900/50 border-slate-700/50"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">실시간 자산 가치</span>
                <span className="text-[10px] text-cyan-400 animate-pulse font-mono">LIVE</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-mono">
                  <RollingNumber 
                    value={assetValue} 
                    className={showBayesianEffect ? "text-cyan-400" : "text-white"}
                    suffix=" VP"
                  />
                </p>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="h-24 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getChartColor()} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={getChartColor()} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={getChartColor()} 
                    strokeWidth={2}
                    fill="url(#valueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Freshness Warning */}
            <AnimatePresence>
              {dataFreshness < 70 && !isRefreshing && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 mb-3"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <div className="flex-1">
                    <p className="text-xs text-rose-400 font-medium">
                      데이터 신선도가 {Math.round(100 - dataFreshness)}% 하락했습니다
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Freshness Gauge */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">데이터 신선도</span>
                  <span className={cn("text-xs font-bold font-mono", getFreshnessColor())}>
                    {Math.round(dataFreshness)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getChartColor() }}
                    animate={{ width: `${dataFreshness}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Bayesian Refresh Button */}
            <Button
              onClick={handleBayesianRefresh}
              disabled={isRefreshing}
              className={cn(
                "w-full h-12 font-bold text-sm transition-all",
                isRefreshing
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              )}
            >
              {isRefreshing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                  </motion.div>
                  Bayesian Update 진행 중...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  마이데이터로 가치 갱신하기
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* VN Balance Card */}
        <div className="px-4 pt-4">
          <motion.div 
            className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4"
            onClick={onOpenWallet}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">누적 보상</p>
                  <p className="text-xl font-bold text-white font-mono">
                    <RollingNumber value={vnBalance} suffix=" VN" />
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pt-4 grid grid-cols-3 gap-3">
          <button 
            onClick={onOpenTerminal}
            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-emerald-500/30"
          >
            <Activity className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-white font-medium">프로 터미널</p>
          </button>
          <button 
            onClick={onOpenCategoryMonitor}
            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-amber-500/30"
          >
            <BarChart3 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-xs text-white font-medium">카테고리 관제</p>
          </button>
          <button 
            onClick={onOpenAssetOptimization}
            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-cyan-500/30"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-xs text-white font-medium">가치 최적화</p>
          </button>
        </div>
      </div>
    );
  }

  // ============ ASSET MODE ============
  return (
    <div className="bg-slate-900 min-h-full pb-24">
      {/* Header */}
      {onBack && (
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-slate-900/90 backdrop-blur-xl border-b border-indigo-500/20">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:text-indigo-400">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-white">데이터 자산 대시보드</h1>
        </header>
      )}
      
      <div className="px-4 py-6 space-y-6">
        {/* Asset Value Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 border border-indigo-500/30">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="relative">
            {/* Tier Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" />
                <span className="text-indigo-300 text-sm font-medium">현재 나의 데이터 자산 가치</span>
              </div>
              <div className={cn(
                "px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10 bg-gradient-to-r",
                tierColor
              )}>
                <Crown className="w-4 h-4 text-slate-900" />
                <span className="text-slate-900 font-bold text-sm">{tier}</span>
              </div>
            </div>
            
            {/* Asset Value */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-bold text-white tracking-tight">
                ₩{totalAssetValue.toLocaleString()}
              </span>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-indigo-500/20">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{connectedCategories.length}</p>
                <p className="text-xs text-slate-500">연동 데이터</p>
              </div>
              <div className="text-center border-x border-indigo-500/20">
                <p className="text-2xl font-bold text-emerald-400">₩{totalMonthlyValue.toLocaleString()}</p>
                <p className="text-xs text-slate-500">월 예상 수익</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{trustScore}</p>
                <p className="text-xs text-slate-500">신뢰 점수</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Pension Center */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 to-slate-900/80 border border-emerald-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">데이터 연금 센터</h2>
              <p className="text-xs text-emerald-400/70">Data Pension Center</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-emerald-400 text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              실시간
            </div>
          </div>

          {/* Progress */}
          <div className="bg-slate-900/60 rounded-xl p-4 mb-4 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">이번 달 누적 연금</span>
              <span className="text-xs text-amber-400 animate-pulse">● 누적 중</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-emerald-400">
                ₩{Math.round(totalMonthlyValue * 0.65).toLocaleString()}
              </span>
              <span className="text-slate-500 text-sm">/ ₩{totalMonthlyValue.toLocaleString()} 예상</span>
            </div>
            <Progress value={65} className="h-2 bg-slate-800" />
          </div>

          {/* Connected Categories */}
          <div className="space-y-2">
            {connectedCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="flex items-center gap-3 bg-slate-900/40 rounded-xl px-4 py-3 border border-emerald-500/10">
                  <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center", category.bgColor)}>
                    <Icon className={cn("w-4 h-4", category.color)} />
                  </div>
                  <div className="flex-1">
                    <span className="text-white text-sm font-medium">{category.name}</span>
                    <span className="ml-2 text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">임대 중</span>
                  </div>
                  <span className="text-amber-400 font-bold">+₩{category.monthlyValue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          {/* Next Payout */}
          <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-emerald-900/30 via-amber-900/20 to-emerald-900/30 rounded-xl border border-emerald-500/20 mt-4">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span className="text-white">다음 데이터 정산일:</span>
            <span className="text-xl font-bold text-amber-400">12월 25일</span>
            <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full">D-5</span>
          </div>
        </div>

        {/* Data Dividend Center */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900/80 border border-amber-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">데이터 배당 센터</h2>
              <p className="text-xs text-amber-400/70">Data Dividend Center</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-r from-amber-900/30 via-yellow-900/20 to-amber-900/30 rounded-xl p-5 border border-amber-500/30">
            <p className="text-amber-300/80 text-sm mb-2">예상 배당금</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-amber-400">
                ₩{Math.round(totalMonthlyValue * 0.15).toLocaleString()}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>배당 충전 진행률</span>
                <span>78%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[78%] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-xl">
              <span className="text-slate-300 text-sm">배당 지급 예정일</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">2024년 12월 31일</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">D-11</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Control Center */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            <h2 className="text-lg font-bold text-white">데이터 통제 센터</h2>
          </div>

          <div className="space-y-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const health = category.healthScore;
              const healthStatus = health >= 90 ? "최상" : health >= 70 ? "양호" : health >= 50 ? "업데이트 권장" : "연결 필요";
              
              return (
                <div 
                  key={category.id}
                  className={cn(
                    "rounded-2xl p-4 border transition-all",
                    category.connected 
                      ? "bg-slate-800/50 border-slate-700/50" 
                      : "bg-slate-900/30 border-slate-800/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", category.bgColor)}>
                      <Icon className={cn("w-6 h-6", category.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{category.name}</span>
                        {category.connected && (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {healthStatus}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{category.lastSync}</span>
                        {category.connected && (
                          <span className="text-xs text-amber-400 ml-2">
                            +₩{category.monthlyValue.toLocaleString()}/월
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={category.connected}
                      onCheckedChange={() => handleToggleCategory(category.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDataDashboard;
