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

  /* 라이트 전환(4단계): gold(43 96% 56%)·gold-light(66%)는 밝은 배경에서 대비가
     2:1 대에 그쳐 읽히지 않는다. 같은 계열의 진한 값으로 내린다. */
  const getLevel = () => {
    if (percentage >= 80) return { label: "플래티넘", color: "text-amber-600" };
    if (percentage >= 60) return { label: "골드", color: "text-amber-600" };
    if (percentage >= 40) return { label: "실버", color: "text-slate-500" };
    return { label: "브론즈", color: "text-orange-600" };
  };

  const level = getLevel();

  /* 라이트 전환(4단계, 2026-08-22): bg-gradient-secure(진한 네이비→파랑) 이탈.
     연한 틴트 카드로 간 이유 — 홈의 주 CTA 가 이미 bg-trust 진한 파랑이다.
     배너까지 진한 색이면 같은 크기의 강조가 둘이 되어 시선이 갈린다.
     흰색이면 묻히므로 blue-50 틴트 + 테두리로 "강조는 하되 CTA를 이기지 않게" 둔다.
     ※ --gradient-secure 토큰은 /dashboard 가 계속 쓰므로 건드리지 않았다. */
  return (
    <div className="relative bg-blue-50 border border-blue-200 text-slate-900 rounded-md p-3 shadow-sm overflow-hidden">

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
        {/* backdrop-blur 제거(밝은 배경에서 효과 없음). 아이콘 면만 단색으로 두어
            배너 안에서 유일한 진한 요소가 되게 한다. */}
        <div className="w-9 h-9 rounded-md bg-trust flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-bold shrink-0">신뢰 점수</span>
        <div className={`text-2xl font-bold leading-none shrink-0 ${animating ? 'animate-score-up' : ''}`}>
          {displayScore}
          <span className="text-base text-slate-500">/{maxScore}</span>
        </div>
        <span className={`text-sm font-medium shrink-0 ${level.color}`}>· {level.label}</span>

        {/* 남은 폭을 채우는 얇은 진행바 */}
        <div className="relative flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-trust transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrustScoreHeader;