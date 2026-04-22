import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle2, Clock, TrendingUp, 
  BarChart3, RefreshCw, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PurchaseCollectionStatusProps {
  purchaseId?: string;
  showAll?: boolean;
  limit?: number;
}

interface Purchase {
  id: string;
  product_title: string;
  unit_count: number;
  total_price: number;
  status: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SupplierPayout {
  id: string;
  supplier_id: string;
  total_amount: number;
  verification_grade: string;
  created_at: string;
}

export const PurchaseCollectionStatus: React.FC<PurchaseCollectionStatusProps> = ({
  purchaseId,
  showAll = true,
  limit = 5,
}) => {
  const { user } = useAuth();

  // 구매 목록 조회
  const { data: purchases, isLoading, refetch } = useQuery({
    queryKey: ['corporate-purchases', user?.id, purchaseId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('data_purchases')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (purchaseId) {
        query = query.eq('id', purchaseId);
      } else if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // 10초마다 새로고침
  });

  // 각 구매별 수집 현황 조회
  const { data: payoutCounts } = useQuery({
    queryKey: ['payout-counts', purchases?.map(p => p.id)],
    queryFn: async () => {
      if (!purchases || purchases.length === 0) return {};

      const purchaseIds = purchases.map(p => p.id);
      const { data, error } = await supabase
        .from('supplier_payouts')
        .select('purchase_id')
        .in('purchase_id', purchaseIds);

      if (error) throw error;

      // 구매별 카운트
      const counts: Record<string, number> = {};
      data?.forEach(payout => {
        counts[payout.purchase_id] = (counts[payout.purchase_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!purchases && purchases.length > 0,
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '완료', color: 'bg-emerald-500', icon: CheckCircle2 };
      case 'paid':
      case 'collecting':
        return { label: '수집중', color: 'bg-blue-500', icon: RefreshCw };
      case 'partial':
        return { label: '부분완료', color: 'bg-amber-500', icon: Clock };
      case 'pending':
        return { label: '결제대기', color: 'bg-slate-400', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-slate-400', icon: Clock };
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>아직 데이터 구매 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          데이터 수집 현황
        </h3>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {purchases.map((purchase, index) => {
          const statusInfo = getStatusInfo(purchase.status);
          const collected = payoutCounts?.[purchase.id] || 0;
          const target = purchase.unit_count;
          const progress = Math.min((collected / target) * 100, 100);

          return (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{purchase.product_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(purchase.created_at), 'M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
                <Badge 
                  className={`${statusInfo.color} text-white text-xs flex items-center gap-1`}
                >
                  <statusInfo.icon className={`h-3 w-3 ${purchase.status === 'collecting' ? 'animate-spin' : ''}`} />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    응답자 수집
                  </span>
                  <span className="font-medium">
                    {collected.toLocaleString()} / {target.toLocaleString()}명
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>총 비용: {purchase.total_price.toLocaleString()} VN</span>
                {purchase.completed_at && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {format(new Date(purchase.completed_at), 'M/d 완료', { locale: ko })}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
