import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  TrendingUp, TrendingDown, RefreshCw, Clock, Hourglass,
  Zap, Shield, Target, ChevronUp, Activity, AlertTriangle,
  Sparkles, ArrowUpRight, BarChart3, Timer, Sliders,
  DollarSign, Wallet, CheckCircle2, AlertCircle, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine
} from "recharts";
import { useAssetValue, useAssetValueSimulation } from "@/hooks/useAssetValue";
import { 
  formatAssetValue, 
  generateValueTips,
  DATA_CATEGORY_BASE_VALUES 
} from "@/utils/assetValueCalculator";

interface VCoreAssetDashboardProps {
  onBack?: () => void;
  onOpenMyDataUpload?: () => void;
  onEstimatedPensionChange?: (pension: number) => void;
}

const VCoreAssetDashboard = ({ onBack, onOpenMyDataUpload, onEstimatedPensionChange }: VCoreAssetDashboardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showValueBoost, setShowValueBoost] = useState(false);
  const [goldenTimeActive, setGoldenTimeActive] = useState(true);
  
  // 실시간 자산 가치 계산 훅
  const { 
    assetBreakdown, 
    isLoading, 
    profile,
    categoryValues,
    refreshData 
  } = useAssetValue({
    refreshInterval: 30000, // 30초마다 자동 갱신
    onValueChange: (breakdown) => {
      onEstimatedPensionChange?.(breakdown.estimatedMonthlyPension);
    }
  });
  
  // 실시간 가치 변동 시뮬레이션
  const { simulatedValue, valueHistory } = useAssetValueSimulation(assetBreakdown);
  
  // 가치 향상 팁
  const valueTips = useMemo(() => {
    return assetBreakdown ? generateValueTips(assetBreakdown) : [];
  }, [assetBreakdown]);

  // 골든타임 체크
  useEffect(() => {
    const hour = new Date().getHours();
    setGoldenTimeActive(hour >= 10 && hour <= 18);
  }, []);

  const goldenTimeData = [
    { time: "06:00", demand: 40 },
    { time: "09:00", demand: 75 },
    { time: "12:00", demand: 95 },
    { time: "15:00", demand: 88 },
    { time: "18:00", demand: 92 },
    { time: "21:00", demand: 60 },
    { time: "24:00", demand: 35 },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await refreshData();
      setShowValueBoost(true);
      setTimeout(() => setShowValueBoost(false), 5000);
    } catch (error) {
      console.error("데이터 갱신 실패:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || !assetBreakdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">자산 가치 분석 중...</p>
        </div>
      </div>
    );
  }

  const isValueUp = assetBreakdown.valueChangePercent >= 0;
  const { factors, multipliers, categoryBreakdown, confidenceIndex } = assetBreakdown;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
              ← 뒤로
            </button>
            <h1 className="font-bold text-lg">V-Core Asset Estimator</h1>
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Current Value Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 p-5 mb-4"
        >
          <AnimatePresence>
            {showValueBoost && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-3xl"
              />
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                내 데이터 현재 가치
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  assetBreakdown.assetGrade === 'diamond' ? 'bg-cyan-500/20 text-cyan-400' :
                  assetBreakdown.assetGrade === 'platinum' ? 'bg-purple-500/20 text-purple-400' :
                  assetBreakdown.assetGrade === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                  assetBreakdown.assetGrade === 'silver' ? 'bg-slate-400/20 text-slate-300' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {assetBreakdown.assetGrade.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex items-end gap-3 mb-3">
              <motion.span 
                key={simulatedValue}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className={`text-4xl font-bold tracking-tight ${
                  showValueBoost ? "text-cyan-400" : "text-white"
                }`}
              >
                {formatAssetValue(simulatedValue || assetBreakdown.totalValue)}
              </motion.span>
              {assetBreakdown.valueChangePercent !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                  isValueUp 
                    ? "bg-cyan-500/20 text-cyan-400" 
                    : "bg-pink-500/20 text-pink-400"
                }`}>
                  {isValueUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isValueUp ? "+" : ""}{assetBreakdown.valueChangePercent.toFixed(1)}%
                </div>
              )}
            </div>

            {/* 예상 월 연금 */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">예상 월 데이터 연금</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatAssetValue(assetBreakdown.estimatedMonthlyPension)}/월
                </p>
              </div>
            </div>

            {/* 다음 등급 진행률 */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">다음 등급까지</span>
                <span className="text-cyan-400">
                  {formatAssetValue(assetBreakdown.nextGradeThreshold - assetBreakdown.totalValue)} 남음
                </span>
              </div>
              <Progress value={assetBreakdown.progressToNextGrade} className="h-2" />
            </div>
          </div>
        </motion.div>

        {/* 실시간 가치 요소 카드 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 p-5 mb-4"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">가치 산정 요소 (실시간)</h2>
          </div>

          {/* 신선도 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hourglass className={`w-4 h-4 ${
                  factors.freshness < 50 ? "text-pink-400" : factors.freshness < 80 ? "text-amber-400" : "text-cyan-400"
                }`} />
                <span className="text-sm text-slate-300">데이터 신선도</span>
              </div>
              <span className={`text-lg font-bold ${
                factors.freshness < 50 ? "text-pink-400" : factors.freshness < 80 ? "text-amber-400" : "text-cyan-400"
              }`}>{factors.freshness}%</span>
            </div>
            <Progress value={factors.freshness} className="h-2" />
            <p className="text-xs text-slate-500 mt-1.5">
              마지막 업데이트: {profile?.data_last_updated 
                ? new Date(profile.data_last_updated).toLocaleDateString('ko-KR')
                : '없음'}
            </p>
          </div>

          {/* 프로필 완성도 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">프로필 완성도</span>
              </div>
              <span className="text-lg font-bold text-blue-400">{factors.completeness}%</span>
            </div>
            <Progress value={factors.completeness} className="h-2" />
            <p className="text-xs text-slate-500 mt-1.5">
              배율: ×{multipliers.completenessMultiplier.toFixed(2)}
            </p>
          </div>

          {/* 인증 등급 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {profile?.is_verified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-sm text-slate-300">인증 등급</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-sm font-bold ${
                factors.verificationGrade === 'diamond' ? 'bg-cyan-500/20 text-cyan-400' :
                factors.verificationGrade === 'platinum' ? 'bg-purple-500/20 text-purple-400' :
                factors.verificationGrade === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                factors.verificationGrade === 'silver' ? 'bg-slate-400/20 text-slate-300' :
                'bg-pink-500/20 text-pink-400'
              }`}>
                {factors.verificationGrade.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              배율: ×{multipliers.verificationMultiplier.toFixed(2)} · 
              신뢰점수 {profile?.trust_score || 0}점
            </p>
          </div>

          {/* 시장 수요 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">시장 수요 지수</span>
              </div>
              <span className="text-lg font-bold text-amber-400">{factors.marketDemand}%</span>
            </div>
            <Progress value={factors.marketDemand} className="h-2" />
            <p className="text-xs text-slate-500 mt-1.5">
              DB 실시간 조회 · {categoryValues?.length || 0}개 카테고리 분석
            </p>
          </div>
        </motion.div>

        {/* 카테고리별 가치 분석 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">카테고리별 자산 가치</h2>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => {
                const categoryInfo = DATA_CATEGORY_BASE_VALUES[cat.category];
                return (
                  <div key={cat.category} className="bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryInfo?.icon || '📊'}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-cyan-400 font-bold">
                        {formatAssetValue(cat.adjustedValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>기본가 {formatAssetValue(cat.baseValue)}</span>
                      <span>수요 ×{cat.demandFactor.toFixed(2)}</span>
                      <span>기여도 {cat.contribution}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">연결된 데이터 카테고리가 없습니다</p>
              <Button 
                variant="link" 
                className="text-cyan-400 mt-2"
                onClick={onOpenMyDataUpload}
              >
                마이데이터 연결하기 →
              </Button>
            </div>
          )}
        </motion.div>

        {/* Live V-Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              실시간 가치 추이
            </h2>
            <span className="text-xs text-slate-500">오늘</span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={valueHistory}>
                <defs>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isValueUp ? "#06b6d4" : "#ec4899"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isValueUp ? "#06b6d4" : "#ec4899"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [formatAssetValue(value), '가치']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isValueUp ? "#06b6d4" : "#ec4899"}
                  strokeWidth={2}
                  fill="url(#valueGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Golden Time Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">골든타임 수요 그래프</h3>
            </div>
            {goldenTimeActive && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full animate-pulse">
                🔥 지금 골든타임!
              </span>
            )}
          </div>

          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={goldenTimeData}>
                <defs>
                  <linearGradient id="goldenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="demand"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#goldenGradient)"
                />
                <ReferenceLine x="12:00" stroke="#f59e0b" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">시간대별 시장 수요 · 12:00~18:00 피크 타임</p>
        </motion.div>

        {/* V-Core Refresh Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`w-full py-7 rounded-2xl text-lg font-bold transition-all ${
              isRefreshing 
                ? "bg-slate-700"
                : "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 animate-gradient"
            }`}
          >
            {isRefreshing ? (
              <span className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                V-Core 정밀 분석 중...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Zap className="w-6 h-6" />
                마이데이터로 가치 갱신하기
                <ArrowUpRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          {/* Value Boost Animation */}
          <AnimatePresence>
            {showValueBoost && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 360] }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Sparkles className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                  <div>
                    <p className="text-cyan-400 font-bold">가치 갱신 완료!</p>
                    <p className="text-sm text-slate-400">
                      예상 월 연금: {formatAssetValue(assetBreakdown.estimatedMonthlyPension)}/월
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Confidence & Market Demand Gauges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {/* Confidence Index */}
          <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-slate-400">V-Core 신뢰 지수</span>
            </div>
            <div className="relative h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#334155"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#06b6d4"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: `${confidenceIndex * 2.51} 251` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-bold text-cyan-400">{confidenceIndex}</span>
                <span className="text-xs text-slate-500 block">CI</span>
              </div>
            </div>
          </div>

          {/* Market Demand */}
          <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">시장 수요 지수</span>
            </div>
            <div className="relative h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#334155"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: `${factors.marketDemand * 2.51} 251` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-bold text-amber-400">{factors.marketDemand}</span>
                <span className="text-xs text-slate-500 block">MDI</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 가치 향상 팁 */}
        {valueTips.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 p-4 mb-6"
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              가치 향상 팁
            </h3>
            <div className="space-y-2">
              {valueTips.map((tip, idx) => (
                <p key={idx} className="text-sm text-slate-300">{tip}</p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Expected Rewards Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 p-5"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <ChevronUp className="w-5 h-5 text-emerald-400" />
            최신화 시 예상 추가 보상
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">신뢰도 상승분</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-cyan-400">
                  +{Math.round((100 - confidenceIndex) * 0.5)}
                </span>
                <span className="text-sm text-slate-500">점</span>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">예상 추가 연금</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-400">
                  +{formatAssetValue(Math.round((100 - factors.freshness) * 50))}
                </span>
                <span className="text-sm text-slate-500">/월</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              데이터 신선도가 50% 이하로 떨어지면 보상이 급감합니다
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default VCoreAssetDashboard;
