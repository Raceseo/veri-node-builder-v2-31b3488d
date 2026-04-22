import { useState, useEffect } from "react";
import { 
  Shield, Lock, Zap, Activity, 
  TrendingUp, TrendingDown, BarChart3,
  CheckCircle2, RefreshCw, Clock,
  Sparkles, Target, Timer, Server, Cpu, Binary, ArrowUpRight,
  LineChart, Eye, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, Bar,
} from "recharts";

interface TerminalDashboardProps {
  onBack?: () => void;
  onOpenMarketplace?: () => void;
  userType?: "individual" | "enterprise";
}

// 캔들스틱 데이터 (Time Decay 시각화)
const generateCandleData = (boosted = false) => {
  const data = [];
  let baseValue = boosted ? 2600 : 2800;
  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "현재"];
  
  for (let i = 0; i < times.length; i++) {
    const volatility = Math.random() * 80 + 20;
    const trend = boosted ? (i < 5 ? -10 : 35) : (i < 5 ? -18 : 8);
    const open = baseValue;
    const change = trend + (Math.random() - 0.5) * volatility;
    const close = baseValue + change;
    const high = Math.max(open, close) + Math.random() * 30;
    const low = Math.min(open, close) - Math.random() * 30;
    
    data.push({
      time: times[i],
      open: Math.round(open),
      close: Math.round(close),
      high: Math.round(high),
      low: Math.round(low),
      volume: Math.floor(Math.random() * 1000 + 500),
      isUp: close >= open
    });
    
    baseValue = close;
  }
  return data;
};

const TerminalDashboard = ({ onBack, onOpenMarketplace, userType = "individual" }: TerminalDashboardProps) => {
  const [isAnonymizing, setIsAnonymizing] = useState(false);
  const [anonymizationComplete, setAnonymizationComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBayesianUpdate, setShowBayesianUpdate] = useState(false);
  const [candleData, setCandleData] = useState(generateCandleData());
  
  // 통계 지표
  const [purityScore, setPurityScore] = useState(94.7);
  const [confidenceInterval, setConfidenceInterval] = useState({ lower: 92.1, upper: 97.3 });
  const [pValue, setPValue] = useState(0.0023);
  const [myDataRatio, setMyDataRatio] = useState(78);
  const [dataFreshness, setDataFreshness] = useState(65);
  const [currentValue, setCurrentValue] = useState(2450);
  
  // 실시간 데이터 감소 효과
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && !showBayesianUpdate) {
        setDataFreshness(prev => Math.max(prev - 0.08, 20));
        setCurrentValue(prev => Math.max(prev - Math.random() * 2, 2000));
        setPurityScore(prev => Math.max(prev - 0.01, 85));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRefreshing, showBayesianUpdate]);

  // Zero-Knowledge 익명화 시뮬레이션
  const handleLocalAnonymization = () => {
    setIsAnonymizing(true);
    setTimeout(() => {
      setIsAnonymizing(false);
      setAnonymizationComplete(true);
    }, 3000);
  };

  // 베이즈 갱신 시뮬레이션
  const handleBayesianRefresh = () => {
    setIsRefreshing(true);
    setShowBayesianUpdate(true);
    
    setTimeout(() => {
      setIsRefreshing(false);
      setDataFreshness(100);
      setCurrentValue(2950);
      setPurityScore(98.2);
      setConfidenceInterval({ lower: 96.5, upper: 99.1 });
      setPValue(0.0003);
      setCandleData(generateCandleData(true));
      
      setTimeout(() => setShowBayesianUpdate(false), 4000);
    }, 2500);
  };

  const isValueUp = currentValue > 2450;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-mono">
      {/* Terminal-style Header */}
      <header className="sticky top-0 z-50 bg-[#0a0e17]/95 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="text-slate-500 hover:text-cyan-400 transition-colors text-sm"
            >
              ← EXIT
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-sm font-bold tracking-wider">VERINODE TERMINAL</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>SESSION: ACTIVE</span>
            <span className="text-emerald-400">● SECURE</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center gap-6 px-4 py-2 bg-[#0d1321] border-t border-slate-800/50 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">V-CORE:</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">ENCRYPTION:</span>
            <span className="text-emerald-400">AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">LOCAL PROC:</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Zero-Knowledge Anonymization Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#0d1321] to-[#111827] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Binary className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-sm tracking-wider">ZERO-KNOWLEDGE ANONYMIZER</span>
            </div>
            <div className="flex items-center gap-2">
              {anonymizationComplete ? (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded border border-emerald-500/30">
                  ✓ DIFFERENTIAL PRIVACY ACTIVE
                </span>
              ) : (
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded border border-amber-500/30">
                  AWAITING INIT
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4">
            <AnimatePresence mode="wait">
              {isAnonymizing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                      <motion.div 
                        className="absolute inset-0 border-2 border-cyan-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="absolute inset-2 border-2 border-emerald-400 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      <Lock className="absolute inset-0 m-auto w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-cyan-400 font-bold mb-2">LOCAL ANONYMIZATION IN PROGRESS</p>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <motion.span 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >▸</motion.span>
                          <span>Applying ε-differential privacy (ε=0.1)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.span 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                          >▸</motion.span>
                          <span>k-anonymity verification (k=50)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.span 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                          >▸</motion.span>
                          <span>Local noise injection complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Progress value={75} className="h-1 bg-slate-700" />
                </motion.div>
              ) : anonymizationComplete ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <div>
                    <p className="text-emerald-400 font-bold text-sm">DATA ANONYMIZED ON-DEVICE</p>
                    <p className="text-xs text-slate-400">Zero raw data transmitted to servers</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    onClick={handleLocalAnonymization}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-6 font-bold tracking-wider"
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    INITIALIZE LOCAL ANONYMIZER
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Data will be anonymized on your device before any transmission
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Real-time Asset Value with Candle Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-slate-700/50 bg-[#0d1321] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LineChart className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm tracking-wider">TIME-SERIES ASSET VALUE</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">LIVE</span>
            </div>
          </div>
          
          <div className="p-4">
            {/* Current Value Display */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">CURRENT VALUE (V-POINT)</p>
                <motion.div 
                  className="flex items-end gap-3"
                  key={currentValue}
                >
                  <span className={`text-4xl font-bold tracking-tight ${
                    showBayesianUpdate ? "text-cyan-400" : isValueUp ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {Math.round(currentValue).toLocaleString()}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                    isValueUp 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {isValueUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isValueUp ? "+" : ""}{((currentValue - 2450) / 2450 * 100).toFixed(2)}%
                  </div>
                </motion.div>
              </div>
              
              <div className="text-right text-xs text-slate-500">
                <p>24H HIGH: <span className="text-emerald-400">2,980</span></p>
                <p>24H LOW: <span className="text-rose-400">2,320</span></p>
              </div>
            </div>

            {/* Candle Chart Visualization */}
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={candleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name.toUpperCase()]}
                  />
                  {/* Volume bars */}
                  <Bar dataKey="volume" fill="#334155" opacity={0.3} />
                  {/* Candlestick representation */}
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isValueUp ? "#10b981" : "#f43f5e"}
                    strokeWidth={2}
                    fill={isValueUp ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)"}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Time Decay Warning */}
            <div className={`p-3 rounded-lg border ${
              dataFreshness < 50 
                ? "bg-rose-500/10 border-rose-500/30" 
                : dataFreshness < 80 
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className={`w-4 h-4 ${
                    dataFreshness < 50 ? "text-rose-400 animate-pulse" : 
                    dataFreshness < 80 ? "text-amber-400" : "text-emerald-400"
                  }`} />
                  <span className="text-sm font-medium text-white">DATA FRESHNESS</span>
                </div>
                <span className={`text-lg font-bold ${
                  dataFreshness < 50 ? "text-rose-400" : 
                  dataFreshness < 80 ? "text-amber-400" : "text-emerald-400"
                }`}>{Math.round(dataFreshness)}%</span>
              </div>
              <Progress value={dataFreshness} className="h-1.5 bg-slate-700" />
              
              {dataFreshness < 80 && (
                <p className="text-xs mt-2 text-slate-400">
                  <span className="text-rose-400">⚠ Time decay detected.</span>
                  {" "}Refresh now to restore <span className="text-cyan-400 font-bold">150% value</span>
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* V-Core Analytics Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-slate-700/50 bg-[#0d1321]"
        >
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            <span className="text-violet-400 font-bold text-sm tracking-wider">V-CORE ANALYTICS</span>
          </div>
          
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Purity Score */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">V-CORE PURITY</p>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${
                  purityScore >= 95 ? "text-emerald-400" : 
                  purityScore >= 90 ? "text-amber-400" : "text-rose-400"
                }`}>{purityScore.toFixed(1)}</span>
                <span className="text-xs text-slate-500 mb-1">%</span>
              </div>
            </div>

            {/* 95% Confidence Interval */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">95% CI</p>
              <div className="flex items-end gap-1">
                <span className="text-lg font-bold text-cyan-400">
                  [{confidenceInterval.lower.toFixed(1)}, {confidenceInterval.upper.toFixed(1)}]
                </span>
              </div>
            </div>

            {/* p-value */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">P-VALUE</p>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${
                  pValue < 0.01 ? "text-emerald-400" : 
                  pValue < 0.05 ? "text-amber-400" : "text-rose-400"
                }`}>{pValue.toFixed(4)}</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                {pValue < 0.01 ? "Highly Significant" : pValue < 0.05 ? "Significant" : "Not Significant"}
              </p>
            </div>

            {/* MyData Ratio */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">MYDATA API %</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-blue-400">{myDataRatio}</span>
                <span className="text-xs text-slate-500 mb-1">%</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">0% Forgery Risk</p>
            </div>
          </div>
        </motion.div>

        {/* Bayesian Update Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleBayesianRefresh}
            disabled={isRefreshing}
            className={`w-full py-7 rounded-lg text-lg font-bold tracking-wider transition-all ${
              isRefreshing 
                ? "bg-slate-700"
                : "bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            }`}
          >
            {isRefreshing ? (
              <span className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                BAYESIAN UPDATE IN PROGRESS...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Zap className="w-6 h-6" />
                REFRESH DATA VALUE (BAYESIAN UPDATE)
                <ArrowUpRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          {/* Bayesian Update Animation */}
          <AnimatePresence>
            {showBayesianUpdate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 border border-cyan-500/30"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Sparkles className="w-10 h-10 text-cyan-400" />
                  </motion.div>
                  <div>
                    <p className="text-cyan-400 font-bold">BAYESIAN POSTERIOR UPDATE COMPLETE</p>
                    <p className="text-sm text-slate-400">
                      Value restored +{((2950 - 2450) / 2450 * 100).toFixed(1)}% | 
                      Confidence Interval narrowed by 42%
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        {onOpenMarketplace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onOpenMarketplace}
              variant="outline"
              className="w-full py-6 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold tracking-wider"
            >
              <Eye className="w-5 h-5 mr-2" />
              VIEW V-CORE MARKETPLACE
            </Button>
          </motion.div>
        )}

        {/* Compliance Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-2 justify-center py-4"
        >
          {["ISO 27001", "ISO 27701", "GDPR", "CCPA", "HIPAA"].map((badge) => (
            <span 
              key={badge}
              className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TerminalDashboard;
