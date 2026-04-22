import { useState, useEffect } from "react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Crown, 
  Brain,
  Target,
  Heart,
  Users,
  Zap,
  Wallet,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PersonaAnalysisViewProps {
  onBack: () => void;
}

interface PersonaData {
  subject: string;
  value: number;
  fullMark: number;
  icon: React.ElementType;
}

const personaData: PersonaData[] = [
  { subject: "경제력", value: 72, fullMark: 100, icon: Wallet },
  { subject: "전문성", value: 85, fullMark: 100, icon: Brain },
  { subject: "건강 관심도", value: 68, fullMark: 100, icon: Heart },
  { subject: "사회적 기여", value: 55, fullMark: 100, icon: Users },
  { subject: "트렌드 민감도", value: 78, fullMark: 100, icon: Zap },
];

const personaSummaries = [
  "실속 있는 자기관리형 전문가",
  "트렌드를 선도하는 디지털 네이티브",
  "균형 잡힌 라이프스타일 추구자",
  "성장 지향적 커리어 빌더",
  "건강한 소비를 지향하는 스마트 컨슈머",
];

export const PersonaAnalysisView = ({ onBack }: PersonaAnalysisViewProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnalyzing(false);
              setShowResults(true);
            }, 300);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const totalScore = Math.round(personaData.reduce((acc, d) => acc + d.value, 0) / personaData.length);
  const currentTier = "Silver";
  const currentValue = 35000;
  const platinumValue = 70000;

  // Analysis Loading Screen
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center px-6">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Brain className="w-16 h-16 text-violet-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-ping" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">AI 페르소나 분석 중</h2>
        <p className="text-white/60 text-sm text-center mb-6">
          연동된 데이터를 기반으로<br />당신만의 디지털 트윈을 생성하고 있습니다
        </p>

        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-100"
            style={{ width: `${analysisProgress}%` }}
          />
        </div>
        <p className="text-violet-400 text-sm font-medium">{analysisProgress}%</p>

        <div className="mt-8 space-y-2 text-center">
          {analysisProgress > 20 && (
            <p className="text-white/40 text-xs animate-fade-in">📊 경제 활동 패턴 분석 중...</p>
          )}
          {analysisProgress > 40 && (
            <p className="text-white/40 text-xs animate-fade-in">🎯 전문성 지표 계산 중...</p>
          )}
          {analysisProgress > 60 && (
            <p className="text-white/40 text-xs animate-fade-in">❤️ 라이프스타일 성향 파악 중...</p>
          )}
          {analysisProgress > 80 && (
            <p className="text-white/40 text-xs animate-fade-in">✨ 페르소나 프로필 생성 중...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white">My Digital Twin</h1>
            <p className="text-xs text-white/50">AI 페르소나 분석</p>
          </div>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
            <Brain className="w-3 h-3 mr-1" />
            AI 분석
          </Badge>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Persona Summary */}
        <div className={cn(
          "p-6 rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 border border-violet-500/20",
          showResults && "animate-fade-in"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-violet-300 font-medium">AI 종합 분석</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            당신은{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {personaSummaries[0]}
            </span>
            입니다
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            연동된 데이터를 종합 분석한 결과, 전문성과 트렌드 감각이 뛰어나며 
            실용적인 자기관리 능력을 갖추고 있습니다.
          </p>
        </div>

        {/* Radar Chart */}
        <div className={cn(
          "p-6 rounded-3xl bg-slate-900/50 border border-white/10",
          showResults && "animate-fade-in"
        )}
        style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white">페르소나 레이더</h3>
              <p className="text-xs text-white/50">5개 핵심 지표 분석</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{totalScore}</span>
              <span className="text-white/50 text-sm">점</span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={personaData}>
                <PolarGrid 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeDasharray="3 3"
                />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                  tickLine={false}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="페르소나"
                  dataKey="value"
                  stroke="url(#radarGradient)"
                  fill="url(#radarFillGradient)"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#D946EF" />
                  </linearGradient>
                  <linearGradient id="radarFillGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#D946EF" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {personaData.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.subject} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-1 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-xs text-white/50 truncate">{item.subject}</p>
                  <p className="text-sm font-bold text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Value Card */}
        <div className={cn(
          "p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20",
          showResults && "animate-fade-in"
        )}
        style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">데이터 몸값</h3>
              <p className="text-xs text-amber-300/70">현재 가치 평가</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">현재 등급</span>
              <Badge className="bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800 border-0 font-bold">
                {currentTier}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                ₩{currentValue.toLocaleString()}
              </span>
              <span className="text-white/40 text-sm">/월</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium">플래티넘 달성 시</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  ₩{platinumValue.toLocaleString()}
                </span>
                <span className="text-white/40 text-sm">/월</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-bold">
                  +{Math.round(((platinumValue - currentValue) / currentValue) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-amber-200/70 leading-relaxed">
            당신의 종합 데이터 가치는 현재 <span className="font-bold text-amber-300">{currentTier} 등급</span> 기준 
            월 <span className="font-bold text-amber-300">₩{currentValue.toLocaleString()}</span> 수준입니다. 
            플래티넘 달성 시 <span className="font-bold text-amber-300">₩{platinumValue.toLocaleString()}</span>까지 상승 가능합니다.
          </p>
        </div>

        {/* Upgrade CTA */}
        <button className="w-full p-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">등급 올리고 수익 2배 받기</p>
              <p className="text-sm text-white/70">추가 데이터 연동하기</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Bottom Padding */}
        <div className="h-8" />
      </div>
    </div>
  );
};

export default PersonaAnalysisView;
