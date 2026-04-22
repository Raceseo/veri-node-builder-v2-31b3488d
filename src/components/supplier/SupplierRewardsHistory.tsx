import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Coins, TrendingUp, Award, Clock, ChevronRight,
  Gift, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SupplierRewardsHistoryProps {
  limit?: number;
}

interface Payout {
  id: string;
  purchase_id: string;
  base_amount: number;
  quality_bonus: number;
  total_amount: number;
  verification_grade: string;
  bonus_breakdown: {
    verification: number;
    completeness: number;
    freshness: number;
  };
  paid_at: string;
  created_at: string;
}

export const SupplierRewardsHistory: React.FC<SupplierRewardsHistoryProps> = ({
  limit = 10,
}) => {
  const { user } = useAuth();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['supplier-payouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('supplier_payouts')
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Payout[];
    },
    enabled: !!user?.id,
  });

  // 총 수익 계산
  const { data: totalEarnings } = useQuery({
    queryKey: ['supplier-total-earnings', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, bonusTotal: 0 };

      const { data, error } = await supabase
        .from('supplier_payouts')
        .select('total_amount, quality_bonus')
        .eq('supplier_id', user.id);

      if (error) throw error;

      const total = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const bonusTotal = data?.reduce((sum, p) => sum + (p.quality_bonus || 0), 0) || 0;
      return { total, bonusTotal };
    },
    enabled: !!user?.id,
  });

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'platinum':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Platinum</Badge>;
      case 'gold':
        return <Badge className="bg-amber-500 text-white">Gold</Badge>;
      default:
        return <Badge variant="secondary">Silver</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-muted rounded-xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 총 수익 요약 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">총 데이터 판매 수익</p>
            <p className="text-2xl font-bold text-primary">
              {(totalEarnings?.total || 0).toLocaleString()} VN
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-emerald-600 text-sm">
              <Gift className="h-4 w-4" />
              <span>+{(totalEarnings?.bonusTotal || 0).toLocaleString()} 보너스</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              총 {payouts?.length || 0}건 거래
            </p>
          </div>
        </div>
      </motion.div>

      {/* 수익 내역 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          최근 수익 내역
        </h4>

        {(!payouts || payouts.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">아직 판매 수익이 없습니다</p>
            <p className="text-xs mt-1">데이터 판매를 시작하면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout, index) => (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">데이터 판매 수익</span>
                      {getGradeBadge(payout.verification_grade)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payout.paid_at || payout.created_at), 'M월 d일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    +{payout.total_amount.toLocaleString()} VN
                  </p>
                  {payout.quality_bonus > 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                      <Sparkles className="h-3 w-3" />
                      보너스 +{payout.quality_bonus.toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
