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
    <div className="relative bg-gradient-secure text-primary-foreground rounded-2xl p-3 shadow-lg shadow-trust overflow-hidden">
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

      {/* 홈 첫 화면 압축(1줄): 아이콘 · "신뢰 점수" · 실값 0/100 · 등급 · 얇은 진행바.
          면적만 줄이고 실값(점수·등급)은 유지한다. 부제/하단 안내문은 제거. */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-trust/20 flex items-center justify-center backdrop-blur-sm border border-trust/30 shrink-0">
          <Shield className="w-5 h-5 text-trust-light" />
        </div>
        <span className="text-sm font-bold shrink-0">신뢰 점수</span>
        <div className={`text-2xl font-bold leading-none shrink-0 ${animating ? 'animate-score-up' : ''}`}>
          {displayScore}
          <span className="text-base text-primary-foreground/60">/{maxScore}</span>
        </div>
        <span className={`text-sm font-medium shrink-0 ${level.color}`}>· {level.label}</span>

        {/* 남은 폭을 채우는 얇은 진행바 */}
        <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, hsl(217 91% 60%), hsl(168 76% 36%))'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrustScoreHeader;