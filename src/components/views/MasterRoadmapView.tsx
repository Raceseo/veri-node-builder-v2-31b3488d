import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ChevronRight, CheckCircle2, Circle, Clock, 
  Rocket, Target, Shield, TrendingUp, Users, Database,
  Zap, Award, Globe, Building2, Lock, Eye, EyeOff,
  Calendar, Flag, Star, Sparkles, ShieldCheck, X,
  Coins, CheckSquare, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MasterRoadmapViewProps {
  onBack: () => void;
  isAdmin?: boolean; // 나중에 관리자 분리용
  onOpenVCDemoMode?: () => void;
  onOpenOperatorDashboard?: () => void;
  onOpenUnitEconomics?: () => void;
}

// Phase 2 체크리스트 - 모두 완료
const phase2Checklist = [
  { id: "c2-1", title: "자동 연결 파이프라인 고도화", completed: true },
  { id: "c2-2", title: "V-Core 익명화 로직 적용", completed: true },
  { id: "c2-3", title: "데이터 가치 산정 알고리즘", completed: true },
  { id: "c2-4", title: "실시간 품질 모니터링", completed: true },
  { id: "c2-5", title: "기업 API 문서화", completed: true },
  { id: "c2-6", title: "Asset Estimator 통합", completed: true },
  { id: "c2-7", title: "Wallet 연금 연동", completed: true },
];

// 로드맵 단계 정의
const initialRoadmapPhases = [
  {
    id: "phase1",
    phase: "Phase 1",
    title: "Foundation",
    subtitle: "핵심 인프라 구축",
    period: "2024 Q4 - 2025 Q1",
    status: "completed" as const,
    progress: 100,
    color: "emerald",
    icon: Shield,
    milestones: [
      { id: "m1-1", title: "V-Core 검증 엔진 개발", status: "completed", impact: "핵심 기술" },
      { id: "m1-2", title: "Military-Grade 암호화 적용", status: "completed", impact: "보안" },
      { id: "m1-3", title: "베타 사용자 1,000명 확보", status: "completed", impact: "시장 검증" },
      { id: "m1-4", title: "초기 데이터 파트너 5개사 계약", status: "completed", impact: "수익" },
    ],
    checklist: [
      { id: "c1-1", title: "코어 아키텍처 설계", completed: true },
      { id: "c1-2", title: "보안 인프라 구축", completed: true },
      { id: "c1-3", title: "MVP 배포", completed: true },
    ],
    kpis: [
      { label: "사용자 수", value: "1,247", target: "1,000", achieved: true },
      { label: "데이터 검증률", value: "99.2%", target: "95%", achieved: true },
      { label: "파트너사", value: "7", target: "5", achieved: true },
    ]
  },
  {
    id: "phase2",
    phase: "Phase 2",
    title: "Growth",
    subtitle: "시장 확대 및 수익화",
    period: "2025 Q1 - Q2",
    status: "completed" as const,
    progress: 100,
    color: "blue",
    icon: TrendingUp,
    milestones: [
      { id: "m2-1", title: "MAU 10,000명 달성", status: "completed", impact: "성장" },
      { id: "m2-2", title: "기업용 Automatic Pipeline 출시", status: "completed", impact: "B2B" },
      { id: "m2-3", title: "정부 데이터 파일럿", status: "completed", impact: "공공" },
      { id: "m2-4", title: "월간 GMV ₩1억 달성", status: "completed", impact: "수익" },
    ],
    checklist: phase2Checklist,
    kpis: [
      { label: "MAU", value: "12,847", target: "10,000", achieved: true },
      { label: "기업 고객", value: "58", target: "50", achieved: true },
      { label: "월간 GMV", value: "₩1.2억", target: "₩1억", achieved: true },
    ]
  },
  {
    id: "phase3",
    phase: "Phase 3",
    title: "Scale",
    subtitle: "플랫폼 확장",
    period: "2025 Q3 - Q4",
    status: "in-progress" as const,
    progress: 35,
    color: "purple",
    icon: Rocket,
    milestones: [
      { id: "m3-1", title: "해외 시장 진출 (동남아)", status: "in-progress", impact: "글로벌" },
      { id: "m3-2", title: "MAU 100,000명 달성", status: "pending", impact: "성장" },
      { id: "m3-3", title: "Series A 투자 유치", status: "in-progress", impact: "재무" },
      { id: "m3-4", title: "AI 예측 분석 기능 출시", status: "pending", impact: "제품" },
      { id: "m3-5", title: "파트너 마켓플레이스 런칭", status: "completed", impact: "수익" },
      { id: "m3-6", title: "데이터 연금 시스템 프리뷰", status: "completed", impact: "핵심" },
    ],
    checklist: [
      { id: "c3-1", title: "동남아 현지화 작업", completed: false },
      { id: "c3-2", title: "투자 유치 IR 자료 완성", completed: true },
      { id: "c3-3", title: "글로벌 결제 시스템 연동", completed: false },
      { id: "c3-4", title: "데이터 마켓플레이스 UI", completed: true },
      { id: "c3-5", title: "파트너사 매칭 시스템", completed: true },
      { id: "c3-6", title: "출금 시뮬레이션", completed: true },
    ],
    kpis: [
      { label: "글로벌 MAU", value: "18,540", target: "100,000", achieved: false },
      { label: "투자 유치", value: "진행중", target: "$5M", achieved: false },
      { label: "파트너사", value: "12", target: "30", achieved: false },
    ]
  },
  {
    id: "phase4",
    phase: "Phase 4",
    title: "Domination",
    subtitle: "시장 리더십 확보",
    period: "2026+",
    status: "pending" as const,
    progress: 0,
    color: "amber",
    icon: Award,
    milestones: [
      { id: "m4-1", title: "아시아 시장 No.1 달성", status: "pending", impact: "시장" },
      { id: "m4-2", title: "MAU 1,000,000명 달성", status: "pending", impact: "성장" },
      { id: "m4-3", title: "IPO 준비", status: "pending", impact: "EXIT" },
      { id: "m4-4", title: "데이터 연금 생태계 완성", status: "pending", impact: "비전" },
    ],
    checklist: [
      { id: "c4-1", title: "IPO 로드맵 확정", completed: false },
      { id: "c4-2", title: "글로벌 파트너십 10개사", completed: false },
      { id: "c4-3", title: "데이터 연금 시스템 오픈", completed: false },
    ],
    kpis: [
      { label: "글로벌 MAU", value: "-", target: "1M", achieved: false },
      { label: "연간 매출", value: "-", target: "₩500억", achieved: false },
      { label: "시장 점유율", value: "-", target: "15%", achieved: false },
    ]
  },
];

// 핵심 지표 요약 - Phase 3 활성화 반영
const keyMetrics = [
  { label: "전체 진행률", value: 59, unit: "%", trend: "+18% MoM" },
  { label: "완료 마일스톤", value: 11, unit: "/19", trend: "Phase 3 Active" },
  { label: "예상 시리즈 A", value: 2025, unit: "Q3", trend: "Pipeline Active" },
];

// 투자자 하이라이트
const investorHighlights = [
  { icon: Target, label: "TAM", value: "₩2.3조", description: "국내 데이터 분석 시장 (연 30% 성장)" },
  { icon: Users, label: "Target Share", value: "5%", description: "엠브레인 대비 차별화 전략" },
  { icon: Shield, label: "Moat", value: "V-Core", description: "AI 신뢰 검증 독자 기술" },
  { icon: Globe, label: "Expansion", value: "APAC", description: "2025년 동남아 진출 계획" },
];

const MasterRoadmapView = ({ onBack, isAdmin = true, onOpenVCDemoMode, onOpenOperatorDashboard, onOpenUnitEconomics }: MasterRoadmapViewProps) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [showConfidential, setShowConfidential] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [roadmapPhases, setRoadmapPhases] = useState(initialRoadmapPhases);
  
  // 실시간 자산 가치 애니메이션
  const [currentAssetValue, setCurrentAssetValue] = useState(1247850000);
  
  // 수정 모달용 상태
  const [editValues, setEditValues] = useState({
    totalProgress: 41,
    completedMilestones: 5,
    seriesATarget: "2025 Q3",
    assetValue: "1,247,850,000",
  });

  // 실시간 자산 가치 증가 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAssetValue(prev => prev + Math.floor(Math.random() * 500) + 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatAssetValue = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const handleSaveUpdate = () => {
    // 실제로는 여기서 DB 업데이트
    setShowUpdateModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-600 bg-emerald-50";
      case "in-progress": return "text-blue-600 bg-blue-50";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  const getPhaseColors = (color: string) => {
    const colors = {
      emerald: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
      blue: { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
      purple: { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
      amber: { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "in-progress": return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default: return <Circle className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Master Roadmap</h1>
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                    ADMIN VIEW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">VeriNode Strategic Vision</p>
            </div>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setShowConfidential(!showConfidential)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              {showConfidential ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs text-slate-400">
                {showConfidential ? "Hide" : "Show"} Confidential
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Security Indicator - Fixed Position */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-24 right-4 z-40"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">V-Core Security</p>
            <p className="text-[11px] font-bold text-emerald-400">DEFCON 1</p>
          </div>
        </div>
      </motion.div>

      {/* Current Asset Value - 실시간 증가 애니메이션 */}
      <section className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current Asset Value</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white">₩</span>
                  <motion.span
                    key={currentAssetValue}
                    initial={{ opacity: 0.5, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent"
                  >
                    {formatAssetValue(currentAssetValue)}
                  </motion.span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +2.4% Today
              </p>
              <p className="text-[9px] text-slate-500">Realtime Valuation</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Key Metrics Summary */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {keyMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{metric.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
                <span className="text-sm text-slate-400">{metric.unit}</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">{metric.trend}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline Visual */}
      <section className="px-4 mb-6">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-slate-700 rounded-full">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-blue-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "41%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          
          {/* Phase Indicators */}
          <div className="flex justify-between relative">
            {roadmapPhases.map((phase, index) => {
              const colors = getPhaseColors(phase.color);
              const isActive = phase.status === "in-progress";
              const isCompleted = phase.status === "completed";
              
              return (
                <motion.button
                  key={phase.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  className={`flex flex-col items-center relative ${
                    selectedPhase === phase.id ? "z-10" : ""
                  }`}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? `${colors.bg} border-transparent` 
                        : isActive 
                          ? `bg-slate-800 ${colors.border} border-2`
                          : "bg-slate-800 border-slate-600"
                    }`}
                    animate={isActive ? { 
                      boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0.4)", "0 0 0 10px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0.4)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <phase.icon className={`w-5 h-5 ${isCompleted ? "text-white" : isActive ? colors.text : "text-slate-500"}`} />
                  </motion.div>
                  <span className={`text-[10px] font-bold mt-2 ${isActive ? colors.text : isCompleted ? "text-emerald-400" : "text-slate-500"}`}>
                    {phase.phase}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">{phase.period.split(' ')[0]}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Phase Details */}
      <section className="px-4 space-y-4 pb-6">
        {roadmapPhases.map((phase, index) => {
          const colors = getPhaseColors(phase.color);
          const isExpanded = selectedPhase === phase.id;
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border transition-all ${
                isExpanded ? `${colors.border} border-2` : "border-slate-700/50"
              }`}
            >
              <button
                onClick={() => setSelectedPhase(isExpanded ? null : phase.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center`}>
                      <phase.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${colors.text}`}>{phase.phase}</span>
                        <span className="text-sm font-bold text-white">{phase.title}</span>
                        {phase.status === "in-progress" && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{phase.subtitle} • {phase.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{phase.progress}%</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <Progress value={phase.progress} className="h-1.5 bg-slate-700" />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* Checklist */}
                      {phase.checklist && phase.checklist.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Checklist</p>
                          <div className="space-y-2">
                            {phase.checklist.map((item) => (
                              <div 
                                key={item.id}
                                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl"
                              >
                                {item.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500" />
                                )}
                                <span className={`text-sm ${item.completed ? "text-white" : "text-slate-400"}`}>
                                  {item.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Milestones */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Milestones</p>
                        <div className="space-y-2">
                          {phase.milestones.map((milestone) => (
                            <div 
                              key={milestone.id}
                              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(milestone.status)}
                                <span className="text-sm text-white">{milestone.title}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(milestone.status)}`}>
                                {milestone.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* KPIs */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Performance Indicators</p>
                        <div className="grid grid-cols-3 gap-2">
                          {phase.kpis.map((kpi, kpiIndex) => (
                            <div 
                              key={kpiIndex}
                              className={`p-3 rounded-xl ${kpi.achieved ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-slate-900/50"}`}
                            >
                              <p className="text-[10px] text-slate-500 mb-1">{kpi.label}</p>
                              <p className="text-sm font-bold text-white">{kpi.value}</p>
                              <p className="text-[10px] text-slate-500">Target: {kpi.target}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </section>

      {/* Investor Highlights - Confidential */}
      <AnimatePresence>
        {showConfidential && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-8"
          >
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Investor Deck Highlights</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {investorHighlights.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-900/50 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] text-slate-500 uppercase">{item.label}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{item.value}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{item.description}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Vision Statement */}
              <div className="mt-4 p-4 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">Vision Statement</span>
                </div>
                <p className="text-sm text-white leading-relaxed">
                  "VeriNode는 개인의 데이터 주권을 회복하고, AI 기반 신뢰 검증을 통해 
                  <span className="text-amber-400 font-bold"> 세계 최초의 '데이터 연금' 생태계</span>를 구축합니다."
                </p>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* VC Pitching Tools Section */}
      {isAdmin && (
        <section className="px-4 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-4 border border-purple-500/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white">VC 피칭 도구</span>
              <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-[10px]">
                INVESTOR READY
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onOpenVCDemoMode}
                className="h-auto p-4 flex flex-col items-start gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700"
              >
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">VC Demo Mode</p>
                  <p className="text-[10px] text-slate-400">1클릭 거래 사이클 시연</p>
                </div>
              </Button>
              
              <Button
                onClick={onOpenOperatorDashboard}
                className="h-auto p-4 flex flex-col items-start gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700"
              >
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">운영자 대시보드</p>
                  <p className="text-[10px] text-slate-400">실시간 플랫폼 KPI</p>
                </div>
              </Button>
              
              <Button
                onClick={onOpenUnitEconomics}
                className="h-auto p-4 flex flex-col items-start gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700"
              >
                <Coins className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Unit Economics</p>
                  <p className="text-[10px] text-slate-400">LTV/CAC, Take Rate</p>
                </div>
              </Button>
              
              <Button
                onClick={onOpenOperatorDashboard}
                className="h-auto p-4 flex flex-col items-start gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700"
              >
                <Database className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">거래 리포트</p>
                  <p className="text-[10px] text-slate-400">품질 인증 문서</p>
                </div>
              </Button>
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer CTA */}
      <div className="px-4 pb-8">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={onBack}
          >
            돌아가기
          </Button>
          {isAdmin && (
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setShowUpdateModal(true)}
            >
              <Flag className="w-4 h-4 mr-2" />
              진행 상황 업데이트
            </Button>
          )}
        </div>
      </div>

      {/* Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Flag className="w-5 h-5 text-blue-400" />
              진행 상황 업데이트
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">전체 진행률 (%)</Label>
              <Input
                type="number"
                value={editValues.totalProgress}
                onChange={(e) => setEditValues({...editValues, totalProgress: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 text-white"
                min={0}
                max={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">완료 마일스톤 수</Label>
              <Input
                type="number"
                value={editValues.completedMilestones}
                onChange={(e) => setEditValues({...editValues, completedMilestones: Number(e.target.value)})}
                className="bg-slate-800 border-slate-700 text-white"
                min={0}
                max={16}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">예상 시리즈 A 시점</Label>
              <Input
                value={editValues.seriesATarget}
                onChange={(e) => setEditValues({...editValues, seriesATarget: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="예: 2025 Q3"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">현재 자산 가치 (₩)</Label>
              <Input
                value={editValues.assetValue}
                onChange={(e) => setEditValues({...editValues, assetValue: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="예: 1,247,850,000"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setShowUpdateModal(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleSaveUpdate}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterRoadmapView;
