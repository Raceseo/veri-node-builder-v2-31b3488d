import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, Wallet, Shield, Award, ChevronRight, 
  Sparkles, Gift, Target, BarChart3, Clock, Activity, Terminal,
  RefreshCw, Hourglass, Zap, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";
import RollingNumber from "@/components/animations/RollingNumber";

interface IndividualDashboardProps {
  trustScore?: number;
  vnBalance?: number;
  displayName?: string;
  onOpenSurvey?: () => void;
  onOpenWallet?: () => void;
  onOpenMyDataUpload?: () => void;
  onOpenVCoreAsset?: () => void;
  onOpenTerminal?: () => void;
  onOpenCategoryMonitor?: () => void;
  onOpenPortfolio?: () => void;
  onOpenAssetOptimization?: () => void;
}

// Generate initial chart data with decay
const generateChartData = (baseValue: number, decayed: boolean) => {
  const now = Date.now();
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 3600000);
    const hour = time.getHours();
    let value = baseValue;
    
    if (decayed) {
      // Show decay over time
      const decayFactor = Math.max(0.5, 1 - (23 - i) * 0.02);
      value = baseValue * decayFactor + Math.random() * 50 - 25;
    } else {
      // Random fluctuation around base
      value = baseValue + Math.random() * 100 - 50;
    }
    
    data.push({
      time: `${hour}:00`,
      value: Math.max(0, Math.round(value)),
    });
  }
  return data;
};

const IndividualDashboard = ({
  trustScore = 72,
  vnBalance = 1250,
  displayName = "사용자",
  onOpenSurvey,
  onOpenWallet,
  onOpenMyDataUpload,
  onOpenVCoreAsset,
  onOpenTerminal,
  onOpenCategoryMonitor,
  onOpenPortfolio,
  onOpenAssetOptimization
}: IndividualDashboardProps) => {
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [dataFreshness, setDataFreshness] = useState(68);
  const [assetValue, setAssetValue] = useState(2847);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartData, setChartData] = useState(() => generateChartData(2847, true));
  const [showBayesianEffect, setShowBayesianEffect] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(vnBalance);

  // Simulate real-time value decay
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && dataFreshness > 30) {
        setDataFreshness(prev => Math.max(30, prev - 0.5));
        setAssetValue(prev => Math.max(prev * 0.998, 1500));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isRefreshing, dataFreshness]);

  // Bayesian Update Animation
  const handleBayesianRefresh = useCallback(() => {
    setIsRefreshing(true);
    setShowBayesianEffect(true);

    // Phase 1: Prior update
    setTimeout(() => {
      setDataFreshness(85);
    }, 500);

    // Phase 2: Likelihood calculation
    setTimeout(() => {
      setDataFreshness(95);
    }, 1000);

    // Phase 3: Posterior - dramatic value increase
    setTimeout(() => {
      const newValue = Math.round(assetValue * 1.5);
      setAssetValue(newValue);
      setChartData(generateChartData(newValue, false));
      setDataFreshness(100);
      setDisplayBalance(prev => prev + 150);
    }, 1500);

    // Complete
    setTimeout(() => {
      setIsRefreshing(false);
      setShowBayesianEffect(false);
    }, 2500);
  }, [assetValue]);

  const recentRewards = [
    { id: 1, title: "건강 설문 참여", amount: 50, date: "오늘" },
    { id: 2, title: "마이데이터 연동 보너스", amount: 100, date: "어제" },
    { id: 3, title: "소비패턴 분석 제공", amount: 75, date: "2일 전" },
  ];

  const availableSurveys = [
    { id: 1, title: "2024 라이프스타일 조사", reward: 80, time: "5분", category: "생활" },
    { id: 2, title: "금융 서비스 만족도", reward: 120, time: "10분", category: "금융" },
    { id: 3, title: "건강관리 습관 조사", reward: 60, time: "3분", category: "건강" },
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e17] via-[#0f1629] to-[#0a1628] pb-8">
      {/* Header - Palantir Style */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0f1629] px-4 pt-10 pb-6 border-b border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-500 text-xs font-mono">INDIVIDUAL TERMINAL</p>
            <h1 className="text-xl font-bold text-white">{displayName} <span className="text-slate-500 font-normal">님</span></h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Trust Score - Compact */}
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

      {/* Real-time Asset Value Chart */}
      <div className="px-4 pt-4">
        <motion.div 
          className={`rounded-2xl p-4 border transition-all duration-500 ${
            showBayesianEffect 
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/50' 
              : 'bg-slate-900/50 border-slate-700/50'
          }`}
        >
          {/* Chart Header */}
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
              <span className={`text-xs ${assetValue > 2847 ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>
                {assetValue > 2847 ? '+' : ''}{((assetValue / 2847 - 1) * 100).toFixed(1)}%
              </span>
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
                <Hourglass className="w-4 h-4 text-rose-400" />
                <div className="flex-1">
                  <p className="text-xs text-rose-400 font-medium">
                    데이터 신선도가 {Math.round(100 - dataFreshness)}% 하락했습니다
                  </p>
                  <p className="text-[10px] text-rose-300/70">
                    지금 마이데이터를 갱신하고 가치를 150% 복구하세요!
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
                <span className={`text-xs font-bold font-mono ${getFreshnessColor()}`}>
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
            className={`w-full h-12 font-bold text-sm transition-all ${
              isRefreshing
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
            }`}
          >
            {isRefreshing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
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

          {/* Bayesian Effect Overlay */}
          <AnimatePresence>
            {showBayesianEffect && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
              >
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  <span className="font-mono">P(θ|D) = P(D|θ) × P(θ) / P(D)</span>
                </div>
                <p className="text-[10px] text-cyan-300/70 mt-1">
                  사후확률 재계산 중... 신뢰구간 업데이트 완료
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="px-4 pt-4">
        {/* VN Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 mb-4"
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
                  <RollingNumber value={displayBalance} suffix=" VN" />
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </div>
        </motion.div>

        {/* Quick Action Banners */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={onOpenVCoreAsset}
            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-cyan-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] text-cyan-400 font-mono">LIVE</span>
            </div>
            <p className="text-xs text-white font-medium">실시간 관제</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={onOpenTerminal}
            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-emerald-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono">PRO</span>
            </div>
            <p className="text-xs text-white font-medium">프로 터미널</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
            onClick={onOpenCategoryMonitor}
            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-amber-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-mono">DATA</span>
            </div>
            <p className="text-xs text-white font-medium">카테고리 관제</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-5 gap-2 mb-4"
        >
          <button 
            onClick={onOpenMyDataUpload}
            className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 hover:border-trust/50 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-trust/20 flex items-center justify-center mx-auto mb-1">
              <Sparkles className="w-4 h-4 text-trust" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">데이터 추가</p>
          </button>
          <button 
            onClick={onOpenSurvey}
            className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/50 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-1">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">설문 참여</p>
          </button>
          <button 
            onClick={onOpenPortfolio}
            className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 hover:border-blue-500/50 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-1">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">포트폴리오</p>
          </button>
          <button 
            onClick={onOpenAssetOptimization}
            className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 hover:border-amber-500/50 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-1">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">가치 최적화</p>
          </button>
        </motion.div>

        {/* Available Surveys - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-white text-sm">참여 가능한 설문</h2>
            <button className="text-xs text-cyan-400 font-medium">전체보기</button>
          </div>
          <div className="space-y-2">
            {availableSurveys.map((survey) => (
              <div 
                key={survey.id}
                onClick={onOpenSurvey}
                className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded">
                        {survey.category}
                      </span>
                      <span className="text-slate-500 text-[10px] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {survey.time}
                      </span>
                    </div>
                    <h3 className="text-xs font-medium text-slate-300">{survey.title}</h3>
                  </div>
                  <p className="text-sm font-bold text-amber-400 font-mono">+{survey.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Rewards - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-white text-sm">최근 보상 내역</h2>
            <button className="text-xs text-cyan-400 font-medium">전체보기</button>
          </div>
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 divide-y divide-slate-700/30">
            {recentRewards.map((reward) => (
              <div key={reward.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">{reward.title}</p>
                    <p className="text-[10px] text-slate-500">{reward.date}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  +<RollingNumber value={reward.amount} />
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IndividualDashboard;
