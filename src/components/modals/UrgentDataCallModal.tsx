import { useState, useEffect } from "react";
import { 
  X, Clock, Zap, Crown, Shield, Star, 
  TrendingUp, Users, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UrgentDataCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipate: () => void;
  surveyTitle?: string;
  researchTeam?: string;
  baseReward?: number;
  bonusMultiplier?: number;
  gradePointMultiplier?: number;
  currentGradePoints?: number;
  targetGradePoints?: number;
  remainingSeconds?: number;
}

const UrgentDataCallModal = ({
  isOpen,
  onClose,
  onParticipate,
  surveyTitle = "MZ세대 소비 트렌드 연구",
  researchTeam = "서울대학교 경영연구팀",
  baseReward = 2000,
  bonusMultiplier = 2,
  gradePointMultiplier = 3,
  currentGradePoints = 940,
  targetGradePoints = 950,
  remainingSeconds: initialSeconds = 900 // 15 minutes
}: UrgentDataCallModalProps) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isAnimating, setIsAnimating] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Pulse animation for urgency
  useEffect(() => {
    if (!isOpen) return;
    
    const pulseInterval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }, 3000);

    return () => clearInterval(pulseInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 300; // Less than 5 minutes

  const pointsToTarget = targetGradePoints - currentGradePoints;
  const progressPercent = (currentGradePoints / targetGradePoints) * 100;
  const totalReward = baseReward * bonusMultiplier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl",
        "bg-gradient-to-br from-purple-950 via-violet-950 to-purple-950",
        "border border-purple-500/30",
        isAnimating && "animate-pulse"
      )}>
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6">
          {/* Urgent Badge */}
          <div className="flex justify-center mb-4">
            <div className={cn(
              "px-4 py-2 rounded-full flex items-center gap-2",
              "bg-gradient-to-r from-red-500/20 to-orange-500/20",
              "border border-red-500/40",
              isUrgent && "animate-pulse"
            )}>
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-bold">긴급 데이터 호출</span>
              <span className="text-red-400">🚨</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-bold">골든 타임 설문</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{surveyTitle}</h2>
            <p className="text-purple-300/80 text-sm">당신의 참여가 시급합니다!</p>
          </div>

          {/* Countdown Timer */}
          <div className={cn(
            "rounded-2xl p-4 mb-5 text-center",
            "bg-gradient-to-r from-purple-900/50 via-violet-900/50 to-purple-900/50",
            "border",
            isUrgent ? "border-red-500/50" : "border-purple-500/30"
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className={cn(
                "w-5 h-5",
                isUrgent ? "text-red-400 animate-pulse" : "text-purple-400"
              )} />
              <span className={cn(
                "text-sm font-medium",
                isUrgent ? "text-red-300" : "text-purple-300"
              )}>
                남은 시간
              </span>
            </div>
            <div className={cn(
              "text-4xl font-bold tracking-wider",
              isUrgent ? "text-red-400" : "text-white"
            )}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            {isUrgent && (
              <p className="text-red-400/80 text-xs mt-2 animate-pulse">
                ⚡ 5분 이내 마감 임박!
              </p>
            )}
          </div>

          {/* Reward Info */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold">보상 {bonusMultiplier}배</span>
              </div>
              <p className="text-2xl font-bold text-amber-300">₩{totalReward.toLocaleString()}</p>
              <p className="text-xs text-amber-400/60 line-through">₩{baseReward.toLocaleString()}</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-xs font-bold">등급 점수 {gradePointMultiplier}배</span>
              </div>
              <p className="text-2xl font-bold text-purple-300">+30점</p>
              <p className="text-xs text-purple-400/60 line-through">+10점</p>
            </div>
          </div>

          {/* Grade Progress */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-4 mb-5 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">플래티넘 등급까지</span>
              <span className="ml-auto text-cyan-400 font-bold">{pointsToTarget}점</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressPercent} 
                className="h-3 bg-slate-700/50"
              />
              <div 
                className="absolute inset-y-0 left-0 h-3 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400">{currentGradePoints}점</span>
              <span className="text-cyan-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Platinum {targetGradePoints}점
              </span>
            </div>
            <p className="text-center text-purple-300 text-sm mt-3 font-medium">
              🎯 이 설문 참여 시 <span className="text-amber-400 font-bold">플래티넘 등급 달성!</span>
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onParticipate}
            className={cn(
              "w-full h-14 text-lg font-bold rounded-2xl shadow-xl",
              "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500",
              "hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400",
              "text-purple-950",
              "transition-all duration-300",
              isAnimating && "scale-105"
            )}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            지금 바로 참여하기
          </Button>

          {/* Social Value */}
          <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-300/80 text-sm">
              <Users className="w-4 h-4" />
              <span>이 데이터는 <span className="text-white font-medium">{researchTeam}</span>의</span>
            </div>
            <p className="text-purple-300/80 text-sm">소중한 연구 자료가 됩니다 💜</p>
          </div>

          {/* Skip Option */}
          <button 
            onClick={onClose}
            className="w-full mt-4 py-2 text-center text-purple-400/60 text-sm hover:text-purple-300 transition-colors"
          >
            다음에 참여할게요
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrgentDataCallModal;
