import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, TrendingUp, Lock, Bell, ChevronRight, Sparkles,
  Users, DollarSign, MapPin, Clock, Coffee, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeProfile } from "@/hooks/useRealtimeProfile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupplierApprovalList } from "@/components/approvals/SupplierApprovalList";

export const VeriNodeFinancialDashboard = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useRealtimeProfile(user?.id);
  const queryClient = useQueryClient();

  // ✅ 실제 data_sale_records 에서 가져오기
  const { data: saleRecords, isLoading: salesLoading } = useQuery({
    queryKey: ["sale-records", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("data_sale_records")
        .select("*")
        .eq("user_id", user.id)
        .order("sold_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // ✅ 실제 transactions 에서 가져오기
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // ✅ 실제 data_listings 에서 가져오기
  const { data: listings } = useQuery({
    queryKey: ["data-listings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("data_listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 수익 계산 (실제 DB 기반)
  const totalEarned = profile?.vn_balance || 0;
  const totalSaleEarnings = (saleRecords || []).reduce((sum, r) => sum + (r.net_amount || 0), 0);
  const estimatedDataValue = Math.max(totalEarned, totalSaleEarnings) * 3.6;
  const activeListings = (listings || []).filter(l => l.status === 'active').length;

  // 최근 수입 트랜잭션
  const recentIncome = (transactions || []).filter(t => t.amount > 0).slice(0, 5);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount / 1350);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-trust/5 p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-trust/5">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32">
        
        {/* Hero Banner - Data Value */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-secure text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-sm font-medium opacity-90">VeriNode</span>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold/30 hover:bg-gold/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {profile?.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm opacity-70 mb-1">My Data Value (Estimated)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display tracking-tight">{formatUSD(estimatedDataValue)}</span>
                    <span className="text-sm opacity-60">≈ {formatCurrency(estimatedDataValue)}</span>
                  </div>
                </div>
                
                <div className="h-px bg-white/20" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-60 mb-0.5">VN Balance</p>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-xl font-bold">{totalEarned.toLocaleString()} VN</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60 mb-0.5">Active Listings</p>
                    <span className="text-xl font-bold">{activeListings}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Card className="border-0 shadow-card bg-gradient-to-r from-success/5 to-trust-teal/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-verified flex items-center justify-center shadow-secure">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Financial Grade Security</p>
                    <div className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-trust-teal/10 text-trust-teal border-trust-teal/20">
                  Level {profile?.security_level || 0}
                </Badge>
              </div>
              
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">2-Admin Approval System</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  민감한 데이터 내보내기는 관리자 2인 승인이 필요합니다
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Approval Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <SupplierApprovalList />
        </motion.div>

        {/* Recent Sales */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  최근 판매 수익
                </div>
                <Badge variant="outline" className="font-normal">
                  {(saleRecords || []).length}건
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {salesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ) : (saleRecords || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  아직 판매 기록이 없습니다
                </div>
              ) : (
                (saleRecords || []).slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <div>
                      <p className="font-medium text-sm">{record.buyer_company}</p>
                      <p className="text-xs text-muted-foreground">
                        {(record.categories_sold || []).join(', ')}
                      </p>
                    </div>
                    <span className="font-semibold text-success">+{record.net_amount.toLocaleString()} VN</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-trust" />
                최근 거래 내역
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {txLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : (transactions || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  아직 거래 내역이 없습니다
                </div>
              ) : (
                (transactions || []).slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at || '').toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className={`font-semibold ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} VN
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Philosophy */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
          <div className="text-center py-4 px-6 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium text-primary/80 font-serif-accent">
              "데이터의 주인은 나이며, 무상으로 제공하지 않는다"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The owner of the data is me, and I do not provide it for free.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VeriNodeFinancialDashboard;
