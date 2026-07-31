import { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownRight, Copy, CheckCircle2, Loader2, ShieldAlert, Clock, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { OTPVerificationDialog } from "@/components/dialogs/OTPVerificationDialog";
import WithdrawalLimitsCard from "@/components/wallet/WithdrawalLimitsCard";

// 출금 정직화: 실물 테이블(withdrawal_requests) 부재로 출금 실행 불가.
// 실구현 시 true로 되돌리면 기존 입력 UI가 복원된다. (코드 삭제 없음)
const WITHDRAWAL_ENABLED: boolean = false;

const WalletTab = () => {
  const [isCopied, setIsCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const walletAddress = "0x1a2b...9f8e";

  // 사용자 프로필 조회 (잔액)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('profiles')
        .select('vn_balance, locked_balance, display_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Realtime subscription for withdrawals updates
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('wallet_withdrawals_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'withdrawals',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['recent-withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['profile-balance'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [queryClient]);

  // 최근 거래 내역 조회
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  // 출금 신청 mutation (withdrawals 테이블 사용)
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      // 잔액 확인
      const availableBalance = (profile?.vn_balance || 0) - (profile?.locked_balance || 0);
      if (amount > availableBalance) {
        throw new Error("출금 가능 잔액이 부족합니다");
      }

      if (amount < 500) {
        throw new Error("최소 출금 금액은 500 VN입니다");
      }

      // withdrawals 테이블에 직접 삽입 (OTP 인증 대기 상태)
      const fee = Math.ceil(amount * 0.01);
      const netAmount = amount - fee;

      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          fee: fee,
          net_amount: netAmount,
          status: 'pending',
          otp_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      // 프로필의 locked_balance 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          locked_balance: (profile?.locked_balance || 0) + amount
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: (data) => {
      // OTP 다이얼로그 열기
      setPendingWithdrawalId(data.id);
      setOtpDialogOpen(true);
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ['profile-balance'] });
      queryClient.invalidateQueries({ queryKey: ['recent-withdrawals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "출금 신청 실패",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleOTPSuccess = (result?: { newBalance?: number; amount?: number; netAmount?: number; limits?: any }) => {
    toast({
      title: "출금 완료! 🎉",
      description: result?.netAmount 
        ? `${result.netAmount.toLocaleString()} VN이 출금 처리되었습니다.`
        : "출금이 성공적으로 처리되었습니다.",
    });
    queryClient.invalidateQueries({ queryKey: ['recent-withdrawals'] });
    queryClient.invalidateQueries({ queryKey: ['profile-balance'] });
    queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['withdrawal-daily-stats'] });
    queryClient.invalidateQueries({ queryKey: ['withdrawal-monthly-stats'] });
    queryClient.invalidateQueries({ queryKey: ['withdrawal-limits'] });
    setPendingWithdrawalId(null);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText("0x1a2b3c4d5e6f7g8h9i0j9f8e");
    setIsCopied(true);
    toast({ title: "주소 복사됨", description: "지갑 주소가 클립보드에 복사되었습니다" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ 
        title: "금액 오류", 
        description: "올바른 금액을 입력해주세요",
        variant: "destructive"
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const getStatusBadge = (status: string, otpVerified?: boolean) => {
    if (status === 'pending' && !otpVerified) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          <KeyRound className="w-3 h-3" />
          OTP 대기
        </span>
      );
    }
    // Integration with 2-step approval
    if (status === 'pending_approval' || (status === 'pending' && otpVerified)) {
       return (
        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          1차 승인 대기
        </span>
      );
    }
    if (status === 'first_approved') {
       return (
        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          2차 승인 대기
        </span>
      );
    }
    if (status === 'processing' || status === 'approved') {
      return (
        <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          처리 중
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" />
          완료
        </span>
      );
    }
    if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
          취소/거절됨
        </span>
      );
    }
    return null;
  };

  // 최근 출금 내역 조회 (withdrawals 테이블)
  const { data: withdrawals, isLoading: wdLoading } = useQuery({
    queryKey: ['recent-withdrawals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const availableBalance = (profile?.vn_balance || 0) - (profile?.locked_balance || 0);

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="bg-gradient-primary rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">VN Token 잔액</p>
              <p className="text-3xl font-bold text-white">
                {profileLoading ? "..." : (profile?.vn_balance || 0).toLocaleString()} <span className="text-lg">VN</span>
              </p>
            </div>
          </div>

          {(profile?.locked_balance || 0) > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/20 mb-3">
              <span className="text-sm text-white/80 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                보류 중
              </span>
              <span className="text-sm font-bold text-white">
                {(profile?.locked_balance || 0).toLocaleString()} VN
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10 mb-4">
            <code className="text-sm text-white/80 flex-1">{walletAddress}</code>
            <button onClick={copyAddress} className="p-1.5 hover:bg-white/10 rounded">
              {isCopied ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-white/80" />
              )}
            </button>
          </div>

          {/* 출금 금액 입력 */}
          {WITHDRAWAL_ENABLED ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="출금 금액 (VN)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !withdrawAmount}
                className="bg-white text-primary hover:bg-white/90 border-0 min-w-[80px]"
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-1" /> 출금 신청 (2인 승인 대기)
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-white/60">
              출금 가능: {availableBalance.toLocaleString()} VN · 최소 출금: 500 VN
            </p>
          </div>
          ) : (
            <div className="space-y-1 p-3 rounded-lg bg-white/10">
              <p className="text-sm font-semibold text-white">출금 기능은 준비 중입니다.</p>
              <p className="text-xs text-white/70">적립된 VN은 그대로 유지됩니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 출금 한도 카드 */}
      <WithdrawalLimitsCard />

      {/* 최근 출금 내역 */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="text-base font-bold text-foreground mb-4">최근 출금 내역</h3>
        {wdLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : withdrawals && withdrawals.length > 0 ? (
          <div className="space-y-3">
            {withdrawals.map((wd) => (
              <div
                key={wd.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">출금 요청</p>
                    {getStatusBadge(wd.status, wd.otp_verified || false)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {wd.created_at ? format(new Date(wd.created_at), 'MM월 dd일 HH:mm', { locale: ko }) : ''}
                    {wd.fee && <span className="ml-2">수수료: {wd.fee.toLocaleString()} VN</span>}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-primary">
                    -{wd.amount.toLocaleString()} VN
                  </span>
                  {wd.status === 'pending' && !wd.otp_verified && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 h-7 text-xs"
                      onClick={() => {
                        setPendingWithdrawalId(wd.id);
                        setOtpDialogOpen(true);
                      }}
                    >
                      <KeyRound className="w-3 h-3 mr-1" />
                      인증
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">출금 내역이 없습니다</p>
          </div>
        )}
      </div>

      {/* 환율 정보 */}
      <div className="bg-secondary rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          환율: <span className="font-medium text-foreground">1 VN = $0.10</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">최소 출금: 500 VN</p>
      </div>

      {/* OTP 인증 다이얼로그 */}
      <OTPVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        withdrawalId={pendingWithdrawalId}
        onSuccess={handleOTPSuccess}
      />
    </div>
  );
};

export default WalletTab;