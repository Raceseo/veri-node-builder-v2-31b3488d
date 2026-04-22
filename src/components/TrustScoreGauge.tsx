import { Shield, CheckCircle2 } from "lucide-react";

interface TrustScoreGaugeProps {
  score: number;
  maxScore: number;
  completedSteps: number;
  totalSteps: number;
}

const TrustScoreGauge = ({ score, maxScore, completedSteps, totalSteps }: TrustScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-trust flex items-center justify-center">
            <Shield className="w-5 h-5 text-trust-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">신뢰 점수</h3>
            <p className="text-sm text-muted-foreground">인증을 완료하면 점수가 올라가요</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-trust">{score}</span>
          <span className="text-lg text-muted-foreground">/{maxScore}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-4">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-trust rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-trust rounded-full opacity-50 blur-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>완료된 인증: <strong className="text-foreground">{completedSteps}/{totalSteps}</strong></span>
        </div>
        <div className="text-sm">
          {percentage < 100 ? (
            <span className="text-trust font-medium">
              {Math.round(100 - percentage)}% 더 올릴 수 있어요!
            </span>
          ) : (
            <span className="text-success font-medium">
              🎉 최고 등급 달성!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrustScoreGauge;
