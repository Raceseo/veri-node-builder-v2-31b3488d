import { useState } from "react";
import { Shield, Building2, Lock, ArrowRight, Clock, Sparkles, Fingerprint, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { valuationService } from "@/services/valuationService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import IdentityVerificationDialog from "./IdentityVerificationDialog";

interface WithdrawalFormProps {
  availableBalance: number;
  escrowedBalance?: number;
  onSubmit?: (data: any) => void;
}

const banks = [
  { code: "004", name: "KB국민은행" },
  { code: "088", name: "신한은행" },
  { code: "020", name: "우리은행" },
  { code: "081", name: "하나은행" },
  { code: "090", name: "카카오뱅크" },
  { code: "092", name: "토스뱅크" },
];

// 1,000만원 이상은 관리자 2인 승인 필요
const HIGH_VALUE_THRESHOLD = 10000000;

// 출금 정직화: 실물 테이블(withdrawal_requests) 부재로 출금 실행이 불가한 상태.
// 출금 실구현 시 이 플래그만 true로 되돌리면 기존 폼이 그대로 복원된다. (코드 삭제 없음)
const WITHDRAWAL_ENABLED: boolean = false;

const WithdrawalForm = ({ availableBalance, escrowedBalance = 0, onSubmit }: WithdrawalFormProps) => {
  const { user } = useAuth();
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  // 사용자 신뢰 점수 조회
  const { data: trustScore } = useQuery({
    queryKey: ['trustScore', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase.from('profiles').select('trust_score').eq('id', user.id).single();
      return data?.trust_score || 0;
    }
  });

  const withdrawableBalance = Math.max(0, availableBalance - escrowedBalance);
  const withdrawAmount = parseInt(amount) || 0;
  const isHighValue = withdrawAmount >= HIGH_VALUE_THRESHOLD;
  const fee = Math.ceil(withdrawAmount * 0.01);
  const estimatedBonus = valuationService.getSynergyBonus(withdrawAmount, trustScore || 0, 7);
  const netAmount = withdrawAmount - fee + estimatedBonus;

  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

  const handleQuickAmount = (value: number) => {
    if (value <= withdrawableBalance) setAmount(value.toString());
  };

  const handleWithdrawClick = () => {
    if (!selectedBank || !accountNumber || !amount || !user) return;
    if (withdrawAmount <= 0 || withdrawAmount > withdrawableBalance) {
      toast.error("유효하지 않은 금액입니다", {
        description: `최대 출금 가능 금액: ${formatCurrency(withdrawableBalance)} VN`
      });
      return;
    }
    setShowVerificationDialog(true);
  };

  // ✅ Edge Function 대신 직접 DB에 저장 (테스트 모드)
  const handleVerifiedWithdrawal = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const bankName = banks.find(b => b.code === selectedBank)?.name || selectedBank;

      // withdrawals 테이블에 직접 저장
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: withdrawAmount,
          fee: fee,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: '본인(인증완료)',
          status: 'pending',
          requires_dual_approval: isHighValue,
          synergy_bonus: estimatedBonus,
        } as any);

      if (error) throw error;

      if (isHighValue) {
        toast.success("고액 출금 요청이 접수되었습니다", {
          description: "관리자 2인 승인 후 입금됩니다. (예상 소요시간: 24시간)",
          duration: 8000,
          icon: <Shield className="w-5 h-5 text-amber-500" />
        });
      } else {
        toast.success("출금 요청이 접수되었습니다!", {
          description: `예상 입금액: ₩${formatCurrency(netAmount * 10)} (수수료: ${formatCurrency(fee)} VN)`,
          duration: 6000,
        });
      }

      setSelectedBank("");
      setAccountNumber("");
      setAmount("");

      await onSubmit?.({
        bank: selectedBank,
        accountNumber,
        amount: withdrawAmount,
        status: isHighValue ? 'pending_dual_approval' : 'pending'
      });

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error("출금 처리 중 오류가 발생했습니다", {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedBank && accountNumber.length >= 10 && withdrawAmount > 0 && withdrawAmount <= withdrawableBalance;

  // 출금 준비 중: 실행 경로(금액·계좌 입력, 본인확인 다이얼로그, withdrawals insert) 전체를
  // 렌더 이전 단계에서 차단하고 안내만 노출한다. 아래 원본 폼은 보존됨.
  if (!WITHDRAWAL_ENABLED) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#1e3a5f]/20 to-background border-[#1e3a5f]/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-[#c9a227]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">출금 기능은 준비 중입니다.</p>
            <p className="text-xs text-muted-foreground mt-1">적립된 VN은 그대로 유지됩니다.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-[#1e3a5f]/20 to-background border-[#1e3a5f]/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/30 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[#c9a227]" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">VN 출금 (데이터 자산 실현)</h3>
          <p className="text-xs text-muted-foreground">가치 평가 후 KRW로 환산되어 입금됩니다</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-1 mb-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <p className="text-[10px] text-emerald-600 font-medium">출금 가능</p>
          </div>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(withdrawableBalance)} VN</p>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <p className="text-[10px] text-amber-600 font-medium">숙성 중</p>
          </div>
          <p className="text-lg font-bold text-amber-600">{formatCurrency(escrowedBalance)} VN</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-foreground">출금 은행</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-full bg-background border-border">
              <SelectValue placeholder="은행을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    {bank.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-foreground">계좌번호</Label>
          <Input
            type="text"
            placeholder="'-' 없이 입력"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            className="bg-background border-border"
            maxLength={16}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-foreground">출금 금액 (VN)</Label>
          <Input
            type="text"
            placeholder="출금할 금액 입력"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            className="bg-background border-border text-lg font-semibold"
          />
          <div className="flex gap-2 mt-2">
            {[10000, 50000, 100000, 10000000].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(val)}
                disabled={val > withdrawableBalance}
                className={`flex-1 text-xs ${val >= 10000000 ? 'border-amber-500/50 text-amber-500' : ''}`}
              >
                {val >= 10000000 ? '1천만' : formatCurrency(val)}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(withdrawableBalance)}
              disabled={withdrawableBalance <= 0}
              className="flex-1 text-xs bg-[#c9a227]/10 border-[#c9a227]/30 text-[#c9a227]"
            >
              전액
            </Button>
          </div>
        </div>

        {isHighValue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3"
          >
            <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700/90 dark:text-amber-400">
              <p className="font-bold mb-1">고액 거래 안전 장치 (Dual Admin Approval)</p>
              1,000만원 이상 출금 시, 자산 보호를 위해 <span className="font-bold">관리자 2인의 승인</span> 절차가 진행됩니다.
            </div>
          </motion.div>
        )}

        {withdrawAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-secondary/50 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">출금 금액</span>
              <span className="font-semibold">{formatCurrency(withdrawAmount)} VN</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">수수료 (1%)</span>
              <span className="text-red-500">-{formatCurrency(fee)} VN</span>
            </div>
            {estimatedBonus > 0 && (
              <div className="flex items-center justify-between text-sm bg-indigo-500/10 p-1.5 rounded">
                <span className="text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 데이터 시너지 보너스
                </span>
                <span className="text-indigo-400 font-bold">+{formatCurrency(estimatedBonus)} VN</span>
              </div>
            )}
            <div className="border-t border-border mt-2 pt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">최종 예상 입금액</span>
              <span className="font-bold text-[#c9a227]">₩{formatCurrency(netAmount * 10)}</span>
            </div>
          </motion.div>
        )}

        <Button
          onClick={handleWithdrawClick}
          disabled={!isValid || isSubmitting || withdrawableBalance <= 0}
          className="w-full bg-[#1e3a5f] hover:bg-[#2d5a87] text-white"
        >
          {isSubmitting ? "출금 처리 중..." : (
            <>
              {isHighValue ? <Users className="w-4 h-4 mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
              {isHighValue ? "승인 요청 (듀얼 인증)" : "본인 인증 후 즉시 출금"}
            </>
          )}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <div className="flex items-start gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-emerald-600">VeriNode Secure Transaction</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              AES-256 암호화 및 실시간 이상 거래 탐지 시스템(FDS)이 작동 중입니다.
            </p>
          </div>
        </div>
      </div>

      <IdentityVerificationDialog
        isOpen={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        onVerified={handleVerifiedWithdrawal}
        amount={withdrawAmount}
        userEmail={user?.email}
      />
    </Card>
  );
};

export default WithdrawalForm;
