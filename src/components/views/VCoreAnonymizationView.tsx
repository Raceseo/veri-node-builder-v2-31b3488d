import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Cpu, Lock, Eye, EyeOff, Zap,
  CheckCircle2, Database, TrendingUp, Activity, RefreshCw,
  FileText, User, CreditCard, MapPin, Heart, Clock,
  ShieldCheck, Fingerprint, Binary, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VCoreAnonymizationViewProps {
  onBack: () => void;
  onPhase2Progress?: (progress: number) => void;
}

// 데이터 카테고리별 상태
const dataCategories = [
  { 
    id: "finance", 
    name: "금융 데이터", 
    icon: CreditCard, 
    color: "emerald",
    freshness: 98,
    combinability: 85,
    anonymized: true,
    samples: 1247
  },
  { 
    id: "health", 
    name: "건강 데이터", 
    icon: Heart, 
    color: "rose",
    freshness: 92,
    combinability: 78,
    anonymized: true,
    samples: 456
  },
  { 
    id: "mobility", 
    name: "동선 데이터", 
    icon: MapPin, 
    color: "amber",
    freshness: 95,
    combinability: 92,
    anonymized: false,
    samples: 892
  },
  { 
    id: "consumption", 
    name: "소비 패턴", 
    icon: Database, 
    color: "blue",
    freshness: 88,
    combinability: 95,
    anonymized: true,
    samples: 2134
  },
];

// 익명화 단계
type AnonymizationStage = "idle" | "scanning" | "masking" | "hashing" | "validating" | "complete";

const VCoreAnonymizationView = ({ onBack, onPhase2Progress }: VCoreAnonymizationViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [anonymizationStage, setAnonymizationStage] = useState<AnonymizationStage>("idle");
  const [totalAssetValue, setTotalAssetValue] = useState(2847320);
  const [processingData, setProcessingData] = useState<string[]>([]);
  const [completedAnonymizations, setCompletedAnonymizations] = useState(0);
  
  // 익명화 진행률 기반 Phase 2 진행률 계산
  const phase2Progress = Math.min(75 + Math.floor(completedAnonymizations * 6.25), 100);
  
  // Phase 2 진행률 업데이트
  useEffect(() => {
    if (onPhase2Progress) {
      onPhase2Progress(phase2Progress);
    }
  }, [phase2Progress, onPhase2Progress]);

  // 실시간 자산 가치 계산 (신선도 + 결합도 기반)
  useEffect(() => {
    const interval = setInterval(() => {
      const freshnessAvg = dataCategories.reduce((sum, cat) => sum + cat.freshness, 0) / dataCategories.length;
      const combinabilityAvg = dataCategories.reduce((sum, cat) => sum + cat.combinability, 0) / dataCategories.length;
      const multiplier = (freshnessAvg * 0.6 + combinabilityAvg * 0.4) / 100;
      
      setTotalAssetValue(prev => {
        const baseValue = 2500000;
        const fluctuation = Math.random() * 1000 - 300;
        return Math.floor(baseValue * multiplier + fluctuation);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 익명화 프로세스 실행
  const runAnonymization = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setProcessingData([]);
    
    // 단계별 진행
    setAnonymizationStage("scanning");
    setProcessingData(prev => [...prev, "원본 데이터 스캐닝..."]);
    
    setTimeout(() => {
      setAnonymizationStage("masking");
      setProcessingData(prev => [...prev, "PII(개인식별정보) 마스킹 중..."]);
    }, 1500);
    
    setTimeout(() => {
      setAnonymizationStage("hashing");
      setProcessingData(prev => [...prev, "SHA-256 해싱 적용..."]);
    }, 3000);
    
    setTimeout(() => {
      setAnonymizationStage("validating");
      setProcessingData(prev => [...prev, "K-익명성 검증 중..."]);
    }, 4500);
    
    setTimeout(() => {
      setAnonymizationStage("complete");
      setProcessingData(prev => [...prev, "✓ 익명화 완료 - 무결성 99.9% 보장"]);
      setCompletedAnonymizations(prev => prev + 1);
    }, 6000);
    
    setTimeout(() => {
      setAnonymizationStage("idle");
      setSelectedCategory(null);
    }, 8000);
  }, []);

  const getStageProgress = () => {
    switch (anonymizationStage) {
      case "scanning": return 20;
      case "masking": return 45;
      case "hashing": return 70;
      case "validating": return 90;
      case "complete": return 100;
      default: return 0;
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
      rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/30" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-purple-500/20">
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
                <Cpu className="w-5 h-5 text-purple-400" />
                <h1 className="text-lg font-bold text-white">V-Core 익명화 엔진</h1>
              </div>
              <p className="text-xs text-slate-500">Phase 2 핵심 기능</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">ENGINE ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Real-time Asset Value Dashboard */}
      <section className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 rounded-2xl p-5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                실시간 데이터 자산 가치
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">₩</span>
                <motion.span
                  key={totalAssetValue}
                  initial={{ opacity: 0.5, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent"
                >
                  {formatValue(totalAssetValue)}
                </motion.span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +3.2% Today
              </p>
              <p className="text-[10px] text-slate-500 mt-1">신선도 × 결합도 기반</p>
            </div>
          </div>
          
          {/* Value Factors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">평균 신선도</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">93.3%</span>
                <Progress value={93.3} className="flex-1 h-1.5" />
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">평균 결합도</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">87.5%</span>
                <Progress value={87.5} className="flex-1 h-1.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Phase 2 Progress Sync */}
      <section className="px-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Phase 2 진행률</span>
            </div>
            <span className="text-sm font-bold text-amber-400">{phase2Progress}%</span>
          </div>
          <Progress value={phase2Progress} className="h-2 bg-slate-700" />
          <p className="text-[10px] text-slate-500 mt-2">
            완료된 익명화: {completedAnonymizations}건 | 자동 로드맵 연동 중
          </p>
        </div>
      </section>

      {/* Anonymization Process Visualization */}
      <AnimatePresence>
        {anonymizationStage !== "idle" && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-6"
          >
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu className="w-5 h-5 text-purple-400" />
                </motion.div>
                <span className="text-sm font-bold text-white">V-Core 익명화 진행 중</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>진행률</span>
                  <span>{getStageProgress()}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${getStageProgress()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {/* Processing Log */}
              <div className="space-y-2 font-mono text-xs">
                {processingData.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 ${
                      log.includes("✓") ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {log.includes("✓") ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Binary className="w-3 h-3" />
                      </motion.div>
                    )}
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Visual Data Flow */}
              {anonymizationStage !== "complete" && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] text-slate-500">원본</span>
                  </div>
                  <motion.div
                    className="flex-1 h-0.5 bg-gradient-to-r from-slate-500 via-purple-500 to-emerald-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div className="flex items-center gap-1">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">익명화</span>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Data Categories */}
      <section className="px-4 mb-6">
        <h2 className="text-sm font-bold text-white mb-3">데이터 카테고리별 현황</h2>
        <div className="space-y-3">
          {dataCategories.map((category, index) => {
            const colors = getColorClasses(category.color);
            const isProcessing = selectedCategory === category.id && anonymizationStage !== "idle";
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800/50 rounded-xl p-4 border ${colors.border} ${
                  isProcessing ? "ring-2 ring-purple-500/50" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <category.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{category.name}</p>
                      <p className="text-xs text-slate-500">{category.samples.toLocaleString()} 샘플</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {category.anonymized ? (
                      <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        익명화 완료
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => runAnonymization(category.id)}
                        disabled={isProcessing}
                        className="text-xs bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Cpu className="w-3 h-3 mr-1" />
                            익명화
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Freshness & Combinability */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">신선도</span>
                      <span className="text-white font-medium">{category.freshness}%</span>
                    </div>
                    <Progress value={category.freshness} className="h-1.5 bg-slate-700" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">결합도</span>
                      <span className="text-white font-medium">{category.combinability}%</span>
                    </div>
                    <Progress value={category.combinability} className="h-1.5 bg-slate-700" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* V-Core Certificate */}
      <section className="px-4 pb-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">V-Core 인증서</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-slate-400 uppercase">익명화 표준</span>
              </div>
              <p className="text-sm font-bold text-white">정부 가이드라인 준수</p>
              <p className="text-[10px] text-emerald-400 mt-1">✓ 개인정보보호법 적합</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-slate-400 uppercase">무결성 보증</span>
              </div>
              <p className="text-sm font-bold text-white">99.9% 보장</p>
              <p className="text-[10px] text-blue-400 mt-1">✓ SHA-256 검증 완료</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center">
            <Button onClick={onBack} className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VCoreAnonymizationView;
