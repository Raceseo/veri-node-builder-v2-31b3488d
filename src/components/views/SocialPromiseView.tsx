import { useState } from "react";
import { Shield, CheckCircle, FileSignature, Fingerprint, AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface SocialPromiseViewProps {
  onComplete: () => void;
  displayName?: string;
}

const SocialPromiseView = ({ onComplete, displayName = "사용자" }: SocialPromiseViewProps) => {
  const [agreements, setAgreements] = useState({
    ownership: false,
    honesty: false,
    accuracy: false,
    responsibility: false,
  });
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const allAgreed = Object.values(agreements).every(Boolean);

  const promises = [
    {
      key: "ownership" as const,
      title: "데이터 소유권 인지",
      description: "본인이 제공하는 모든 데이터의 소유권은 본인에게 있으며, VeriNode는 본인의 명시적 동의 하에서만 이를 관리한다는 것을 이해합니다.",
      icon: KeyRound,
    },
    {
      key: "honesty" as const,
      title: "정직한 데이터 공급",
      description: "모든 설문 응답과 제공 데이터는 진실에 기반하여 작성하겠습니다.",
      icon: Shield,
    },
    {
      key: "accuracy" as const,
      title: "정확한 정보 제공",
      description: "AI 검증을 위한 프로필 정보를 정확하게 입력하겠습니다.",
      icon: CheckCircle,
    },
    {
      key: "responsibility" as const,
      title: "책임 있는 참여",
      description: "허위 응답이나 조작된 데이터 제공 시 발생하는 불이익을 수용합니다.",
      icon: AlertTriangle,
    },
  ];

  const handleSign = async () => {
    if (!allAgreed) return;
    
    setIsSigning(true);
    
    // 서명 애니메이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSigned(true);
    
    // 완료 후 진행
    await new Promise(resolve => setTimeout(resolve, 1000));
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
            <FileSignature className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            데이터 공급자 <span className="text-gradient">서약</span>
          </h1>
          <p className="text-muted-foreground">
            VeriNode 커뮤니티의 신뢰를 지키기 위한 약속입니다
          </p>
        </div>

        {/* 서약 카드 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <div className="text-center pb-4 border-b border-border">
            <p className="text-sm text-muted-foreground">서약자</p>
            <p className="text-lg font-semibold text-foreground">{displayName} 님</p>
          </div>

          {promises.map((promise) => {
            const Icon = promise.icon;
            return (
              <div
                key={promise.key}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                  agreements[promise.key] 
                    ? "bg-primary/10 border border-primary/30" 
                    : "bg-muted/50 border border-transparent"
                }`}
              >
                <Checkbox
                  id={promise.key}
                  checked={agreements[promise.key]}
                  onCheckedChange={(checked) =>
                    setAgreements(prev => ({ ...prev, [promise.key]: checked === true }))
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={promise.key}
                    className="flex items-center gap-2 text-foreground font-medium cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    {promise.title}
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {promise.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 서명 영역 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="text-center">
            {isSigned ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center animate-stamp-appear">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-green-500 font-semibold">서명 완료</p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('ko-KR')} 서약 체결
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Fingerprint className="w-5 h-5" />
                  <span className="text-sm">전자 서명</span>
                </div>
                <div className="h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  {isSigning ? (
                    <div className="flex items-center gap-2 text-primary">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm">서명 처리 중...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      아래 버튼을 클릭하여 서명하세요
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 서명 버튼 */}
        <Button
          onClick={handleSign}
          disabled={!allAgreed || isSigning || isSigned}
          className="w-full h-14 bg-gradient-primary hover:opacity-90 text-base font-semibold"
        >
          {isSigning ? (
            <>서명 중...</>
          ) : isSigned ? (
            <>✓ 서명 완료</>
          ) : (
            <>
              <FileSignature className="w-5 h-5 mr-2" />
              서약서에 서명하기
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          이 서약은 VeriNode 플랫폼의 데이터 무결성을 보장하기 위한 것입니다.
          <br />
          서약 위반 시 계정 제한 및 보상 회수 조치가 취해질 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default SocialPromiseView;
