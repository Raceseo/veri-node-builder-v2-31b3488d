import { useState } from "react";
import { Shield, CheckCircle, FileSignature, AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { recordConsent } from "@/lib/recordConsent";
import { ONBOARDING_PLEDGE } from "@/lib/consentTexts";

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

  // 문안 원문은 consentTexts.ts(ONBOARDING_PLEDGE)가 단일 출처. 아이콘만 화면에서 매핑.
  const PLEDGE_ICONS = { ownership: KeyRound, honesty: Shield, accuracy: CheckCircle, responsibility: AlertTriangle } as const;
  const promises = ONBOARDING_PLEDGE.items.map((it) => ({ ...it, icon: PLEDGE_ICONS[it.key] }));

  const handleSign = async () => {
    if (!allAgreed) return;

    setIsSigning(true);

    // J-1: 동의 기록(실패 시 진행 차단 — 기록 없는 진행 방지). 재시도는 recordConsent 내부에서.
    const { ok } = await recordConsent({
      consentType: ONBOARDING_PLEDGE.consentType,
      consentVersion: ONBOARDING_PLEDGE.version,
    });
    if (!ok) {
      setIsSigning(false);
      toast({
        title: "동의를 저장하지 못했습니다",
        description: "다시 시도해 주세요. 동의가 저장되어야 다음 단계로 넘어갈 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    // 동의 처리 애니메이션
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

        {/* 서약 동의 영역 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="text-center">
            {isSigned ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center animate-stamp-appear">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-green-500 font-semibold">동의 완료</p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('ko-KR')} 서약 체결
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* I-3 / B-21: "전자 서명" + 지문 아이콘 → 서명 데이터를 받는 것처럼
                    보이지만 실제로 저장되는 것은 동의 기록뿐이다.
                    recordConsent 가 넣는 값: user_id / consent_type / consent_version /
                    is_agreed / agreed_at / user_agent — 서명 이미지·이름·생체정보 없음.
                    지문 아이콘은 생체 인증까지 연상시켜 함께 교체한다. */}
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">서약 동의</span>
                </div>
                {/* B-21: 점선 테두리(= "여기에 입력·서명하세요")를 걷어내고
                    연한 배경의 안내 영역으로 성격을 바꾼다. 서명 데이터를 받지 않으므로
                    받는 척하는 UI 를 두지 않고, 그 자리에 "실제로 무엇이 기록되는지"를 밝힌다.
                    높이(h-20)는 유지 — 없애면 카드가 비어 서명 후 상태와 높이가 튄다. */}
                <div className="h-20 bg-muted rounded-lg flex items-center justify-center px-4">
                  {isSigning ? (
                    <div className="flex items-center gap-2 text-primary">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm">동의 기록 중...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      동의하시면 동의한 날짜와 내용이 기록됩니다
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 동의 버튼 */}
        <Button
          onClick={handleSign}
          disabled={!allAgreed || isSigning || isSigned}
          className="w-full h-14 bg-gradient-primary hover:opacity-90 text-base font-semibold"
        >
          {/* B-21: 버튼 3개 상태의 "서명" 표현도 함께 정리.
              위 안내가 "동의 기록 중..."인데 버튼만 "서명 중..."이면 같은 순간에 모순된다. */}
          {isSigning ? (
            <>동의 기록 중...</>
          ) : isSigned ? (
            <>✓ 동의 완료</>
          ) : (
            <>
              <FileSignature className="w-5 h-5 mr-2" />
              서약에 동의합니다
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {/* B-25: "보장하기" → 단정. 지킬 근거가 없는 표현을 걷어낸다 */}
          이 서약은 VeriNode 플랫폼의 데이터 무결성을 지키기 위한 것입니다.
          <br />
          서약 위반 시 계정 제한 및 보상 회수 조치가 취해질 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default SocialPromiseView;
