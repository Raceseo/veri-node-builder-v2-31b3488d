import { RefreshCw, Coins, Shield, Clock, Target, FileText, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IntegrityResult } from "@/types/verinode";

interface RewardStepProps {
  result: IntegrityResult;
  onReset: () => void;
}

const RewardStep = ({ result, onReset }: RewardStepProps) => {
  const verdictConfig = {
    high_trust: { label: "고신뢰", color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: CheckCircle },
    medium_trust: { label: "보통", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", icon: AlertTriangle },
    low_trust: { label: "신뢰불가", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertTriangle },
  };

  const config = verdictConfig[result.verdict];
  const VerdictIcon = config.icon;

  // Calculate quality grade based on scores
  const getQualityGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-success" };
    if (score >= 80) return { grade: "A", color: "text-success" };
    if (score >= 70) return { grade: "B+", color: "text-[#3182F6]" };
    if (score >= 60) return { grade: "B", color: "text-[#3182F6]" };
    if (score >= 50) return { grade: "C", color: "text-warning" };
    return { grade: "D", color: "text-destructive" };
  };

  const consistencyGrade = getQualityGrade(result.consistencyScore);
  const sincerityGrade = getQualityGrade(result.sincerityScore);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Score Display */}
      <Card className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.border} border mb-4`}>
          <VerdictIcon className={`w-5 h-5 ${config.color}`} />
          <span className={`font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <div className="text-6xl font-display font-bold text-foreground mb-2">
          {result.overallScore}<span className="text-2xl text-muted-foreground">점</span>
        </div>
        <p className="text-muted-foreground">무결성 점수</p>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "일관성", score: result.consistencyScore, icon: Target },
          { label: "성실성", score: result.sincerityScore, icon: Clock },
          { label: "함정이행", score: result.trapScore, icon: Shield },
        ].map((item) => (
          <Card key={item.label} className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
            <item.icon className="w-5 h-5 mx-auto mb-2 text-[#3182F6]" />
            <p className="text-2xl font-bold text-foreground">{item.score}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </Card>
        ))}
      </div>

      {/* AI Integrity Verification Report */}
      <Card className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#3182F6]" />
          <h4 className="font-semibold text-foreground">AI 무결성 검증 리포트</h4>
        </div>
        
        {/* Quality Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">응답 일관성 점수</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{result.consistencyScore}</span>
              <span className={`text-lg font-semibold ${consistencyGrade.color}`}>
                {consistencyGrade.grade}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              동일 주제 응답 간 논리적 일관성
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">서술형 품질 등급</span>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{result.sincerityScore}</span>
              <span className={`text-lg font-semibold ${sincerityGrade.color}`}>
                {sincerityGrade.grade}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              서술형 답변의 구체성과 진정성
            </p>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="border-t border-border pt-4">
          <h5 className="text-sm font-medium text-foreground mb-2">분석 요약</h5>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.analysis.overallSummary}
          </p>
        </div>
      </Card>

      {/* Token Reward */}
      <Card className="bg-gradient-to-r from-[#3182F6] to-[#2563EB] rounded-2xl p-6 text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coins className="w-6 h-6 text-white/80" />
          <span className="text-lg text-white/90">획득 토큰</span>
        </div>
        <p className="text-4xl font-display font-bold text-white">
          +{result.tokenReward} <span className="text-xl">VN</span>
        </p>
      </Card>

      <Button 
        onClick={onReset} 
        variant="outline" 
        className="w-full h-12 rounded-xl border-border"
      >
        <RefreshCw className="w-5 h-5 mr-2" /> 새 검증 시작
      </Button>
    </div>
  );
};

export default RewardStep;