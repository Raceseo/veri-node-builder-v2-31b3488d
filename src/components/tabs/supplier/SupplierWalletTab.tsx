import { useState, useEffect } from "react";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Loader2,
  ChevronRight, CreditCard, Building2, TrendingUp, Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import RollingNumber from "@/components/animations/RollingNumber";
import DigitalBadgeCard from "@/components/DigitalBadgeCard";
import WithdrawalSimulation from "@/components/wallet/WithdrawalSimulation";
import WithdrawalForm from "@/components/wallet/WithdrawalForm";
import BankAccountRegistration from "@/components/wallet/BankAccountRegistration";
import WithdrawalStatusList from "@/components/wallet/WithdrawalStatusList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SupplierWalletTabProps {
  vnBalance: number;
  trustScore: number;
  displayName: string;
  /** B-34: 배지의 "VeriNode Certified" 표시 여부. 실제 인증 상태만 반영한다. */
  isVerified?: boolean;
}

// 거래 type → 사실 기반 한국어 라벨. 미지 type 은 type 문자열 그대로(허위 라벨 금지).
const TX_TYPE_LABEL: Record<string, string> = {
  survey_reward: "설문 참여 보상",
};

// Helper to get tier from trust score
const getTierFromScore = (score: number): "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum" => {
  if (score >= 95) return "Platinum";
  if (score >= 85) return "Diamond";
  if (score >= 75) return "Gold";
  if (score >= 60) return "Silver";
  return "Bronze";
};

// 출금 정직화: 지급 실행부 미구현·환율 Mock 상태라 출금 UI 전면 차단(카페 배포 전).
// 이 상수만 true 로 되돌리면 탭·출금버튼·원화표기가 그대로 복원된다(코드 삭제 없음).
const WITHDRAWAL_ENABLED: boolean = false;

const SupplierWalletTab = ({
  vnBalance,
  trustScore,
  displayName,
  isVerified = false,
}: SupplierWalletTabProps) => {
  const { user } = useAuth();

  // B-64: 지갑 내역 실거래 조회. 타입 화이트리스트 없이 해당 유저 전체 거래 최신 5건.
  //   별도 queryKey 로 WalletView(type='earn' 필터)의 캐시와 분리한다.
  const { data: recentTransactions, isLoading: txLoading } = useQuery({
    queryKey: ["supplier-wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const [activeTab, setActiveTab] = useState("balance");
  const [escrowedBalance, setEscrowedBalance] = useState(0);

  // 7일 숙성 중인 잔액 계산 (verification_history에서 7일 이내 수익)
  useEffect(() => {
    const fetchEscrowedBalance = async () => {
      if (!user?.id) return;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      try {
        // verification_history에서 7일 이내 VN 수익 조회
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.abs(value));
  };

  const lockedBalance = Math.floor(vnBalance * 0.2); // 20% locked for pension
  const availableBalance = vnBalance - lockedBalance;
  const withdrawableBalance = Math.max(0, availableBalance - escrowedBalance);
  const tier = getTierFromScore(trustScore);

  return (
    <div className="p-4 space-y-4">
      {/* Digital Badge */}
      <DigitalBadgeCard
        userName={displayName}
        tier={tier}
        isVerified={isVerified}
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
          {WITHDRAWAL_ENABLED && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatCurrency(vnBalance * 10)} 원
            </p>
          )}
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
            <p className="text-[10px] text-muted-foreground mb-0.5">적립 예정</p>
            <p className="text-sm font-semibold text-blue-600">{formatCurrency(lockedBalance)} VN</p>
          </div>
        </div>

        <div className="flex gap-2">
          {WITHDRAWAL_ENABLED && (
            <Button className="flex-1" variant="default" onClick={() => setActiveTab('withdraw')}>
              <ArrowUpRight className="w-4 h-4 mr-2" />
              출금
            </Button>
          )}
          <Button className="flex-1" variant="outline">
            <ArrowDownLeft className="w-4 h-4 mr-2" />
            충전
          </Button>
        </div>
      </Card>

      {/* Tabs: History / Status / Account / Withdrawal / Simulation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`w-full grid ${WITHDRAWAL_ENABLED ? "grid-cols-5" : "grid-cols-1"}`}>
          <TabsTrigger value="balance" className="text-xs">내역</TabsTrigger>
          {WITHDRAWAL_ENABLED && (
            <>
              <TabsTrigger value="status" className="text-xs">정산</TabsTrigger>
              <TabsTrigger value="account" className="text-xs">계좌</TabsTrigger>
              <TabsTrigger value="withdraw" className="text-xs">출금</TabsTrigger>
              <TabsTrigger value="simulation" className="text-xs">연금</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="balance" className="mt-4 space-y-3">
          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !recentTransactions || recentTransactions.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">아직 거래 내역이 없습니다</p>
            </Card>
          ) : (
            recentTransactions.map((tx, index) => (
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
                      <p className="text-sm font-medium text-foreground">{TX_TYPE_LABEL[tx.type] ?? tx.type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MM.dd")}</p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {tx.amount > 0 ? "+" : tx.amount < 0 ? "-" : ""}{formatCurrency(tx.amount)} VN
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {WITHDRAWAL_ENABLED && (
          <>
            <TabsContent value="status" className="mt-4">
              <WithdrawalStatusList />
            </TabsContent>

            <TabsContent value="account" className="mt-4">
              <BankAccountRegistration
                onRegistered={() => {
                  console.log('Account registered successfully');
                }}
              />
            </TabsContent>

            <TabsContent value="withdraw" className="mt-4">
              <WithdrawalForm
                availableBalance={availableBalance}
                escrowedBalance={escrowedBalance}
                onSubmit={(data) => {
                  console.log('Withdrawal submitted:', data);
                  setActiveTab('status'); // 정산 현황 탭으로 이동
                }}
              />
            </TabsContent>

            <TabsContent value="simulation" className="mt-4">
              <WithdrawalSimulation balance={vnBalance} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default SupplierWalletTab;
