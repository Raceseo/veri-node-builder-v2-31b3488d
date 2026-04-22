import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle2, Clock, TrendingUp, 
  BarChart3, RefreshCw, AlertCircle, Zap,
  Activity, Target, Award, ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface Purchase {
  id: string;
  product_title: string;
  unit_count: number;
  total_price: number;
  status: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  target_grade: string | null;
  buyer_id: string;
}

interface PayoutInfo {
  count: number;
  totalAmount: number;
  avgTrustScore: number;
  grades: Record<string, number>;
}

export const RealtimeCollectionDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([]);

  // 활성 구매 목록 조회
  const { data: activePurchases, isLoading } = useQuery({
    queryKey: ['active-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('data_purchases')
        .select('*')
        .eq('buyer_id', user.id)
        .in('status', ['paid', 'collecting', 'partial'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!user?.id,
  });

  // 각 구매별 상세 payout 정보 조회
  const { data: payoutDetails } = useQuery({
    queryKey: ['payout-details', activePurchases?.map(p => p.id)],
    queryFn: async () => {
      if (!activePurchases || activePurchases.length === 0) return {};

      const purchaseIds = activePurchases.map(p => p.id);
      const { data, error } = await supabase
        .from('supplier_payouts')
        .select('purchase_id, total_amount, trust_score_at_time, verification_grade')
        .in('purchase_id', purchaseIds);

      if (error) throw error;

      // 구매별 상세 정보 집계
      const details: Record<string, PayoutInfo> = {};
      purchaseIds.forEach(id => {
        details[id] = { count: 0, totalAmount: 0, avgTrustScore: 0, grades: {} };
      });

      data?.forEach(payout => {
        const info = details[payout.purchase_id];
        info.count += 1;
        info.totalAmount += payout.total_amount || 0;
        info.avgTrustScore += payout.trust_score_at_time || 0;
        const grade = payout.verification_grade || 'unknown';
        info.grades[grade] = (info.grades[grade] || 0) + 1;
      });

      // 평균 계산
      Object.keys(details).forEach(id => {
        if (details[id].count > 0) {
          details[id].avgTrustScore = Math.round(details[id].avgTrustScore / details[id].count);
        }
      });

      return details;
    },
    enabled: !!activePurchases && activePurchases.length > 0,
  });

  // 전체 통계
  const stats = React.useMemo(() => {
    if (!activePurchases || !payoutDetails) return null;

    let totalTarget = 0;
    let totalCollected = 0;
    let totalSpent = 0;

    activePurchases.forEach(purchase => {
      totalTarget += purchase.unit_count;
      totalCollected += payoutDetails[purchase.id]?.count || 0;
      totalSpent += payoutDetails[purchase.id]?.totalAmount || 0;
    });

    return {
      activePurchases: activePurchases.length,
      totalTarget,
      totalCollected,
      completionRate: totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0,
      totalSpent,
    };
  }, [activePurchases, payoutDetails]);

  // Realtime 구독
  useEffect(() => {
    if (!user?.id || !activePurchases) return;

    const purchaseIds = activePurchases.map(p => p.id);
    if (purchaseIds.length === 0) return;

    const channel = supabase
      .channel('collection-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supplier_payouts',
        },
        (payload) => {
          const newPayout = payload.new as { purchase_id: string; total_amount: number; verification_grade: string };
          
          if (purchaseIds.includes(newPayout.purchase_id)) {
            // 업데이트 알림 추가
            const updateMsg = `새 응답 수집: ${newPayout.verification_grade} 등급 (+${newPayout.total_amount} VN)`;
            setRealtimeUpdates(prev => [updateMsg, ...prev].slice(0, 5));
            
            toast.success('새로운 데이터가 수집되었습니다!', {
              description: updateMsg,
            });

            // 쿼리 무효화로 데이터 갱신
            queryClient.invalidateQueries({ queryKey: ['payout-details'] });
            queryClient.invalidateQueries({ queryKey: ['active-purchases'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'data_purchases',
        },
        (payload) => {
          const updated = payload.new as Purchase;
          
          if (updated.buyer_id === user.id) {
            if (updated.status === 'completed') {
              toast.success('데이터 수집이 완료되었습니다!', {
                description: updated.product_title,
              });
            }
            
            queryClient.invalidateQueries({ queryKey: ['active-purchases'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activePurchases, queryClient]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '완료', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
      case 'paid':
      case 'collecting':
        return { label: '수집중', color: 'bg-blue-500', textColor: 'text-blue-600' };
      case 'partial':
        return { label: '부분완료', color: 'bg-amber-500', textColor: 'text-amber-600' };
      default:
        return { label: status, color: 'bg-muted', textColor: 'text-muted-foreground' };
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-violet-500';
      case 'A': return 'bg-blue-500';
      case 'B': return 'bg-emerald-500';
      case 'C': return 'bg-amber-500';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!activePurchases || activePurchases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">진행 중인 데이터 수집이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            데이터 구매를 시작하면 실시간으로 수집 현황을 확인할 수 있습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 실시간 배지 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold">실시간 수집 현황</span>
        </div>
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3 text-amber-500" />
          Live
        </Badge>
      </div>

      {/* 전체 통계 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">진행중</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.activePurchases}</p>
              <p className="text-xs text-muted-foreground">건</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">수집</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {stats.totalCollected.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/{stats.totalTarget.toLocaleString()}</span>
              </p>
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">완료율</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.completionRate}%</p>
              <Progress value={stats.completionRate} className="h-1 mt-1" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="text-xs text-muted-foreground">분배</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">VN</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 실시간 업데이트 피드 */}
      <AnimatePresence>
        {realtimeUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3"
          >
            <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              최근 업데이트
            </p>
            <div className="space-y-1">
              {realtimeUpdates.map((update, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1 - idx * 0.15, x: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  {update}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 개별 구매 현황 */}
      <div className="space-y-3">
        {activePurchases.map((purchase, index) => {
          const statusInfo = getStatusInfo(purchase.status);
          const payout = payoutDetails?.[purchase.id];
          const collected = payout?.count || 0;
          const target = purchase.unit_count;
          const progress = Math.min((collected / target) * 100, 100);

          return (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{purchase.product_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(purchase.created_at), { 
                          addSuffix: true, 
                          locale: ko 
                        })}
                      </p>
                    </div>
                    <Badge className={`${statusInfo.color} text-white text-xs flex items-center gap-1`}>
                      {purchase.status === 'collecting' && (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      )}
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* 진행률 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        응답자 수집
                      </span>
                      <span className="font-medium">
                        <span className={statusInfo.textColor}>{collected.toLocaleString()}</span>
                        <span className="text-muted-foreground"> / {target.toLocaleString()}명</span>
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={progress} className="h-3" />
                      {progress > 0 && progress < 100 && (
                        <motion.div
                          className="absolute top-0 right-0 h-3 w-1 bg-primary/50 rounded-full"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* 등급 분포 & 상세 */}
                  {payout && payout.count > 0 && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">등급 분포:</span>
                        <div className="flex gap-1">
                          {Object.entries(payout.grades).map(([grade, count]) => (
                            <span 
                              key={grade}
                              className={`${getGradeColor(grade)} text-white px-1.5 py-0.5 rounded text-[10px] font-medium`}
                            >
                              {grade}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>평균 신뢰도:</span>
                        <span className="font-medium text-foreground">{payout.avgTrustScore}점</span>
                      </div>
                    </div>
                  )}

                  {/* 비용 정보 */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>지출: {(payout?.totalAmount || 0).toLocaleString()} / {purchase.total_price.toLocaleString()} VN</span>
                    {purchase.target_grade && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        목표 등급: {purchase.target_grade}+
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
