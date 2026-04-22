import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, Shield, Lock, CheckCircle2, 
  Fingerprint, ArrowRight, Sparkles, Coins, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface WithdrawalSimulationProps {
  balance: number;
  onComplete?: (amount: number) => void;
}

type WithdrawalStep = "idle" | "input" | "verify" | "processing" | "transferring" | "complete" | "error";

const WithdrawalSimulation = ({ balance, onComplete }: WithdrawalSimulationProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<WithdrawalStep>("idle");
  const [withdrawAmount, setWithdrawAmount] = useState<number>(Math.min(balance, 50000));
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // 계좌 정보 상태
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const handleStartWithdraw = () => {
    if (balance <= 0) {
      toast.error("출금 가능한 잔액이 없습니다");
      return;
    }
    setStep("input");
  };

  const handleSubmitWithdraw = async () => {
    // 클라이언트 측 입력 검증 (서버 측에서도 DB 제약으로 추가 검증)
    const trimmedBankName = bankName.trim();
    const trimmedAccountNumber = accountNumber.trim();
    const trimmedAccountHolder = accountHolder.trim();
    
    if (!trimmedBankName || !trimmedAccountNumber || !trimmedAccountHolder) {
      toast.error("모든 계좌 정보를 입력해주세요");
      return;
    }

    // 은행명 길이 검증 (2-50자)
    if (trimmedBankName.length < 2 || trimmedBankName.length > 50) {
      toast.error("은행명은 2-50자 사이로 입력해주세요");
      return;
    }

    // 계좌번호 형식 검증 (10-16자리 숫자만)
    if (!/^\d{10,16}$/.test(trimmedAccountNumber)) {
      toast.error("계좌번호는 10-16자리 숫자로 입력해주세요");
      return;
    }

    // 예금주 길이 검증 (2-50자)
    if (trimmedAccountHolder.length < 2 || trimmedAccountHolder.length > 50) {
      toast.error("예금주명은 2-50자 사이로 입력해주세요");
      return;
    }

    // 금액 검증 (최소 1,000원, 최대 10,000,000원)
    if (withdrawAmount < 1000 || withdrawAmount > 10000000) {
      toast.error("출금 금액은 1,000원 ~ 10,000,000원 사이로 입력해주세요");
      return;
    }

    if (withdrawAmount > balance) {
      toast.error("출금 가능 금액을 초과했습니다");
      return;
    }

    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setStep("verify");
    
    // V-Core 보안 인증 시뮬레이션
    setTimeout(() => {
      setStep("processing");
    }, 2000);

    // Edge Function을 통해 암호화된 출금 요청 처리
    setTimeout(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          setErrorMessage("로그인이 필요합니다");
          setStep("error");
          return;
        }

        // Edge Function 호출 (계좌 정보 암호화 처리)
        const { data, error } = await supabase.functions.invoke('process-withdrawal', {
          body: {
            amount: withdrawAmount,
            bankName: trimmedBankName,
            accountNumber: trimmedAccountNumber,
            accountHolder: trimmedAccountHolder
          }
        });

        if (error) {
          console.error('Withdrawal error:', error);
          setErrorMessage(error.message || "출금 요청 중 오류가 발생했습니다");
          setStep("error");
          return;
        }

        if (!data?.success) {
          setErrorMessage(data?.error || "출금 요청 중 오류가 발생했습니다");
          setStep("error");
          return;
        }

        setStep("transferring");
        setShowPointsAnimation(true);
        
        // 포인트 적립 애니메이션
        let currentPoints = 0;
        const targetPoints = Math.round(withdrawAmount * 0.01); // 1% 보너스
        const interval = setInterval(() => {
          currentPoints += Math.ceil(targetPoints / 20);
          if (currentPoints >= targetPoints) {
            currentPoints = targetPoints;
            clearInterval(interval);
          }
          setEarnedPoints(currentPoints);
        }, 50);

        // 완료
        setTimeout(() => {
          setStep("complete");
          onComplete?.(withdrawAmount);
          toast.success("출금 요청이 완료되었습니다");
        }, 2000);
        
      } catch (err) {
        console.error('Unexpected error:', err);
        setErrorMessage("예기치 않은 오류가 발생했습니다");
        setStep("error");
      }
    }, 2000);
  };

  const resetSimulation = () => {
    setStep("idle");
    setEarnedPoints(0);
    setShowPointsAnimation(false);
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setErrorMessage("");
    setWithdrawAmount(Math.min(balance, 50000));
  };

  const getStepContent = () => {
    switch (step) {
      case "input":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 text-center">출금 정보 입력</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm text-muted-foreground">출금 금액</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    max={balance}
                    min={1000}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">최대 ₩{balance.toLocaleString()}</p>
              </div>
              
              <div>
                <Label htmlFor="bankName" className="text-sm text-muted-foreground">은행명</Label>
                <Input
                  id="bankName"
                  placeholder="예: 카카오뱅크"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber" className="text-sm text-muted-foreground">계좌번호</Label>
                <Input
                  id="accountNumber"
                  placeholder="'-' 없이 입력"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="accountHolder" className="text-sm text-muted-foreground">예금주</Label>
                <Input
                  id="accountHolder"
                  placeholder="예: 홍길동"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">출금 금액</span>
                <span>₩{withdrawAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">수수료 (1%)</span>
                <span>-₩{Math.round(withdrawAmount * 0.01).toLocaleString()}</span>
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
                <span>실수령액</span>
                <span className="text-primary">₩{Math.round(withdrawAmount * 0.99).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={resetSimulation} className="flex-1">
                취소
              </Button>
              <Button onClick={handleSubmitWithdraw} className="flex-1 bg-primary">
                출금 신청
              </Button>
            </div>
          </motion.div>
        );

      case "verify":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"
            >
              <Fingerprint className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-2">V-Core 보안 인증 중...</h3>
            <p className="text-sm text-muted-foreground">
              생체 인증으로 본인 확인을 진행합니다
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>
        );

      case "processing":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-2">보안 처리 중...</h3>
            <p className="text-sm text-muted-foreground">
              Military-Grade 암호화로 안전하게 처리합니다
            </p>
            <div className="mt-4 max-w-xs mx-auto">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </div>
            </div>
          </motion.div>
        );

      case "transferring":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center relative"
            >
              <Wallet className="w-10 h-10 text-white" />
              
              {/* Coin Animation */}
              <AnimatePresence>
                {showPointsAnimation && (
                  <>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          opacity: 1, 
                          x: 0, 
                          y: 0,
                          scale: 1
                        }}
                        animate={{ 
                          opacity: [1, 1, 0],
                          x: [0, (Math.random() - 0.5) * 100],
                          y: [0, -80 - Math.random() * 40],
                          scale: [1, 1.2, 0.5]
                        }}
                        transition={{ 
                          duration: 1.5,
                          delay: i * 0.2,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                        className="absolute"
                      >
                        <Coins className="w-6 h-6 text-amber-400" />
                      </motion.div>
                    ))}
                  </>
                )}
              </AnimatePresence>
            </motion.div>
            
            <h3 className="text-lg font-bold text-foreground mb-2">출금 요청 처리 중...</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ₩{withdrawAmount.toLocaleString()} 출금 요청
            </p>
            
            {/* Earned Points Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-bold">+{earnedPoints} 보너스 포인트 적립 중</span>
            </motion.div>
          </motion.div>
        );

      case "complete":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-lg font-bold text-foreground mb-2">출금 요청 완료!</h3>
            <p className="text-3xl font-bold text-emerald-600 mb-2">
              ₩{withdrawAmount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              출금 요청이 접수되었습니다. 영업일 1-2일 내 입금됩니다.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">+{earnedPoints} 보너스 포인트 획득!</span>
            </div>
            
            <Button 
              onClick={resetSimulation}
              variant="outline"
              className="px-6"
            >
              닫기
            </Button>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">출금 요청 실패</h3>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <Button onClick={resetSimulation} variant="outline">
              다시 시도
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (step !== "idle") {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-lg">
        {getStepContent()}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold">수익 출금하기</h3>
          <p className="text-sm text-emerald-100">V-Core 보안 인증 후 즉시 출금</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-emerald-100">출금 가능 금액</span>
          <div className="flex items-center gap-1 text-xs text-emerald-200">
            <Lock className="w-3 h-3" />
            V-Core 보호
          </div>
        </div>
        <p className="text-2xl font-bold">₩{balance.toLocaleString()}</p>
      </div>

      <Button
        onClick={handleStartWithdraw}
        className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold py-6"
        disabled={balance <= 0}
      >
        <span className="flex items-center gap-2">
          출금 신청하기
          <ArrowRight className="w-4 h-4" />
        </span>
      </Button>

      <p className="text-xs text-emerald-200 text-center mt-3">
        출금 시 1% 보너스 포인트가 적립됩니다
      </p>
    </motion.div>
  );
};

export default WithdrawalSimulation;
