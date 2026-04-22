import { TrendingUp, AlertCircle } from "lucide-react";

interface TrustScoreCardProps {
  score: number;
  change: number;
  percentile: number;
  isVerified?: boolean; // 추가
}

const TrustScoreCard = ({ score, change, percentile, isVerified }: TrustScoreCardProps) => {
  const maxScore = 1000;
  const scorePercent = (score / maxScore) * 100;
  const radius = 90;
  const circumference = Math.PI * radius;
  const offset = circumference - (circumference * scorePercent) / 100;

  const getRating = () => {
    if (!isVerified) return "Identity Pending";
    if (score >= 800) return "Excellent";
    if (score >= 600) return "Good";
    if (score >= 400) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border-t-4 border-[#3182F6]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">데이터 등급</h3>
        {isVerified && change > 0 && (
          <div className="flex items-center gap-1 text-success text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+{change} pts</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center py-4">
        <div className="relative w-48 h-28">
          <svg className="w-full h-full" viewBox="0 0 200 110">
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="#F2F4F6"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke={isVerified ? "url(#trustGradient)" : "#CBD5E1"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3182F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-5xl font-bold text-[#3182F6]">{score}</span>
            <span className="text-sm text-slate-400 font-medium">{getRating()}</span>
          </div>
        </div>

        {!isVerified ? (
          <div className="mt-6 w-full p-4 bg-blue-50 rounded-xl flex items-start gap-3 border border-blue-100">
            <AlertCircle className="w-5 h-5 text-[#3182F6] mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-bold">당신의 실제 존재를 증명하세요.</span><br />
              인증 전에는 등급이 0점으로 표시되며 보상 획득이 제한됩니다.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground mt-4">
            귀하는 신뢰 노드 상위 <span className="font-bold text-foreground text-[#3182F6]">{percentile}%</span>입니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default TrustScoreCard;
