import { useState, useEffect } from "react";
import { Shield, Brain, Fingerprint, FileCheck, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import VeriNodeLogo from "@/components/VeriNodeLogo";

interface AIVerificationLoadingViewProps {
  onComplete: (passed: boolean, score: number) => void;
  simulateFailure?: boolean;
}

export default function AIVerificationLoadingView({ 
  onComplete, 
  simulateFailure = false 
}: AIVerificationLoadingViewProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [scanLines, setScanLines] = useState<number[]>([]);

  const verificationSteps = [
    { 
      icon: Fingerprint, 
      label: "생체 패턴 인증 중...", 
      detail: "지문 및 행동 패턴 분석" 
    },
    { 
      icon: Brain, 
      label: "논리 일관성 검증 중...", 
      detail: "응답 패턴 AI 분석" 
    },
    { 
      icon: FileCheck, 
      label: "교차 검증 수행 중...", 
      detail: "이전 데이터와 비교 분석" 
    },
    { 
      icon: Shield, 
      label: "무결성 인증서 발급 중...", 
      detail: "최종 신뢰 점수 산출" 
    },
  ];

  useEffect(() => {
    // 스캔 라인 애니메이션
    const scanInterval = setInterval(() => {
      setScanLines(prev => {
        const newLines = [...prev, Math.random() * 100];
        return newLines.slice(-5);
      });
    }, 200);

    // 진행률 업데이트
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    // 단계 업데이트
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= verificationSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    // 완료 처리
    const completeTimeout = setTimeout(() => {
      // 실패 시뮬레이션 또는 랜덤하게 실패 (20% 확률)
      const shouldFail = simulateFailure || Math.random() < 0.2;
      const score = shouldFail 
        ? Math.floor(Math.random() * 30) + 35 // 35-65점 (실패)
        : Math.floor(Math.random() * 20) + 80; // 80-100점 (성공)
      
      onComplete(!shouldFail, score);
    }, 5500);

    return () => {
      clearInterval(scanInterval);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete, simulateFailure]);

  const CurrentIcon = verificationSteps[currentStep]?.icon || Shield;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-4">
        <VeriNodeLogo />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* AI Studio Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">AI Studio</span>
        </div>

        {/* Main Scanning Animation */}
        <div className="relative w-48 h-48 mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          
          {/* Rotating scanner */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
            style={{ animationDuration: "1.5s" }}
          />
          
          {/* Inner glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-trust/20 animate-pulse" />
          
          {/* Scan lines */}
          {scanLines.map((pos, i) => (
            <div
              key={i}
              className="absolute left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-50 transition-all"
              style={{ 
                transform: `translateX(-50%) rotate(${pos * 3.6}deg)`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-background shadow-lg flex items-center justify-center">
              <CurrentIcon className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        {/* Status Text */}
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          AI Studio가 실시간 무결성 검증 중...
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {verificationSteps[currentStep]?.detail}
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>분석 중</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="w-full space-y-3">
          {verificationSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-primary/10 border border-primary/30" 
                    : isCompleted
                    ? "bg-success/10 border border-success/30"
                    : "bg-muted/30 border border-transparent"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive 
                    ? "bg-primary/20" 
                    : isCompleted
                    ? "bg-success/20"
                    : "bg-muted"
                }`}>
                  {isActive ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : isCompleted ? (
                    <Icon className="w-4 h-4 text-success" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-sm ${
                  isActive 
                    ? "text-primary font-medium" 
                    : isCompleted
                    ? "text-success"
                    : "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 모든 데이터는 암호화되어 안전하게 처리됩니다
        </p>
      </div>
    </div>
  );
}
