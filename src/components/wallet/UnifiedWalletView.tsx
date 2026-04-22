/**
 * UnifiedWalletView - 통합 지갑 컴포넌트
 * 
 * 기존 3개 지갑 컴포넌트 통합:
 * - WalletTab, SupplierWalletTab, WalletView 기능 통합
 * - mode prop으로 표시 모드 전환
 * 
 * 사용법:
 * <UnifiedWalletView mode="compact" />  // 탭 내 간단 표시
 * <UnifiedWalletView mode="full" />     // 전체 화면 지갑
 */
import { useState, useEffect } from "react";
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, History, 
  ChevronRight, Clock, Copy, CheckCircle2, Loader2,
  ShieldAlert, KeyRound, CheckCircle, TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import RollingNumber from "@/components/animations/RollingNumber";
import DigitalBadgeCard from "@/components/DigitalBadgeCard";
import WithdrawalSimulation from "@/components/wallet/WithdrawalSimulation";
import WithdrawalForm from "@/components/wallet/WithdrawalForm";
import BankAccountRegistration from "@/components/wallet/BankAccountRegistration";
import WithdrawalStatusList from "@/components/wallet/WithdrawalStatusList";
import WithdrawalLimitsCard from "@/components/wallet/WithdrawalLimitsCard";
import DataPensionSection from "@/components/wallet/DataPensionSection";
import { OTPVerificationDialog } from "@/components/dialogs/OTPVerificationDialog";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useAuth } from "@/hooks/useAuth";

type WalletMode = "compact" | "full";

interface UnifiedWalletViewProps {
  mode?: WalletMode;
  onOpenDataAssetDashboard?: () => void;
  estimatedMonthlyPension?: number;
}

// Helper to get tier from trust score
const getTierFromScore = (score: number): "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum" => {
  if (score >= 95) return "Platinum";
  if (score >= 85) return "Diamond";
  if (score >= 75) return "Gold";
  if (score >= 60) return "Silver";
  return "Bronze";
};

const UnifiedWalletView = ({
  mode = "compact",
  onOpenDataAssetDashboard,
  estimatedMonthlyPension,
}: UnifiedWalletViewProps) => {
  const { user } = useAuth();
  const { vnBalance, lockedBalance, trustScore, displayName, isLoading: profileLoading } = useProfileContext();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("balance");
  const [escrowedBalance, setEscrowedBalance] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null);

  const walletAddress = "0x1a2b...9f8e";
  const tier = getTierFromScore(trustScore);

  // 7일 숙성 중인 잔액 계산
  useEffect(() => {
    const fetchEscrowedBalance = async () => {
      if (!user?.id) return;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      try {
        const { data, error } = await supabase
          .from('verification_history')
          .select('vn_earned')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (error) throw error;
        const escrowed = (data || []).reduce((sum, item) => sum + (item.vn_earned || 0), 0);
        setEscrowedBalance(escrowed);
      } catch (error) {
        console.error('Failed to fetch escrowed balance:', error);
      }
    };

    fetchEscrowedBalance();
  }, [user?.id]);

  // Realtime subscription for withdrawals
  useEffect(() => {
    if (!user?.id) return;

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
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // 최근 거래 내역 조회
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 최근 출금 내역 조회
  const { data: withdrawals, isLoading: wdLoading } = useQuery({
    queryKey: ['recent-withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 출금 신청 mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id) throw new Error("로그인이 필요합니다");

      const availableBalance = vnBalance - lockedBalance;
      if (amount > availableBalance) {
        throw new Error("출금 가능 잔액이 부족합니다");
      }
      if (amount < 500) {
        throw new Error("최소 출금 금액은 500 VN입니다");
      }

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

      // Update locked_balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ locked_balance: lockedBalance + amount })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: (data) => {
      setPendingWithdrawalId(data.id);
      setOtpDialogOpen(true);
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['recent-withdrawals', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "출금 신청 실패",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleOTPSuccess = () => {
    toast({
      title: "출금 완료! 🎉",
      description: "출금이 성공적으로 처리되었습니다.",
    });
    queryClient.invalidateQueries({ queryKey: ['recent-withdrawals', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['recent-transactions', user?.id] });
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.abs(value));
  };

  const pensionLockedBalance = Math.floor(vnBalance * 0.2);
  const availableBalance = vnBalance - lockedBalance;
  const withdrawableBalance = Math.max(0, availableBalance - escrowedBalance);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============ COMPACT MODE ============
  if (mode === "compact") {
    return (
      <div className="space-y-4">
        {/* Balance Card */}
        <div className="bg-gradient-primary rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">VN Token 잔액</p>
                <p className="text-3xl font-bold text-white">
                  {vnBalance.toLocaleString()} <span className="text-lg">VN</span>
                </p>
              </div>
            </div>

            {lockedBalance > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/20 mb-3">
                <span className="text-sm text-white/80 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" />
                  보류 중
                </span>
                <span className="text-sm font-bold text-white">
                  {lockedBalance.toLocaleString()} VN
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

            {/* 출금 입력 */}
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
                      <ArrowUpRight className="w-4 h-4 mr-1" /> 출금
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-white/60">
                출금 가능: {availableBalance.toLocaleString()} VN · 최소 출금: 500 VN
              </p>
            </div>
          </div>
        </div>

        {/* 출금 한도 */}
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
              {withdrawals.slice(0, 5).map((wd) => (
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

        {/* OTP Dialog */}
        <OTPVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          withdrawalId={pendingWithdrawalId}
          onSuccess={handleOTPSuccess}
        />
      </div>
    );
  }

  // ============ FULL MODE ============
  return (
    <div className="p-4 space-y-4">
      {/* Digital Badge */}
      <DigitalBadgeCard 
        userName={displayName}
        tier={tier}
      />

      {/* Balance Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">VN 잔액</span>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0">
            활성
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              <RollingNumber value={vnBalance} />
            </span>
            <span className="text-sm text-muted-foreground">VN</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {formatCurrency(vnBalance * 10)} 원
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <p className="text-[10px] text-muted-foreground mb-0.5">출금 가능</p>
            <p className="text-sm font-semibold text-emerald-600">{formatCurrency(withdrawableBalance)} VN</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-2.5 h-2.5 text-amber-500" />
              <p className="text-[10px] text-muted-foreground">숙성 중</p>
            </div>
            <p className="text-sm font-semibold text-amber-600">{formatCurrency(escrowedBalance)} VN</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <p className="text-[10px] text-muted-foreground mb-0.5">연금 적립</p>
            <p className="text-sm font-semibold text-blue-600">{formatCurrency(pensionLockedBalance)} VN</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" variant="default" onClick={() => setActiveTab('withdraw')}>
            <ArrowUpRight className="w-4 h-4 mr-2" />
            출금
          </Button>
          <Button className="flex-1" variant="outline">
            <ArrowDownLeft className="w-4 h-4 mr-2" />
            충전
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="balance" className="text-xs">내역</TabsTrigger>
          <TabsTrigger value="status" className="text-xs">정산</TabsTrigger>
          <TabsTrigger value="account" className="text-xs">계좌</TabsTrigger>
          <TabsTrigger value="withdraw" className="text-xs">출금</TabsTrigger>
          <TabsTrigger value="simulation" className="text-xs">연금</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="mt-4 space-y-3">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tx.amount > 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}>
                      {tx.amount > 0 ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{tx.description || '거래'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'MM월 dd일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)} VN
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">거래 내역이 없습니다</p>
            </div>
          )}

          <Button variant="ghost" className="w-full text-muted-foreground">
            <History className="w-4 h-4 mr-2" />
            전체 내역 보기
          </Button>
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          <WithdrawalStatusList />
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <BankAccountRegistration 
            onRegistered={() => console.log('Account registered')}
          />
        </TabsContent>

        <TabsContent value="withdraw" className="mt-4">
          <WithdrawalForm 
            availableBalance={availableBalance}
            escrowedBalance={escrowedBalance}
            onSubmit={() => setActiveTab('status')}
          />
        </TabsContent>

        <TabsContent value="simulation" className="mt-4">
          <WithdrawalSimulation balance={vnBalance} />
        </TabsContent>
      </Tabs>

      {/* Data Pension Section */}
      <DataPensionSection estimatedMonthlyPension={estimatedMonthlyPension} />

      {/* Data Asset Dashboard Button */}
      {onOpenDataAssetDashboard && (
        <button 
          onClick={onOpenDataAssetDashboard}
          className="w-full bg-gradient-to-r from-indigo-900/60 to-slate-900/80 rounded-2xl p-5 border border-indigo-500/30 flex items-center gap-4 hover:border-indigo-400/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-white font-bold">데이터 자산 관리 대시보드</h3>
            <p className="text-indigo-300/70 text-sm">연금 · 배당 · 통제 센터 관리</p>
          </div>
          <ChevronRight className="w-5 h-5 text-indigo-400" />
        </button>
      )}

      {/* OTP Dialog */}
      <OTPVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        withdrawalId={pendingWithdrawalId}
        onSuccess={handleOTPSuccess}
      />
    </div>
  );
};

export default UnifiedWalletView;
