import { useState, useMemo, useEffect } from "react";
import { 
  ArrowLeft, Plus, Trash2, Shield, TrendingUp, 
  CreditCard, FileText, Users, Target, CheckCircle2,
  AlertCircle, Zap, ChevronRight, Link2, Cpu, DollarSign,
  Clock, AlertTriangle, Activity, Gauge
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { PricingBreakdownCard } from "@/components/pricing/PricingBreakdownCard";
import { 
  calculatePurchasePrice, 
  GRADE_MULTIPLIERS, 
  URGENCY_MULTIPLIERS,
  REVENUE_SHARES 
} from "@/utils/pricingCalculator";
interface Question {
  id: string;
  text: string;
  crossVerify: boolean;
  apiType: string;
}

interface TemplateConfig {
  categoryId: string;
  categoryName: string;
  templateId: string;
  templateName: string;
  questions: Question[];
  requiredApis: string[];
  targetGrade: number;
}

interface ProjectBuilderViewProps {
  onBack: () => void;
  initialTemplate?: TemplateConfig | null;
}

const ProjectBuilderView = ({ onBack, initialTemplate }: ProjectBuilderViewProps) => {
  const [projectName, setProjectName] = useState(
    initialTemplate ? `${initialTemplate.categoryName} - ${initialTemplate.templateName}` : ""
  );
  const [researchPurpose, setResearchPurpose] = useState("");
  const [targetCount, setTargetCount] = useState(100);
  const [minGrade, setMinGrade] = useState(initialTemplate?.targetGrade ?? 1);
  const [questions, setQuestions] = useState<Question[]>(
    initialTemplate?.questions?.length 
      ? initialTemplate.questions 
      : [{ id: "1", text: "", crossVerify: false, apiType: "" }]
  );
  
  // AI Budget Optimizer State
  const [budgetMode, setBudgetMode] = useState<'strict' | 'goal'>('goal');
  const [rewardPerResponse, setRewardPerResponse] = useState(500);
  const [maxBudget, setMaxBudget] = useState(100000);
  const [bufferBudget, setBufferBudget] = useState(20000);
  const [urgency, setUrgency] = useState<'normal' | 'fast' | 'urgent'>('normal');
  const [showPricingBreakdown, setShowPricingBreakdown] = useState(false);
  const grades = [
    { name: "Silver", color: "text-slate-400", bgColor: "bg-slate-400", reliability: 72, costMultiplier: 1.0 },
    { name: "Gold", color: "text-amber-400", bgColor: "bg-amber-400", reliability: 88, costMultiplier: 1.5 },
    { name: "Platinum", color: "text-cyan-300", bgColor: "bg-gradient-to-r from-slate-300 to-cyan-300", reliability: 97, costMultiplier: 2.2 }
  ];

  const apiOptions = [
    { id: "card", label: "카드 결제 API", description: "소비 패턴 검증" },
    { id: "health", label: "건강검진 API", description: "건강 데이터 검증" },
    { id: "income", label: "소득 증빙 API", description: "소득 수준 검증" },
    { id: "career", label: "재직 증명 API", description: "직업 정보 검증" },
  ];

  const currentGrade = grades[minGrade];
  const crossVerifyCount = questions.filter(q => q.crossVerify).length;
  
  // 가격 계산 유틸 사용
  const gradeKey = ['silver', 'gold', 'platinum'][minGrade] as keyof typeof GRADE_MULTIPLIERS;
  const pricingResult = useMemo(() => calculatePurchasePrice({
    productType: 'survey',
    subCategory: crossVerifyCount > 0 ? 'cross_verified' : 'general',
    sampleCount: targetCount,
    targetGrade: gradeKey,
    urgency: urgency,
    hasCrossVerification: crossVerifyCount > 0,
  }), [targetCount, gradeKey, urgency, crossVerifyCount]);
  
  const unitCost = pricingResult.basePricePerUnit * pricingResult.gradeMultiplier;
  const crossVerifyCost = pricingResult.crossVerificationFee;
  const totalCost = pricingResult.totalPrice;
  // Budget Optimization Calculations
  const calculateOptimalCount = (reward: number) => {
    const costPerPerson = reward * currentGrade.costMultiplier + (crossVerifyCount * 200);
    if (budgetMode === 'strict') {
      return Math.floor(maxBudget / costPerPerson);
    }
    return Math.floor((maxBudget + bufferBudget) / costPerPerson);
  };

  const optimizedTargetCount = calculateOptimalCount(rewardPerResponse);
  const budgetUsagePercent = (totalCost / maxBudget) * 100;
  const isBudgetExceeded = totalCost > maxBudget;

  // Trade-off simulation data
  const tradeoffData = useMemo(() => {
    const data = [];
    for (let reward = 200; reward <= 1000; reward += 100) {
      const costPer = reward * currentGrade.costMultiplier + (crossVerifyCount * 200);
      const availableCount = Math.floor((budgetMode === 'strict' ? maxBudget : maxBudget + bufferBudget) / costPer);
      data.push({
        reward,
        count: availableCount,
        cost: costPer * availableCount,
      });
    }
    return data;
  }, [rewardPerResponse, currentGrade.costMultiplier, crossVerifyCount, maxBudget, bufferBudget, budgetMode]);

  // Budget depletion forecast data
  const depletionData = useMemo(() => {
    const dailyResponseRate = 50; // 예상 일일 응답률
    const totalDays = Math.ceil(targetCount / dailyResponseRate);
    const data = [];
    let remaining = maxBudget;
    const dailyCost = (rewardPerResponse * currentGrade.costMultiplier + crossVerifyCount * 200) * dailyResponseRate;
    
    for (let day = 0; day <= totalDays && remaining > 0; day++) {
      data.push({
        day: `${day}일`,
        remaining: Math.max(0, remaining),
        collected: Math.min(day * dailyResponseRate, targetCount),
      });
      remaining -= dailyCost;
    }
    return data;
  }, [targetCount, maxBudget, rewardPerResponse, currentGrade.costMultiplier, crossVerifyCount]);

  const estimatedCompletionDays = Math.ceil(targetCount / 50);
  const budgetDepletionDay = depletionData.find(d => d.remaining === 0)?.day || `${estimatedCompletionDays}일+`;

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now().toString(), 
      text: "", 
      crossVerify: false, 
      apiType: "" 
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast({ title: "입력 필요", description: "프로젝트 명을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!researchPurpose.trim()) {
      toast({ title: "입력 필요", description: "조사 목적을 입력해주세요.", variant: "destructive" });
      return;
    }
    toast({ 
      title: "프로젝트 의뢰 완료", 
      description: "결제 페이지로 이동합니다..." 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-200">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">프로젝트 의뢰 빌더</h1>
          <p className="text-xs text-slate-500">Project Request Builder</p>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-32">
        {/* ===== 1. 프로젝트 설정 섹션 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-slate-900">프로젝트 설정</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">프로젝트 명 *</label>
              <Input 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 2024 MZ세대 소비 트렌드 조사"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">조사 목적 *</label>
              <Textarea 
                value={researchPurpose}
                onChange={(e) => setResearchPurpose(e.target.value)}
                placeholder="본 조사의 목적과 활용 계획을 상세히 기술해주세요."
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">타겟 응답자 수</label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-500 text-sm">명</span>
                <div className="flex items-center gap-1 ml-auto text-blue-600 text-sm">
                  <Users className="w-4 h-4" />
                  <span>최소 10명 이상</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 2. 타겟 정밀도 설정 ===== */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">타겟 정밀도 설정</h2>
              <p className="text-xs text-blue-300">The Core • 핵심 설정</p>
            </div>
          </div>

          {/* Grade Slider */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-300 mb-4 block">최소 응답 등급</label>
            
            <div className="px-2">
              <Slider
                value={[minGrade]}
                onValueChange={(value) => setMinGrade(value[0])}
                max={2}
                min={0}
                step={1}
                className="mb-4"
              />
            </div>

            {/* Grade Labels */}
            <div className="flex justify-between px-1">
              {grades.map((grade, index) => (
                <button
                  key={grade.name}
                  onClick={() => setMinGrade(index)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all",
                    minGrade === index ? "scale-110" : "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2",
                    minGrade === index ? "border-white" : "border-transparent",
                    grade.bgColor
                  )}>
                    <Shield className="w-5 h-5 text-slate-900" />
                  </div>
                  <span className={cn("text-xs font-medium", grade.color)}>{grade.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-2 gap-3">
            {/* Data Reliability Index */}
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">데이터 신뢰도 지수</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-3xl font-bold", currentGrade.color)}>
                  {currentGrade.reliability}
                </span>
                <span className="text-slate-500 text-sm">%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", currentGrade.bgColor)}
                  style={{ width: `${currentGrade.reliability}%` }}
                />
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">예상 견적</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-400">
                  ₩{totalCost.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                단가 ₩{Math.round(unitCost).toLocaleString()}/응답
              </p>
            </div>
          </div>

          {/* Grade Description */}
          <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <p className="text-sm text-blue-200">
              {minGrade === 0 && "Silver 등급: 기본 인증을 완료한 사용자로부터 응답을 수집합니다."}
              {minGrade === 1 && "Gold 등급: 3개 이상의 데이터를 인증한 신뢰도 높은 사용자가 응답합니다."}
              {minGrade === 2 && "Platinum 등급: 5개 이상의 API 인증을 완료한 최고 신뢰도 사용자만 참여합니다."}
            </p>
          </div>
        </section>

        {/* ===== AI 예산 최적화 도구 ===== */}
        <section className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI 예산 최적화 도구</h2>
              <p className="text-xs text-blue-600">Smart Budget Optimizer</p>
            </div>
          </div>

          {/* 1. 예산 설정 모드 선택 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-700 mb-3 block">예산 설정 모드</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBudgetMode('strict')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  budgetMode === 'strict' 
                    ? "border-blue-600 bg-blue-50" 
                    : "border-slate-200 bg-white hover:border-blue-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    budgetMode === 'strict' ? "bg-blue-600" : "bg-slate-200"
                  )}>
                    <DollarSign className={cn(
                      "w-3.5 h-3.5",
                      budgetMode === 'strict' ? "text-white" : "text-slate-500"
                    )} />
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    budgetMode === 'strict' ? "text-blue-900" : "text-slate-700"
                  )}>
                    철저 예산형
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  보상이 올라가면 자동으로 모집 인원수를 줄여 총 예산을 고정합니다
                </p>
              </button>

              <button
                onClick={() => setBudgetMode('goal')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  budgetMode === 'goal' 
                    ? "border-blue-600 bg-blue-50" 
                    : "border-slate-200 bg-white hover:border-blue-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    budgetMode === 'goal' ? "bg-blue-600" : "bg-slate-200"
                  )}>
                    <Target className={cn(
                      "w-3.5 h-3.5",
                      budgetMode === 'goal' ? "text-white" : "text-slate-500"
                    )} />
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    budgetMode === 'goal' ? "text-blue-900" : "text-slate-700"
                  )}>
                    목표 달성형
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  설정한 버퍼 예산 내에서 보상을 최대치로 올려 인원수를 채웁니다
                </p>
              </button>
            </div>
          </div>

          {/* Budget Settings */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">최대 예산</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₩</span>
                <Input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Math.max(10000, parseInt(e.target.value) || 10000))}
                  className="pl-8 border-slate-300"
                />
              </div>
            </div>
            {budgetMode === 'goal' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">버퍼 예산</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+₩</span>
                  <Input
                    type="number"
                    value={bufferBudget}
                    onChange={(e) => setBufferBudget(Math.max(0, parseInt(e.target.value) || 0))}
                    className="pl-10 border-slate-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. 실시간 시뮬레이터 */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">실시간 Trade-off 시뮬레이터</span>
              </div>
              <span className="text-xs text-slate-500">보상 ↔ 인원수</span>
            </div>

            {/* Reward Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">응답자 보상금</span>
                <span className="text-lg font-bold text-blue-600">₩{rewardPerResponse.toLocaleString()}</span>
              </div>
              <Slider
                value={[rewardPerResponse]}
                onValueChange={(value) => setRewardPerResponse(value[0])}
                max={1000}
                min={200}
                step={50}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>₩200</span>
                <span>₩1,000</span>
              </div>
            </div>

            {/* Trade-off Warning */}
            <div className={cn(
              "p-3 rounded-lg border-2 transition-all",
              rewardPerResponse > 500 
                ? "bg-amber-50 border-amber-300" 
                : "bg-green-50 border-green-200"
            )}>
              <div className="flex items-start gap-2">
                {rewardPerResponse > 500 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    rewardPerResponse > 500 ? "text-amber-800" : "text-green-800"
                  )}>
                    {rewardPerResponse > 500 
                      ? `보상을 ${(rewardPerResponse - 500).toLocaleString()}원 올릴 경우`
                      : "현재 설정에서"
                    }
                  </p>
                  <p className={cn(
                    "text-sm",
                    rewardPerResponse > 500 ? "text-amber-700" : "text-green-700"
                  )}>
                    수집 가능 인원: <span className="font-bold">{targetCount.toLocaleString()}명</span> → 
                    <span className="font-bold ml-1">{optimizedTargetCount.toLocaleString()}명</span>으로 조정됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* Mini Chart for Trade-off */}
            <div className="mt-4 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tradeoffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="reward" tickFormatter={(v) => `₩${v}`} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'count' ? `${value}명` : `₩${value.toLocaleString()}`,
                      name === 'count' ? '수집 가능 인원' : '총 비용'
                    ]}
                    labelFormatter={(label) => `보상: ₩${label}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. 예산 소진 예보 */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-800">예산 소진 예보</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">현재 속도 기준</span>
              </div>
            </div>

            {/* Budget Status */}
            <div className={cn(
              "p-3 rounded-lg mb-4",
              isBudgetExceeded ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  isBudgetExceeded ? "text-red-700" : "text-blue-700"
                )}>
                  예산 사용률
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isBudgetExceeded ? "text-red-600" : "text-blue-600"
                )}>
                  {Math.min(budgetUsagePercent, 150).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isBudgetExceeded 
                      ? "bg-gradient-to-r from-red-400 to-red-600" 
                      : "bg-gradient-to-r from-blue-400 to-blue-600"
                  )}
                  style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                />
              </div>
              {isBudgetExceeded && (
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">
                    예산 한도 초과! ₩{(totalCost - maxBudget).toLocaleString()} 초과됨
                  </span>
                </div>
              )}
            </div>

            {/* Depletion Chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={depletionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'remaining' ? `₩${value.toLocaleString()}` : `${value}명`,
                      name === 'remaining' ? '잔여 예산' : '수집된 응답'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="remaining" 
                    stroke="#3b82f6" 
                    fill="url(#budgetGradient)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <p className="text-sm text-indigo-700">
                  현재 속도로 진행 시 <span className="font-bold">{budgetDepletionDay}</span>에 예산이 소진됩니다
                </p>
              </div>
            </div>
          </div>

          {/* Optimization Summary */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">AI 최적화 추천</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-200 mb-1">추천 보상금</p>
                <p className="text-lg font-bold text-white">₩{rewardPerResponse.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-200 mb-1">최적 인원</p>
                <p className="text-lg font-bold text-white">{optimizedTargetCount.toLocaleString()}명</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3. 질문 속성 연결 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-slate-900">질문 구성</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addQuestion}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" /> 질문 추가
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div 
                key={question.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">질문 {index + 1}</span>
                  {questions.length > 1 && (
                    <button 
                      onClick={() => removeQuestion(question.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Input 
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="질문 내용을 입력하세요"
                  className="border-slate-300"
                />

                {/* Cross-Verify Checkbox */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id={`crossVerify-${question.id}`}
                      checked={question.crossVerify}
                      onCheckedChange={(checked) => updateQuestion(question.id, { 
                        crossVerify: !!checked,
                        apiType: checked ? question.apiType : ""
                      })}
                      className="mt-0.5 border-blue-400 data-[state=checked]:bg-blue-600"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`crossVerify-${question.id}`}
                        className="text-sm font-medium text-blue-900 cursor-pointer"
                      >
                        이 질문을 특정 API 데이터와 교차 검증하시겠습니까?
                      </label>
                      <p className="text-xs text-blue-600 mt-1">
                        응답의 정확성을 실제 데이터로 검증하여 신뢰도를 높입니다
                      </p>
                    </div>
                    <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                  </div>

                  {/* API Selection */}
                  {question.crossVerify && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700 mb-2">검증할 API 데이터 선택:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {apiOptions.map((api) => (
                          <button
                            key={api.id}
                            onClick={() => updateQuestion(question.id, { apiType: api.id })}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg text-left transition-all text-sm",
                              question.apiType === api.id
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
                            )}
                          >
                            {question.apiType === api.id ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-xs">{api.label}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {crossVerifyCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                교차 검증 질문 {crossVerifyCount}개 · 추가 비용 +₩{crossVerifyCost.toLocaleString()}
              </p>
            </div>
          )}
        </section>

        {/* ===== 견적 요약 ===== */}
        <section className="bg-slate-900 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">견적 요약</h3>
            <button 
              onClick={() => setShowPricingBreakdown(!showPricingBreakdown)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              {showPricingBreakdown ? '간략히 보기' : '상세 보기'}
              <ChevronRight className={cn("w-3 h-3 transition-transform", showPricingBreakdown && "rotate-90")} />
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">기본 응답 수집</span>
              <span className="text-white">₩{pricingResult.basePricePerUnit.toLocaleString()} × {targetCount}명</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">타겟 등급 ({currentGrade.name})</span>
              <span className="text-white">×{pricingResult.gradeMultiplier}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">수집 속도 ({urgency === 'urgent' ? '긴급' : urgency === 'fast' ? '빠름' : '일반'})</span>
              <span className="text-white">×{pricingResult.urgencyMultiplier}</span>
            </div>
            {crossVerifyCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">교차 검증 ({crossVerifyCount}개 질문)</span>
                <span className="text-white">+₩{crossVerifyCost.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
              <span className="text-white font-medium">총 예상 견적</span>
              <span className="text-2xl font-bold text-amber-400">₩{totalCost.toLocaleString()}</span>
            </div>
          </div>

          {/* 수익 분배 미리보기 */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                데이터 제공자에게 분배
              </span>
              <span className="text-emerald-300 font-semibold">
                ₩{pricingResult.supplierPool.toLocaleString()} ({100 - REVENUE_SHARES.platform_fee_percent}%)
              </span>
            </div>
            <p className="text-xs text-emerald-400/70 mt-1.5">
              1인당 예상 보상: {pricingResult.estimatedPerSupplier.silver.toLocaleString()}~{pricingResult.estimatedPerSupplier.platinum.toLocaleString()} VN
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300">
              데이터 신뢰도 {currentGrade.reliability}% 이상의 응답만 수집됩니다
            </p>
          </div>
        </section>

        {/* 상세 가격 구성표 (토글) */}
        {showPricingBreakdown && (
          <PricingBreakdownCard
            basePricePerUnit={pricingResult.basePricePerUnit}
            sampleCount={targetCount}
            gradeMultiplier={pricingResult.gradeMultiplier}
            urgencyMultiplier={pricingResult.urgencyMultiplier}
            crossVerificationFee={crossVerifyCost}
            totalPrice={totalCost}
            platformFee={pricingResult.platformFee}
            supplierPool={pricingResult.supplierPool}
            estimatedPerSupplier={pricingResult.estimatedPerSupplier}
            targetGrade={gradeKey}
            urgency={urgency}
            hasCrossVerification={crossVerifyCount > 0}
          />
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
        <Button 
          onClick={handleSubmit}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 shadow-lg"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          ₩{totalCost.toLocaleString()} 결제하기
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">
          결제 완료 후 즉시 프로젝트가 시작됩니다
        </p>
      </div>
    </div>
  );
};

export default ProjectBuilderView;
