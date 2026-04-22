import { useState, useEffect } from "react";
import { 
  ArrowLeft, Shield, CheckCircle2, TrendingUp, TrendingDown,
  Activity, Users, Heart, Building2, FileCheck, Lock,
  Play, Pause, ChevronRight, AlertTriangle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface PolicyDashboardProps {
  onBack?: () => void;
}

// 실시간 정책 인덱스 데이터
const generateIndexData = () => {
  const months = ["1월", "2월", "3월", "4월", "5월", "6월"];
  return months.map((month, i) => ({
    month,
    youth: 45 + Math.random() * 30 + i * 3,
    senior: 52 + Math.random() * 25 + i * 2,
    housing: 38 + Math.random() * 20 + i * 4,
  }));
};

// 정책 시뮬레이션 데이터
const generateSimulationData = (policyImpact: number) => {
  const quarters = ["Q1", "Q2", "Q3", "Q4", "Q1'26", "Q2'26"];
  return quarters.map((quarter, i) => ({
    quarter,
    baseline: 100 + i * 5 + Math.random() * 10,
    withPolicy: 100 + i * 5 + (policyImpact * (i + 1)) + Math.random() * 10,
  }));
};

// 정책 지표 목록
const policyIndices = [
  { 
    id: "youth", 
    name: "수도권 청년 소비 지수", 
    value: 78.4, 
    change: +2.3, 
    trend: "up",
    icon: Users,
    color: "#3B82F6"
  },
  { 
    id: "senior", 
    name: "고령층 건강 관리 지표", 
    value: 65.2, 
    change: -1.1, 
    trend: "down",
    icon: Heart,
    color: "#10B981"
  },
  { 
    id: "housing", 
    name: "주거 안정성 인덱스", 
    value: 54.8, 
    change: +0.8, 
    trend: "up",
    icon: Building2,
    color: "#8B5CF6"
  },
];

// 정책 시뮬레이션 시나리오
const policyScenarios = [
  { id: 1, name: "청년 주거 지원금 50% 확대", impact: 8, category: "주거" },
  { id: 2, name: "고령층 의료비 본인부담금 인하", impact: 12, category: "건강" },
  { id: 3, name: "수도권 청년 창업 세제 혜택", impact: 6, category: "경제" },
  { id: 4, name: "디지털 바우처 지급 확대", impact: 4, category: "복지" },
];

const PolicyDashboard = ({ onBack }: PolicyDashboardProps) => {
  const [indexData, setIndexData] = useState(generateIndexData());
  const [selectedScenario, setSelectedScenario] = useState(policyScenarios[0]);
  const [simulationData, setSimulationData] = useState(generateSimulationData(8));
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시계
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setIndexData(generateIndexData());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 시뮬레이션 실행
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationData(generateSimulationData(selectedScenario.impact));
      setIsSimulating(false);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header - Bloomberg Terminal Style */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400 font-mono">LIVE</span>
              </div>
              <h1 className="text-sm font-bold text-slate-100 font-mono">
                POLICY DECISION CENTER
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-mono">KST</p>
              <p className="text-sm font-bold text-amber-400 font-mono">
                {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/50 border border-emerald-800 rounded">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono">SECURED</span>
            </div>
          </div>
        </div>
      </header>

      {/* V-Core 검증 상태바 */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] text-blue-400 font-mono">
              정부 가이드라인 준수 익명화 완료
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-mono">
              데이터 무결성 99.9% 보증
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-slate-400 font-mono">
            V-Core Certified
          </span>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* 실시간 정책 인덱스 */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                REAL-TIME POLICY INDEX
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Updated: {formatTime(currentTime)}
            </span>
          </div>

          {/* 인덱스 카드들 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {policyIndices.map((index) => (
              <motion.div
                key={index.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                whileHover={{ borderColor: index.color }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <index.icon className="w-4 h-4" style={{ color: index.color }} />
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {index.name}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold font-mono" style={{ color: index.color }}>
                    {index.value.toFixed(1)}
                  </span>
                  <div className={`flex items-center gap-1 ${
                    index.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {index.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-mono">
                      {index.change > 0 ? "+" : ""}{index.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 인덱스 추이 차트 */}
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indexData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                  axisLine={{ stroke: '#475569' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => {
                    const names: Record<string, string> = {
                      youth: '청년 소비',
                      senior: '고령층 건강',
                      housing: '주거 안정성'
                    };
                    return names[value] || value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="youth" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="senior" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="housing" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* V-Core 인증 마크 */}
          <div className="mt-4 flex items-center justify-center gap-4 py-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-slate-500 font-mono">
                익명화 완료
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-slate-500 font-mono">
                무결성 99.9%
              </span>
            </div>
          </div>
        </section>

        {/* 정책 시뮬레이터 */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                POLICY IMPACT SIMULATOR
              </h2>
            </div>
            <Button
              size="sm"
              onClick={runSimulation}
              disabled={isSimulating}
              className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-mono text-xs"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  분석중...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  시뮬레이션
                </>
              )}
            </Button>
          </div>

          {/* 시나리오 선택 */}
          <div className="mb-4">
            <p className="text-[10px] text-slate-500 font-mono mb-2">
              IF POLICY IMPLEMENTED:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {policyScenarios.map((scenario) => (
                <motion.button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedScenario.id === scenario.id
                      ? "bg-amber-900/30 border-amber-600"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono ${
                      selectedScenario.id === scenario.id ? "text-amber-400" : "text-slate-500"
                    }`}>
                      {scenario.category}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      +{scenario.impact}% 예상
                    </span>
                  </div>
                  <p className={`text-xs ${
                    selectedScenario.id === scenario.id ? "text-slate-100" : "text-slate-400"
                  }`}>
                    {scenario.name}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 시뮬레이션 결과 차트 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedScenario.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-48"
            >
              {isSimulating ? (
                <div className="h-full flex items-center justify-center">
                  <motion.div
                    className="flex items-center gap-3"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-400 font-mono">
                      정책 효과 분석 중...
                    </span>
                  </motion.div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="quarter" 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={{ stroke: '#475569' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px' }}
                      formatter={(value) => {
                        const names: Record<string, string> = {
                          baseline: '현행 유지',
                          withPolicy: '정책 시행 시'
                        };
                        return names[value] || value;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#64748b" 
                      fill="#334155"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="withPolicy" 
                      stroke="#f59e0b" 
                      fill="#78350f"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </AnimatePresence>

          {/* 예상 효과 요약 */}
          <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-100 font-mono">
                PROJECTED IMPACT
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-400 font-mono">
                  +{selectedScenario.impact}%
                </p>
                <p className="text-[10px] text-slate-500">지표 개선</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-400 font-mono">
                  ~{(selectedScenario.impact * 12000).toLocaleString()}억
                </p>
                <p className="text-[10px] text-slate-500">경제 효과</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-400 font-mono">
                  ~{Math.floor(selectedScenario.impact * 0.8)}만명
                </p>
                <p className="text-[10px] text-slate-500">수혜 대상</p>
              </div>
            </div>
          </div>

          {/* V-Core 인증 마크 */}
          <div className="mt-4 flex items-center justify-center gap-4 py-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-slate-500 font-mono">
                정부 가이드라인 준수
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-slate-500 font-mono">
                데이터 무결성 보증
              </span>
            </div>
          </div>
        </section>

        {/* 데이터 출처 및 법적 고지 */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-400 font-mono">
              DATA COMPLIANCE
            </h3>
          </div>
          <div className="space-y-2 text-[10px] text-slate-500 font-mono">
            <p>• 개인정보보호법 제58조에 의거 완전 익명화 처리</p>
            <p>• 통계법 제33조 통계목적 외 사용금지 준수</p>
            <p>• ISO 27001 정보보안 인증 획득</p>
            <p>• V-Core 블록체인 기반 무결성 검증 완료</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PolicyDashboard;
