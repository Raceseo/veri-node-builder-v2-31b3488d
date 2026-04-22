import { useState } from "react";
import { 
  ArrowLeft, 
  Droplets,
  Sparkles,
  TrendingUp,
  Heart,
  Shield,
  CheckCircle2,
  Fingerprint,
  Brain,
  FileCheck,
  Users,
  Award,
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataTrustDashboardProps {
  onBack: () => void;
  userName?: string;
}

export default function DataTrustDashboard({ onBack, userName = "Ray" }: DataTrustDashboardProps) {
  const [activeTab, setActiveTab] = useState<"provider" | "consumer">("provider");

  // 순도 지수 (Purity Index)
  const purityIndex = 94;
  const dataValueIncrease = 12.5;

  // 무결성 검증 프로세스 단계
  const verificationSteps = [
    { 
      step: 1, 
      name: "생체 지문 인증", 
      passRate: 100, 
      description: "본인 확인 완료",
      icon: Fingerprint,
      color: "text-trust"
    },
    { 
      step: 2, 
      name: "논리 일관성 분석", 
      passRate: 95, 
      description: "응답 패턴 정상",
      icon: Brain,
      color: "text-success"
    },
    { 
      step: 3, 
      name: "교차 검증", 
      passRate: 98, 
      description: "데이터 무결성 확인",
      icon: FileCheck,
      color: "text-trust"
    },
    { 
      step: 4, 
      name: "커뮤니티 신뢰도", 
      passRate: 92, 
      description: "사회적 검증 완료",
      icon: Users,
      color: "text-success"
    }
  ];

  // 데이터 품질 지표
  const qualityMetrics = [
    { label: "정직성 지수", value: 96, trend: "+2.3%" },
    { label: "응답 성실도", value: 94, trend: "+1.8%" },
    { label: "데이터 신선도", value: 98, trend: "+0.5%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-trust/5 via-background to-success/5 pb-8">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-trust/20">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">데이터 신뢰 대시보드</h1>
            <p className="text-xs text-muted-foreground">Data Trust Dashboard</p>
          </div>
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <Leaf className="h-3 w-3" />
            정제 완료
          </Badge>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "provider" | "consumer")}>
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="provider" className="flex-1 data-[state=active]:bg-trust/20 data-[state=active]:text-trust">
              공급자 뷰
            </TabsTrigger>
            <TabsTrigger value="consumer" className="flex-1 data-[state=active]:bg-success/20 data-[state=active]:text-success">
              수요자 뷰
            </TabsTrigger>
          </TabsList>

          {/* 공급자 뷰 */}
          <TabsContent value="provider" className="space-y-6 mt-6">
            {/* 오늘의 데이터 순도 카드 */}
            <Card className="p-6 bg-gradient-to-br from-trust/10 via-background to-success/10 border-trust/30 overflow-hidden relative">
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-trust/20 to-success/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="h-5 w-5 text-trust" />
                  <h2 className="font-semibold text-foreground">오늘의 데이터 순도</h2>
                  <Badge variant="outline" className="ml-auto bg-trust/10 text-trust border-trust/30">
                    Purity Index
                  </Badge>
                </div>

                {/* 순도 게이지 */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-44 h-44">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* 배경 원 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-trust/10"
                      />
                      {/* 그라데이션 원 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="url(#purityGradient)"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${purityIndex * 2.64} 264`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="purityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(217 91% 60%)" />
                          <stop offset="100%" stopColor="hsl(152 69% 41%)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold bg-gradient-to-r from-trust to-success bg-clip-text text-transparent">
                        {purityIndex}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* 따뜻한 메시지 */}
                <div className="bg-gradient-to-r from-trust/10 to-success/10 rounded-xl p-4 border border-trust/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-trust to-success flex items-center justify-center shrink-0">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {userName}님의 정직한 답변 덕분에
                      </p>
                      <p className="text-sm text-muted-foreground">
                        전체 데이터 가치가 <span className="text-success font-bold">+{dataValueIncrease}%</span> 상승했습니다
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        당신의 진실된 데이터가 더 나은 세상을 만듭니다 💙
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 데이터 품질 지표 */}
            <div className="grid grid-cols-3 gap-3">
              {qualityMetrics.map((metric, index) => (
                <Card key={index} className="p-4 bg-gradient-to-br from-trust/5 to-success/5 border-trust/20">
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="h-4 w-4 text-trust" />
                    <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                      {metric.trend}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{metric.label}</p>
                </Card>
              ))}
            </div>

            {/* 나의 기여도 */}
            <Card className="p-5 bg-card border-trust/20">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-trust" />
                <h3 className="font-semibold text-foreground">나의 데이터 기여도</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">이번 주 설문 참여</span>
                  <span className="font-bold text-success">7회</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">평균 응답 품질</span>
                  <span className="font-bold text-trust">상위 5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">신뢰 등급</span>
                  <Badge className="bg-gradient-to-r from-trust to-success text-white border-0">
                    Diamond
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 수요자 뷰 */}
          <TabsContent value="consumer" className="space-y-6 mt-6">
            {/* 무결성 검증 프로세스 리포트 */}
            <Card className="p-6 bg-gradient-to-br from-success/10 via-background to-trust/10 border-success/30">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5 text-success" />
                <h2 className="font-semibold text-foreground">무결성 검증 프로세스 리포트</h2>
              </div>

              <div className="space-y-4">
                {verificationSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="relative">
                      <div className="flex items-center gap-4">
                        {/* 스텝 아이콘 */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-trust/20 to-success/20 flex items-center justify-center shrink-0`}>
                          <Icon className={`h-6 w-6 ${step.color}`} />
                        </div>
                        
                        {/* 스텝 정보 */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {step.step}단계: {step.name}
                            </span>
                            <span className={`text-sm font-bold ${step.passRate >= 95 ? 'text-success' : 'text-trust'}`}>
                              {step.passRate}%
                            </span>
                          </div>
                          <Progress 
                            value={step.passRate} 
                            className="h-2 bg-muted"
                          />
                          <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>

                      {/* 연결선 */}
                      {step.step < verificationSteps.length && (
                        <div className="absolute left-6 top-14 w-0.5 h-4 bg-gradient-to-b from-trust/30 to-success/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 종합 신뢰도 점수 */}
            <Card className="p-5 bg-card border-success/20">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="font-semibold text-foreground">데이터 신뢰도 종합</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-trust/10 to-trust/5 rounded-xl border border-trust/20">
                  <p className="text-xs text-muted-foreground mb-1">전체 통과율</p>
                  <p className="text-2xl font-bold text-trust">96.25%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+2.1%</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
                  <p className="text-xs text-muted-foreground mb-1">데이터 신선도</p>
                  <p className="text-2xl font-bold text-success">최상</p>
                  <p className="text-xs text-muted-foreground mt-1">24시간 이내 수집</p>
                </div>
              </div>
            </Card>

            {/* 검증 인증서 */}
            <Card className="p-5 bg-gradient-to-r from-trust/5 to-success/5 border-trust/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-trust to-success flex items-center justify-center">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">무결성 인증 획득</h3>
                  <p className="text-xs text-muted-foreground">
                    본 데이터셋은 VeriNode의 4단계 검증을 모두 통과했습니다
                  </p>
                  <p className="text-xs text-trust mt-1">
                    인증번호: VN-2024-{Math.random().toString(36).substring(2, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </Card>

            {/* 안내 메시지 */}
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">
                🌿 깨끗하게 정제된 데이터로 더 정확한 분석이 가능합니다
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
