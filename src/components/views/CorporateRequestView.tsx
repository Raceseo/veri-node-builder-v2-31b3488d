import { useState, useMemo } from "react";
import { 
  ArrowLeft,
  Building2,
  Shield,
  Users,
  Target,
  Sparkles,
  FileText,
  TrendingUp,
  CheckCircle2,
  Coins,
  Zap,
  BarChart3,
  PieChart,
  Brain,
  Lock,
  Heart,
  Briefcase,
  GraduationCap,
  Car,
  Home,
  CreditCard,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CorporateRequestViewProps {
  onBack: () => void;
  onOpenSensitiveDataRequest?: () => void;
  onOpenProjectBuilder?: () => void;
  onOpenSampleMonitor?: () => void;
}

interface VerificationItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  integrityBoost: number;
  costMultiplier: number;
  platinumRatio: number;
}

const verificationItems: VerificationItem[] = [
  { 
    id: "income", 
    name: "소득 수준 인증", 
    description: "국세청 연동 소득 증빙",
    icon: CreditCard, 
    integrityBoost: 15, 
    costMultiplier: 1.3,
    platinumRatio: 25
  },
  { 
    id: "health", 
    name: "건강 진단 인증", 
    description: "건강보험공단 검진 데이터",
    icon: Heart, 
    integrityBoost: 18, 
    costMultiplier: 1.4,
    platinumRatio: 30
  },
  { 
    id: "employment", 
    name: "재직 증명 인증", 
    description: "4대보험 가입 확인",
    icon: Briefcase, 
    integrityBoost: 12, 
    costMultiplier: 1.2,
    platinumRatio: 20
  },
  { 
    id: "education", 
    name: "학력 인증", 
    description: "학적 증명서 연동",
    icon: GraduationCap, 
    integrityBoost: 10, 
    costMultiplier: 1.15,
    platinumRatio: 15
  },
  { 
    id: "vehicle", 
    name: "차량 보유 인증", 
    description: "자동차등록원부 확인",
    icon: Car, 
    integrityBoost: 8, 
    costMultiplier: 1.1,
    platinumRatio: 12
  },
  { 
    id: "property", 
    name: "부동산 보유 인증", 
    description: "등기부등본 연동",
    icon: Home, 
    integrityBoost: 20, 
    costMultiplier: 1.5,
    platinumRatio: 35
  },
  { 
    id: "fitness", 
    name: "피트니스 활동 인증", 
    description: "웨어러블 건강 데이터",
    icon: Activity, 
    integrityBoost: 6, 
    costMultiplier: 1.08,
    platinumRatio: 10
  },
];

const sampleReportSections = [
  { title: "타겟 세그먼트 분석", description: "연령/소득/직업군 교차 분석" },
  { title: "구매 의향 예측 모델", description: "AI 기반 전환율 예측" },
  { title: "경쟁사 대비 포지셔닝", description: "시장 내 위치 분석" },
  { title: "마케팅 채널 최적화", description: "효율적 타겟팅 전략 제안" },
];

export const CorporateRequestView = ({ onBack, onOpenSensitiveDataRequest, onOpenProjectBuilder, onOpenSampleMonitor }: CorporateRequestViewProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(["employment"]);
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(false);
  const [targetCount, setTargetCount] = useState(500);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");

  // Calculate integrity score based on selected items
  const integrityScore = useMemo(() => {
    const baseScore = 40;
    const bonus = selectedItems.reduce((acc, id) => {
      const item = verificationItems.find(v => v.id === id);
      return acc + (item?.integrityBoost || 0);
    }, 0);
    return Math.min(100, baseScore + bonus);
  }, [selectedItems]);

  // Calculate platinum ratio
  const platinumRatio = useMemo(() => {
    if (selectedItems.length === 0) return 5;
    const avgRatio = selectedItems.reduce((acc, id) => {
      const item = verificationItems.find(v => v.id === id);
      return acc + (item?.platinumRatio || 0);
    }, 0) / selectedItems.length;
    return Math.round(avgRatio);
  }, [selectedItems]);

  // Calculate real-time pricing
  const pricing = useMemo(() => {
    const basePrice = 1500; // Base price per response
    const costMultiplier = selectedItems.reduce((acc, id) => {
      const item = verificationItems.find(v => v.id === id);
      return acc * (item?.costMultiplier || 1);
    }, 1);
    const aiCost = includeAIAnalysis ? 500000 : 0;
    const perResponseCost = Math.round(basePrice * costMultiplier);
    const subtotal = perResponseCost * targetCount;
    const total = subtotal + aiCost;
    
    return {
      perResponse: perResponseCost,
      subtotal,
      aiCost,
      total
    };
  }, [selectedItems, targetCount, includeAIAnalysis]);

  const handleItemToggle = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const getIntegrityColor = () => {
    if (integrityScore >= 80) return "text-emerald-400";
    if (integrityScore >= 60) return "text-cyan-400";
    if (integrityScore >= 40) return "text-amber-400";
    return "text-slate-400";
  };

  const getIntegrityGradient = () => {
    if (integrityScore >= 80) return "from-emerald-500 to-teal-500";
    if (integrityScore >= 60) return "from-cyan-500 to-blue-500";
    if (integrityScore >= 40) return "from-amber-500 to-orange-500";
    return "from-slate-500 to-slate-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 bg-slate-950/90 backdrop-blur-xl border-b border-blue-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">기업용 설문 의뢰</h1>
            <p className="text-xs text-blue-300/70">Corporate Survey Request</p>
          </div>
          <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30 gap-1">
            <Building2 className="w-3 h-3" />
            Enterprise
          </Badge>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Survey Basic Info */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">설문 기본 정보</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">설문 제목</label>
              <Input
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                placeholder="예: 2025 IT 직장인 근무 환경 조사"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">설문 설명</label>
              <Textarea
                value={surveyDescription}
                onChange={(e) => setSurveyDescription(e.target.value)}
                placeholder="설문의 목적과 활용 계획을 간략히 설명해주세요..."
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Targeting Section */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white">타겟 설정</h2>
            </div>
            <span className="text-xs text-slate-500">API 인증 항목</span>
          </div>

          <div className="grid gap-3 mb-6">
            {verificationItems.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemToggle(item.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    isSelected 
                      ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10" 
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50"
                  )}
                >
                  <Checkbox 
                    checked={isSelected}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isSelected ? "bg-blue-500/30" : "bg-slate-700/50"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      isSelected ? "text-blue-300" : "text-slate-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-white" : "text-slate-300"
                    )}>{item.name}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-blue-300" : "text-slate-500"
                    )}>+{item.integrityBoost}%</p>
                    <p className="text-[10px] text-slate-600">무결성</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Data Integrity Gauge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">예상 데이터 무결성 지수</span>
              </div>
              <span className={cn("text-2xl font-bold", getIntegrityColor())}>
                {integrityScore}%
              </span>
            </div>
            
            {/* Gauge Bar */}
            <div className="relative h-4 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500",
                  getIntegrityGradient()
                )}
                style={{ width: `${integrityScore}%` }}
              />
              {/* Markers */}
              <div className="absolute inset-0 flex">
                {[25, 50, 75].map((mark) => (
                  <div 
                    key={mark}
                    className="absolute top-0 bottom-0 w-px bg-slate-600"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-[10px] text-slate-500">
              <span>기본</span>
              <span>표준</span>
              <span>고급</span>
              <span>프리미엄</span>
            </div>
          </div>
        </div>

        {/* Target Count */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">응답자 규모</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(100, parseInt(e.target.value) || 100))}
              className="w-32 bg-slate-800/50 border-slate-700 text-white text-center text-lg font-bold"
              min={100}
              step={100}
            />
            <span className="text-slate-400">명</span>
            <div className="flex-1 flex gap-2">
              {[100, 500, 1000, 5000].map((count) => (
                <button
                  key={count}
                  onClick={() => setTargetCount(count)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    targetCount === count
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {count.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          
          {/* Platinum Ratio Indicator */}
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-white flex items-center justify-center">
                  <Zap className="w-3 h-3 text-slate-800" />
                </div>
                <span className="text-sm text-amber-200">예상 Platinum 등급 비율</span>
              </div>
              <span className="text-lg font-bold text-amber-300">{platinumRatio}%</span>
            </div>
          </div>
        </div>

        {/* Real-time Pricing Widget */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-blue-300" />
            <h2 className="font-bold text-white">실시간 견적</h2>
            <Badge className="ml-auto bg-emerald-500/20 text-emerald-300 border-0 text-xs">
              실시간 계산
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-blue-500/20">
              <span className="text-slate-400">응답 당 단가</span>
              <div className="text-right">
                <span className="text-lg font-bold text-white">₩{pricing.perResponse.toLocaleString()}</span>
                <span className="text-xs text-slate-500 ml-1">/건</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-blue-500/20">
              <span className="text-slate-400">설문 응답 비용 ({targetCount.toLocaleString()}건)</span>
              <span className="text-white font-medium">₩{pricing.subtotal.toLocaleString()}</span>
            </div>
            
            {includeAIAnalysis && (
              <div className="flex justify-between items-center py-2 border-b border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-slate-400">AI 심층 분석</span>
                </div>
                <span className="text-violet-300 font-medium">₩{pricing.aiCost.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-3">
              <span className="text-white font-semibold">총 예상 비용</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-blue-300">₩{pricing.total.toLocaleString()}</span>
                <p className="text-xs text-slate-500 mt-1">VAT 별도</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Option */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <h2 className="font-bold text-white">Gemini AI 심층 전략 분석</h2>
                <p className="text-xs text-slate-500">고급 인사이트 리포트 생성</p>
              </div>
            </div>
            <Switch 
              checked={includeAIAnalysis}
              onCheckedChange={setIncludeAIAnalysis}
              className="data-[state=checked]:bg-violet-500"
            />
          </div>

          {includeAIAnalysis && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">리포트 샘플 미리보기</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {sampleReportSections.map((section, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {index === 0 && <PieChart className="w-3 h-3 text-cyan-400" />}
                      {index === 1 && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                      {index === 2 && <BarChart3 className="w-3 h-3 text-amber-400" />}
                      {index === 3 && <Target className="w-3 h-3 text-rose-400" />}
                      <span className="text-xs font-medium text-white">{section.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{section.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-violet-200 font-medium">포함 항목</p>
                    <p className="text-[10px] text-violet-300/70 mt-1">
                      심층 세그먼트 분석 · 경쟁사 벤치마크 · 마케팅 전략 제안 · 
                      ROI 예측 모델 · 전문가 코멘터리
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sensitive Data Request Button */}
        {onOpenSensitiveDataRequest && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-gray-900/80 border border-lime-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-lime-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">민감 데이터 요청</h2>
                <p className="text-xs text-slate-500">사용자 금고 접근 권한 요청</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              건강 정밀 데이터, 상세 부채 내역 등 민감한 정보에 대한 접근 권한을 요청합니다.
            </p>
            <Button
              onClick={onOpenSensitiveDataRequest}
              className="w-full h-12 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white rounded-xl font-semibold"
            >
              <Lock className="w-4 h-4 mr-2" />
              민감 데이터 요청하기
            </Button>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="space-y-3 pt-4 pb-8">
          {onOpenSampleMonitor && (
            <Button
              onClick={onOpenSampleMonitor}
              className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold shadow-lg"
            >
              <Activity className="w-5 h-5 mr-2" />
              실시간 표본 수집 모니터
            </Button>
          )}
          {onOpenProjectBuilder && (
            <Button
              onClick={onOpenProjectBuilder}
              className="w-full h-14 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 rounded-2xl font-bold shadow-lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              프로젝트 의뢰 빌더로 이동
            </Button>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl"
              onClick={onBack}
            >
              임시 저장
            </Button>
            <Button
              className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold"
            >
              <Lock className="w-4 h-4 mr-2" />
              의뢰 제출
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateRequestView;
