import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, FileText, Clock, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SensitiveDataConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dataType: string;
  dataDescription: string;
}

export const SensitiveDataConsentDialog = ({
  isOpen,
  onClose,
  onConfirm,
  dataType,
  dataDescription,
}: SensitiveDataConsentDialogProps) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [purposeChecked, setPurposeChecked] = useState(false);
  const [thirdPartyChecked, setThirdPartyChecked] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);

  const allChecked = consentChecked && purposeChecked && thirdPartyChecked;

  const handleConfirm = () => {
    if (allChecked) {
      onConfirm();
      // Reset state
      setConsentChecked(false);
      setPurposeChecked(false);
      setThirdPartyChecked(false);
      setShowFullTerms(false);
    }
  };

  const handleClose = () => {
    setConsentChecked(false);
    setPurposeChecked(false);
    setThirdPartyChecked(false);
    setShowFullTerms(false);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md mx-4 p-0 bg-card border border-border rounded-2xl overflow-hidden max-h-[90vh]">
        {/* Header with Warning */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">
                민감정보 수집·이용 동의
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                개인정보보호법 제23조에 따른 별도 동의
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 space-y-4">
            {/* Data Type Being Collected */}
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">수집 항목</span>
              </div>
              <p className="text-sm text-foreground font-semibold">{dataType}</p>
              <p className="text-xs text-muted-foreground mt-1">{dataDescription}</p>
            </div>

            {/* Legal Notice Box */}
            <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-4">
              {/* Purpose */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    수집·이용 목적
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  기업 설문조사 매칭 서비스 제공, 맞춤형 리서치 참여 기회 제공, 
                  통계적 분석 및 서비스 개선
                </p>
              </div>

              {/* Retention Period */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    보유·이용 기간
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  동의 철회 시 또는 서비스 탈퇴 시까지
                  <br />
                  <span className="text-xs text-amber-600 font-medium">
                    ※ 개인 식별 정보는 분석 후 60분 이내 영구 삭제
                  </span>
                </p>
              </div>

              {/* Right to Refuse */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    동의 거부권 및 불이익
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  귀하는 민감정보 수집에 대한 동의를 거부할 권리가 있습니다. 
                  다만, 동의를 거부하실 경우 해당 카테고리의 <span className="font-medium text-foreground">프리미엄 설문 참여 및 추가 보상 혜택</span>을 받으실 수 없습니다.
                </p>
              </div>

              {/* Third Party Sharing */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    제3자 제공
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  수집된 민감정보는 <span className="font-medium text-foreground">비식별화된 통계 데이터</span>로만 리서치 의뢰 기업에 제공됩니다. 
                  개인을 식별할 수 있는 원본 데이터는 제3자에게 제공되지 않습니다.
                </p>
              </div>
            </div>

            {/* Expandable Full Terms */}
            <button
              onClick={() => setShowFullTerms(!showFullTerms)}
              className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-muted-foreground">전문 보기</span>
              {showFullTerms ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showFullTerms && (
              <div className="p-3 bg-muted/20 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  <strong>제1조 (민감정보의 정의)</strong><br />
                  민감정보란 개인정보보호법 제23조에 따라 사상·신념, 노동조합·정당의 가입·탈퇴, 정치적 견해, 
                  건강, 성생활 등에 관한 정보, 그 밖에 정보주체의 사생활을 현저히 침해할 우려가 있는 개인정보를 말합니다.
                </p>
                <p>
                  <strong>제2조 (수집 방법)</strong><br />
                  이용자가 직접 입력하거나, 이용자의 동의 하에 제휴 기관(건강보험공단, 금융기관 등)으로부터 
                  API를 통해 안전하게 수집합니다.
                </p>
                <p>
                  <strong>제3조 (보안 조치)</strong><br />
                  수집된 민감정보는 AES-256 암호화를 적용하여 저장되며, 종단간 암호화(E2E)를 통해 전송됩니다. 
                  접근 권한은 최소한의 담당자에게만 부여됩니다.
                </p>
                <p>
                  <strong>제4조 (파기 절차)</strong><br />
                  보유 기간이 경과하거나 처리 목적이 달성된 경우, 지체 없이 해당 개인정보를 파기합니다. 
                  전자적 파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제합니다.
                </p>
              </div>
            )}

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              <div 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                  consentChecked 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-muted/30 border-border hover:border-primary/20"
                )}
                onClick={() => setConsentChecked(!consentChecked)}
              >
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  <span className="font-semibold text-primary">[필수]</span> 위 민감정보 수집·이용에 동의합니다.
                </label>
              </div>

              <div 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                  purposeChecked 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-muted/30 border-border hover:border-primary/20"
                )}
                onClick={() => setPurposeChecked(!purposeChecked)}
              >
                <Checkbox
                  id="purpose"
                  checked={purposeChecked}
                  onCheckedChange={(checked) => setPurposeChecked(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="purpose" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  <span className="font-semibold text-primary">[필수]</span> 수집 목적 및 이용 범위를 확인하였습니다.
                </label>
              </div>

              <div 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                  thirdPartyChecked 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-muted/30 border-border hover:border-primary/20"
                )}
                onClick={() => setThirdPartyChecked(!thirdPartyChecked)}
              >
                <Checkbox
                  id="thirdParty"
                  checked={thirdPartyChecked}
                  onCheckedChange={(checked) => setThirdPartyChecked(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="thirdParty" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  <span className="font-semibold text-primary">[필수]</span> 비식별화된 통계 데이터의 제3자 제공에 동의합니다.
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Buttons */}
        <AlertDialogFooter className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 rounded-xl border-border"
            >
              동의하지 않음
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!allChecked}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold transition-all",
                allChecked
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              동의하고 연동하기
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SensitiveDataConsentDialog;
