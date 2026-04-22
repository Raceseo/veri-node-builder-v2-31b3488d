import { useState, useEffect } from "react";
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, History, 
  ChevronRight, CreditCard, Building2, TrendingUp, Clock
} from "lucide-react";
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
}

const recentTransactions = [
  { id: 1, type: "income", description: "삼성카드 데이터 판매", amount: 12500, date: "오늘 14:23" },
  { id: 2, type: "income", description: "롯데마트 리워드", amount: 8000, date: "어제 11:45" },
  { id: 3, type: "withdraw", description: "계좌 출금", amount: -50000, date: "3일 전" },
  { id: 4, type: "income", description: "신한은행 데이터 판매", amount: 15000, date: "5일 전" },
];

// Helper to get tier from trust score
const getTierFromScore = (score: number): "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum" => {
  if (score >= 95) return "Platinum";
  if (score >= 85) return "Diamond";
  if (score >= 75) return "Gold";
  if (score >= 60) return "Silver";
  return "Bronze";
};

const SupplierWalletTab = ({
  vnBalance,
  trustScore,
  displayName,
}: SupplierWalletTabProps) => {
  const { user } = useAuth();
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
            <p className="text-sm font-semibold text-blue-600">{formatCurrency(lockedBalance)} VN</p>
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

      {/* Tabs: History / Status / Account / Withdrawal / Simulation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="balance" className="text-xs">내역</TabsTrigger>
          <TabsTrigger value="status" className="text-xs">정산</TabsTrigger>
          <TabsTrigger value="account" className="text-xs">계좌</TabsTrigger>
          <TabsTrigger value="withdraw" className="text-xs">출금</TabsTrigger>
          <TabsTrigger value="simulation" className="text-xs">연금</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="mt-4 space-y-3">
          {recentTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    {tx.type === "income" ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.amount > 0 ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)} VN
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}

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
      </Tabs>
    </div>
  );
};

export default SupplierWalletTab;
