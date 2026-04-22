import { useState, useMemo } from "react";
import { 
  ArrowLeft, Shield, TrendingUp, Users, BarChart3, 
  CheckCircle2, AlertTriangle, Award, Cpu, Target,
  FileCheck, Gauge, PieChart, Activity, Sparkles, Scale
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatisticalValidityViewProps {
  onBack: () => void;
  onOpenObjectivityCertification?: () => void;
}

const StatisticalValidityView = ({ onBack, onOpenObjectivityCertification }: StatisticalValidityViewProps) => {
  // Mock survey statistics data
  const [sampleSize] = useState(487);
  const [targetSize] = useState(500);
  const [confidenceLevel] = useState(95);
  const [marginOfError] = useState(4.2);

  const sampleSufficiency = (sampleSize / targetSize) * 100;
  const isDataSufficient = sampleSufficiency >= 80;

  // Respondent quality data
  const qualityData = [
    { name: "Platinum", value: 80, color: "#06b6d4", icon: "🏆" },
    { name: "Gold", value: 15, color: "#f59e0b", icon: "🥇" },
    { name: "Silver", value: 5, color: "#94a3b8", icon: "🥈" },
  ];

  // API verification data
  const verificationData = [
    { name: "카드 결제", verified: 412, total: 487 },
    { name: "건강검진", verified: 356, total: 487 },
    { name: "소득 증빙", verified: 298, total: 487 },
    { name: "재직 증명", verified: 445, total: 487 },
  ];

  // Calculate overall data integrity
  const overallIntegrity = qualityData.reduce((acc, item) => {
    const weight = item.name === "Platinum" ? 1 : item.name === "Gold" ? 0.85 : 0.7;
    return acc + (item.value * weight);
  }, 0);

  // AI verdict based on data quality
  const getAIVerdict = () => {
    if (overallIntegrity >= 90 && isDataSufficient) {
      return { 
        status: "적합", 
        color: "text-emerald-600", 
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        description: "학술 보고서 및 경영 의사결정에 사용하기에",
        icon: CheckCircle2
      };
    } else if (overallIntegrity >= 75) {
      return { 
        status: "조건부 적합", 
        color: "text-amber-600", 
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        description: "추가 표본 수집 시",
        icon: AlertTriangle
      };
    }
    return { 
      status: "부적합", 
      color: "text-red-600", 
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "현재 데이터 품질로는",
      icon: AlertTriangle
    };
  };

  const verdict = getAIVerdict();
  const VerdictIcon = verdict.icon;

  // Confidence level gauge calculation
  const gaugeAngle = (confidenceLevel / 100) * 180;
  const gaugeColor = isDataSufficient ? "#10b981" : "#ef4444";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">통계적 신뢰도 분석</h1>
          <p className="text-xs text-slate-500">Statistical Validity Report</p>
        </div>
      </header>

      <div className="p-4 space-y-5 pb-8">
        {/* ===== 1. 신뢰도 게이지 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">신뢰도 게이지</h2>
              <p className="text-xs text-slate-500">Confidence Level Indicator</p>
            </div>
          </div>

          {/* Main Gauge */}
          <div className="relative flex flex-col items-center mb-6">
            {/* Semi-circle Gauge */}
            <div className="relative w-56 h-28 overflow-hidden">
              {/* Background Arc */}
              <div className="absolute inset-0">
                <svg viewBox="0 0 200 100" className="w-full h-full">
                  {/* Background track */}
                  <path
                    d="M 10 100 A 90 90 0 0 1 190 100"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* Foreground arc */}
                  <path
                    d="M 10 100 A 90 90 0 0 1 190 100"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${(confidenceLevel / 100) * 283} 283`}
                    className="transition-all duration-1000"
                  />
                  {/* Tick marks */}
                  {[0, 25, 50, 75, 100].map((tick) => {
                    const angle = ((tick / 100) * 180 - 90) * (Math.PI / 180);
                    const x = 100 + 75 * Math.cos(angle);
                    const y = 100 + 75 * Math.sin(angle);
                    return (
                      <text
                        key={tick}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        className="text-[8px] fill-slate-400"
                      >
                        {tick}%
                      </text>
                    );
                  })}
                </svg>
              </div>
              
              {/* Center Value */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
                <span className="text-4xl font-bold" style={{ color: gaugeColor }}>
                  {confidenceLevel}%
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <div className={cn(
                "p-4 rounded-xl border-2 transition-all",
                isDataSufficient 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <Target className={cn(
                    "w-4 h-4",
                    isDataSufficient ? "text-emerald-600" : "text-red-600"
                  )} />
                  <span className="text-xs text-slate-600">신뢰 수준</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  isDataSufficient ? "text-emerald-600" : "text-red-600"
                )}>
                  {confidenceLevel}%
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl border-2 transition-all",
                marginOfError <= 5 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-amber-50 border-amber-200"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className={cn(
                    "w-4 h-4",
                    marginOfError <= 5 ? "text-emerald-600" : "text-amber-600"
                  )} />
                  <span className="text-xs text-slate-600">표본 오차</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  marginOfError <= 5 ? "text-emerald-600" : "text-amber-600"
                )}>
                  ±{marginOfError}%
                </p>
              </div>
            </div>

            {/* Sample Progress */}
            <div className="w-full mt-4 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">표본 수집률</span>
                <span className="text-sm font-semibold text-slate-800">
                  {sampleSize.toLocaleString()} / {targetSize.toLocaleString()}명
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    sampleSufficiency >= 80 
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-600" 
                      : sampleSufficiency >= 50 
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-red-400 to-red-600"
                  )}
                  style={{ width: `${Math.min(sampleSufficiency, 100)}%` }}
                />
              </div>
              <p className={cn(
                "text-xs mt-2 font-medium",
                isDataSufficient ? "text-emerald-600" : "text-amber-600"
              )}>
                {isDataSufficient 
                  ? "✓ 통계적으로 유의미한 표본 크기입니다" 
                  : "⚠ 추가 표본 수집을 권장합니다"
                }
              </p>
            </div>
          </div>
        </section>

        {/* ===== 2. 응답자 품질 분석 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">응답자 품질 분석</h2>
              <p className="text-xs text-slate-500">Data Integrity Report</p>
            </div>
          </div>

          {/* Quality Summary Banner */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">데이터 무결성 리포트</p>
                <p className="text-lg font-bold text-slate-900">
                  전체 응답자의 <span className="text-cyan-600">{qualityData[0].value}%</span>가 
                  API 인증을 마친 <span className="text-cyan-600">플래티넘 등급</span>입니다
                </p>
              </div>
            </div>
          </div>

          {/* Quality Distribution Chart */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-3 text-center">등급 분포</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '비율']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {qualityData.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {item.icon} {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Verification Stats */}
          <div className="mt-5">
            <p className="text-xs text-slate-500 mb-3">API 인증 현황</p>
            <div className="space-y-3">
              {verificationData.map((item) => {
                const percent = Math.round((item.verified / item.total) * 100);
                return (
                  <div key={item.name} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-700">{item.name}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {item.verified}/{item.total}명 ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Integrity Score */}
          <div className="mt-5 p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">종합 데이터 무결성 점수</p>
                  <p className="text-sm font-medium text-white">Data Integrity Score</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-cyan-400">{overallIntegrity.toFixed(1)}</p>
                <p className="text-xs text-slate-400">/ 100점</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3. AI 최종 판정 ===== */}
        <section className={cn(
          "rounded-2xl p-5 shadow-sm border-2 transition-all",
          verdict.bgColor, verdict.borderColor
        )}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI 최종 판정</h2>
              <p className="text-xs text-slate-500">AI-Powered Verdict</p>
            </div>
          </div>

          {/* Verdict Card */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                verdict.status === "적합" ? "bg-emerald-100" : 
                verdict.status === "조건부 적합" ? "bg-amber-100" : "bg-red-100"
              )}>
                <VerdictIcon className={cn("w-8 h-8", verdict.color)} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{verdict.description}</p>
                <div className="flex items-center gap-2">
                  <span className={cn("text-2xl font-bold", verdict.color)}>
                    [{verdict.status}]
                  </span>
                  <span className="text-lg text-slate-700">합니다</span>
                </div>
              </div>
            </div>

            {/* AI Analysis Details */}
            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">분석 신뢰도</span>
                <span className="font-semibold text-slate-900">{confidenceLevel}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">표본 오차 범위</span>
                <span className="font-semibold text-slate-900">±{marginOfError}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">데이터 무결성</span>
                <span className="font-semibold text-slate-900">{overallIntegrity.toFixed(1)}점</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">고급 응답자 비율</span>
                <span className="font-semibold text-slate-900">{qualityData[0].value + qualityData[1].value}%</span>
              </div>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="mt-4 p-4 bg-white/70 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">AI 추천 사항</p>
                <p className="text-sm text-slate-600">
                  {verdict.status === "적합" 
                    ? "현재 데이터 품질이 우수합니다. 학술 논문, 비즈니스 보고서, 의사결정 자료로 활용하시기에 적합합니다."
                    : verdict.status === "조건부 적합"
                      ? "표본 크기를 100명 이상 추가 수집하시면 더 높은 신뢰도를 확보할 수 있습니다."
                      : "데이터 품질 개선을 위해 고등급 응답자 비율을 높이시길 권장합니다."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Usage Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border",
              verdict.status === "적합" 
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-300"
            )}>
              ✓ 학술 보고서
            </span>
            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border",
              verdict.status === "적합" 
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-300"
            )}>
              ✓ 경영 의사결정
            </span>
            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border",
              verdict.status === "적합" 
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-300"
            )}>
              ✓ 시장 분석
            </span>
            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border",
              verdict.status === "적합" 
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-300"
            )}>
              ✓ 투자 자료
            </span>
          </div>
        </section>

        {/* Objectivity Certification Button */}
        {onOpenObjectivityCertification && (
          <div className="mb-4">
            <Button
              onClick={onOpenObjectivityCertification}
              className="w-full h-14 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl font-semibold"
            >
              <Scale className="w-5 h-5 mr-2" />
              객관성 인증 리포트 보기
            </Button>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">
            본 분석은 VeriNode AI 엔진에 의해 자동 생성되었습니다
          </p>
          <p className="text-xs text-slate-400 mt-1">
            분석 일시: {new Date().toLocaleDateString('ko-KR')} {new Date().toLocaleTimeString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatisticalValidityView;
