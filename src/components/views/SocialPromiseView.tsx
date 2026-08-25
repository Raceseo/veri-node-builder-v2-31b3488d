import { useState } from "react";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { recordConsent } from "@/lib/recordConsent";
import { ONBOARDING_PLEDGE } from "@/lib/consentTexts";

interface SocialPromiseViewProps {
  onComplete: () => void;
}

const SocialPromiseView = ({ onComplete }: SocialPromiseViewProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const handleSign = async () => {
    if (!agreed) return;

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
        description: "저장에 실패했습니다. 통신 상태를 확인하고 다시 눌러주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSigned(true);
    // 완료 표시를 잠깐 보여준 뒤 진행
    await new Promise(resolve => setTimeout(resolve, 800));
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
            <span className="text-gradient">잠깐만요</span>
          </h1>
          <p className="text-muted-foreground">
            아래를 확인하고, 동의에 체크해 주세요
          </p>
        </div>

        {/* ㉢(2026-08-25 v4): 4개 개별 체크박스 → 요약 2줄 + 단일 동의 체크박스.
            서약자 카드·"서약 동의" 제목·회색 안내박스·「더 알아보기」 접힘을 모두 제거. */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-5">
          <ul className="space-y-4">
            {ONBOARDING_PLEDGE.points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <p className="text-base text-foreground leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>

          {/* 단일 동의 체크박스. rounded-[4px]: 이 프로젝트 rounded-sm=8px 라 16px 박스가
              원(라디오처럼)이 됨 → 이 화면에서만 네모로 강제(checkbox.tsx 전역 미수정). */}
          <label className="flex items-start gap-3 pt-4 border-t border-border cursor-pointer">
            <Checkbox
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-0.5 rounded-[4px]"
            />
            <span className="text-base font-medium text-foreground leading-relaxed">
              {ONBOARDING_PLEDGE.agreementLabel}
            </span>
          </label>
        </div>

        {/* 동의 버튼 — isSigning/isSigned 상태 피드백은 버튼이 직접 표시(별도 안내박스 제거) */}
        <Button
          onClick={handleSign}
          disabled={!agreed || isSigning || isSigned}
          className="w-full h-14 bg-gradient-primary hover:opacity-90 text-base font-semibold"
        >
          {isSigning ? (
            <>동의 기록 중...</>
          ) : isSigned ? (
            <>✓ 동의 완료</>
          ) : (
            <>
              <FileSignature className="w-5 h-5 mr-2" />
              동의하고 계속하기
            </>
          )}
        </Button>

        <p className="text-sm text-center text-muted-foreground mt-4">
          {/* B-25: "보장하기" 단정 걷어냄. 2026-08-25: 위협 문구 삭제, 긍정형 전환 */}
          솔직한 답변이 모여야 데이터가 값을 가집니다. 그래서 확인을 부탁드립니다.
        </p>
      </div>
    </div>
  );
};

export default SocialPromiseView;
