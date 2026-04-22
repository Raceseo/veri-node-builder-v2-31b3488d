import { Shield, Coins, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface TrustScoreHeaderProps {
  score: number;
  maxScore: number;
  showCelebration?: boolean;
  earnedPoints?: number;
}

const TrustScoreHeader = ({ 
  score, 
  maxScore, 
  showCelebration = false,
  earnedPoints = 0 
}: TrustScoreHeaderProps) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [animating, setAnimating] = useState(false);
  const percentage = (displayScore / maxScore) * 100;

  useEffect(() => {
    if (showCelebration && earnedPoints > 0) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setDisplayScore(score);
        setAnimating(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDisplayScore(score);
    }
  }, [score, showCelebration, earnedPoints]);

  const getLevel = () => {
    if (percentage >= 80) return { label: "플래티넘", color: "text-gold" };
    if (percentage >= 60) return { label: "골드", color: "text-gold-light" };
    if (percentage >= 40) return { label: "실버", color: "text-muted-foreground" };
    return { label: "브론즈", color: "text-warning" };
  };

  const level = getLevel();

  return (
    <div className="relative bg-gradient-secure text-primary-foreground rounded-2xl p-5 shadow-lg shadow-trust overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 right-0 w-32 h-32 bg-trust/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-trustTeal/40 rounded-full blur-2xl" />
      </div>

      {/* Celebration Effects */}
      {showCelebration && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${10 + i * 10}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
          ))}
          {earnedPoints > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-celebration">
              <div className="flex items-center gap-2 bg-gold text-primary px-4 py-2 rounded-full font-bold shadow-glow">
                <Coins className="w-5 h-5" />
                +{earnedPoints}P
              </div>
            </div>
          )}
        </>
      )}

      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-trust/20 flex items-center justify-center backdrop-blur-sm border border-trust/30">
              <Shield className="w-6 h-6 text-trust-light" />
            </div>
            <div>
              <h2 className="text-lg font-bold">신뢰 점수</h2>
              <p className="text-sm text-primary-foreground/70">Trust Score</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${animating ? 'animate-score-up' : ''}`}>
              {displayScore}
              <span className="text-lg text-primary-foreground/60">/{maxScore}</span>
            </div>
            <span className={`text-sm font-medium ${level.color}`}>{level.label} 등급</span>
          </div>
        </div>

        {/* Progress Bar - Trust Gradient */}
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
          <div 
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, hsl(217 91% 60%), hsl(168 76% 36%))'
            }}
          />
          <div 
            className="absolute inset-y-0 left-0 rounded-full opacity-50 blur-sm"
            style={{ 
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, hsl(217 91% 60%), hsl(168 76% 36%))'
            }}
          />
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary-foreground/70">
            인증을 완료하면 점수가 올라가요
          </span>
          <span className="font-medium text-trust-light">
            {Math.round(100 - percentage)}% 더 올릴 수 있어요
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreHeader;