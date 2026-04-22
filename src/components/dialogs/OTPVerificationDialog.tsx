import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OTPVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawalId: string | null;
  onSuccess: (result?: { newBalance?: number; amount?: number; netAmount?: number; fee?: number }) => void;
}

export const OTPVerificationDialog = ({
  open,
  onOpenChange,
  withdrawalId,
  onSuccess,
}: OTPVerificationDialogProps) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5분
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // 타이머
  useEffect(() => {
    if (!open) {
      setRemainingTime(300);
      setOtp("");
      setDevOtp(null);
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // OTP 자동 발송
  useEffect(() => {
    if (open && withdrawalId) {
      generateOTP();
    }
  }, [open, withdrawalId]);

  const generateOTP = async () => {
    if (!withdrawalId) return;

    setIsResending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("로그인이 필요합니다");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-withdrawal-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ withdrawalId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP 생성 실패");
      }

      // 개발 환경용 OTP 표시
      if (data.otp) {
        setDevOtp(data.otp);
      }

      setRemainingTime(300);
      toast({
        title: "OTP 발송 완료",
        description: "인증 코드가 발송되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "OTP 발송 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const verifyOTP = async () => {
    if (!withdrawalId || otp.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("로그인이 필요합니다");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-withdrawal-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ withdrawalId, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP 인증 실패");
      }

      // 출금 완료 결과 전달
      onSuccess({
        newBalance: data.newBalance,
        amount: data.amount,
        netAmount: data.netAmount,
        fee: data.fee,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "인증 실패",
        description: error.message,
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            2차 인증
          </DialogTitle>
          <DialogDescription>
            출금 보안을 위해 OTP 인증이 필요합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 개발 환경 OTP 표시 */}
          {devOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">개발 환경</span>
              </div>
              <p className="text-amber-600 text-xs mt-1">
                OTP 코드: <span className="font-mono font-bold text-lg">{devOtp}</span>
              </p>
            </div>
          )}

          {/* 타이머 */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">남은 시간</p>
            <p className={`text-2xl font-bold ${remainingTime < 60 ? 'text-destructive' : 'text-foreground'}`}>
              {formatTime(remainingTime)}
            </p>
          </div>

          {/* OTP 입력 */}
          <div className="flex justify-center">
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              disabled={remainingTime === 0}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {remainingTime === 0 && (
            <p className="text-center text-sm text-destructive">
              OTP가 만료되었습니다. 재발송해주세요.
            </p>
          )}

          {/* 버튼들 */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={verifyOTP}
              disabled={otp.length !== 6 || isVerifying || remainingTime === 0}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  인증 중...
                </>
              ) : (
                "인증하기"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={generateOTP}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  OTP 재발송
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            인증 코드는 5분간 유효하며, 3회 실패 시 출금이 취소됩니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
