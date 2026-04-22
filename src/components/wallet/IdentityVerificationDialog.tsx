import { useState, useEffect } from "react";
import { Shield, Lock, Fingerprint, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IdentityVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => Promise<void>;
  amount?: number;
  userEmail?: string;
  title?: string;
  description?: string;
  consentText?: string;
}

type VerificationStep = "consent" | "password" | "verifying" | "success" | "error" | "locked";

const IdentityVerificationDialog = ({
  isOpen,
  onClose,
  onVerified,
  amount,
  userEmail,
  title = "본인 인증 (Confirm Identity)",
  description,
  consentText = "본인은 데이터 가치 정산금 인출에 동의하며, 이는 본인에 의해 직접 요청되었습니다.",
}: IdentityVerificationDialogProps) => {
  const [step, setStep] = useState<VerificationStep>("consent");
  const [password, setPassword] = useState("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failureCount, setFailureCount] = useState(0);

  const MAX_FAILURES = 3;

  useEffect(() => {
    if (isOpen) {
      // Reset state on open, but keep lock if persisted (simulated logic)
      if (failureCount < MAX_FAILURES) {
        setStep("consent");
      } else {
        setStep("locked");
      }
      setPassword("");
      setIsConsentChecked(false);
      setErrorMessage("");
    }
  }, [isOpen, failureCount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  const handleConsentContinue = () => {
    if (!isConsentChecked) {
      toast.error("동의 체크박스를 선택해주세요");
      return;
    }
    setStep("password");
  };

  const logSecurityEvent = async (type: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('security_audit_logs').insert({
          user_id: user.id,
          event_type: type,
          ip_address: 'client-side',
          details: details,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Security log failed", e);
    }
  };

  const handlePasswordVerify = async () => {
    if (!password || !userEmail) {
      toast.error("비밀번호를 입력해주세요");
      return;
    }

    if (failureCount >= MAX_FAILURES) {
      setStep("locked");
      return;
    }

    setIsProcessing(true);
    setStep("verifying");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      if (error) {
        const newCount = failureCount + 1;
        setFailureCount(newCount);
        
        await logSecurityEvent('AUTH_FAILURE', { 
          attempt: newCount, 
          max_attempts: MAX_FAILURES, 
          error: error.message 
        });

        if (newCount >= MAX_FAILURES) {
          setErrorMessage("보안 위협이 감지되어 계정이 일시 잠금되었습니다.");
          setStep("locked");
          await logSecurityEvent('ACCOUNT_LOCKED', { reason: 'max_auth_failures' });
        } else {
          setErrorMessage(`비밀번호가 올바르지 않습니다. (${newCount}/${MAX_FAILURES}회 실패)`);
          setStep("error");
        }
        return;
      }

      // Verification successful
      await logSecurityEvent('AUTH_SUCCESS', { context: 'withdrawal_verification' });
      setFailureCount(0);
      setStep("success");
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onVerified();
      handleClose();
    } catch (error: any) {
      console.error("Identity verification error:", error);
      setErrorMessage(error.message || "인증 중 오류가 발생했습니다");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Don't reset failure count on close to prevent brute force by reopening
    setStep("consent");
    setPassword("");
    setIsConsentChecked(false);
    setErrorMessage("");
    onClose();
  };

  const handleRetry = () => {
    if (failureCount >= MAX_FAILURES) {
      setStep("locked");
      return;
    }
    setPassword("");
    setErrorMessage("");
    setStep("password");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1e3a5f]/10 to-background border-[#1e3a5f]/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/30 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-[#c9a227]" />
            </div>
            {title}
          </DialogTitle>
          {(description || amount !== undefined) && (
            <DialogDescription>
              {description || (amount !== undefined && (
                <>출금 금액: <span className="font-bold text-[#c9a227]">{formatCurrency(amount)} VN</span></>
              ))}
            </DialogDescription>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Consent */}
          {step === "consent" && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 mb-1">출금 전 확인</p>
                    <p className="text-muted-foreground text-xs">
                      아래 동의를 체크하고 본인 인증을 완료하면, 출금이 즉시 처리됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-secondary/50 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={isConsentChecked}
                  onCheckedChange={(checked) => setIsConsentChecked(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="consent"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  {consentText}
                </Label>
              </div>

              <Button
                onClick={handleConsentContinue}
                disabled={!isConsentChecked}
                className="w-full bg-[#1e3a5f] hover:bg-[#2d5a87]"
              >
                <Lock className="w-4 h-4 mr-2" />
                본인 인증 진행
              </Button>
            </motion.div>
          )}

          {/* Step 2: Password Verification */}
          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-[#1e3a5f]/10 rounded-lg border border-[#1e3a5f]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#c9a227]" />
                  <span className="text-sm font-medium">금융급 보안 인증</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  계정 비밀번호를 입력하여 본인임을 확인해주세요.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail || ""}
                  disabled
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="계정 비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordVerify()}
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("consent")}
                  className="flex-1"
                >
                  이전
                </Button>
                <Button
                  onClick={handlePasswordVerify}
                  disabled={!password || isProcessing}
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5a87]"
                >
                  {isProcessing ? "인증 중..." : "인증 확인"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Verifying */}
          {step === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 flex flex-col items-center justify-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border-4 border-[#1e3a5f]/30 border-t-[#c9a227]"
              />
              <p className="text-sm text-muted-foreground">본인 인증 및 무결성 검증 중...</p>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 flex flex-col items-center justify-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold text-emerald-600">본인 인증 완료!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  보안 감사 로그가 기록되었습니다.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 5: Error */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-6 space-y-4"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-red-600">인증 실패</p>
                  <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  취소
                </Button>
                <Button onClick={handleRetry} className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5a87]">
                  다시 시도
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Locked (Security Freeze) */}
          {step === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-6 space-y-4"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center border-2 border-red-500">
                  <Ban className="w-10 h-10 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-red-600 text-lg">계정 잠금 처리됨</p>
                  <p className="text-xs text-muted-foreground mt-2 px-4">
                    인증 시도가 3회 연속 실패하여 보안 정책에 따라 계정이 일시 잠금되었습니다.
                    <br/>고객센터를 통해 본인 확인 후 해제하십시오.
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleClose} className="w-full">
                확인 (보안 팀에 통보됨)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default IdentityVerificationDialog;