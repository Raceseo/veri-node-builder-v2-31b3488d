import { useEffect, useState } from "react";
import { 
  Clock, CheckCircle2, Users, XCircle, ArrowRight, 
  RefreshCw, FileCheck, ShieldCheck, Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { valuationService } from "@/services/valuationService";

interface Withdrawal {
  id: string;
  amount: number;
  net_amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  requested_at: string;
  completed_at: string | null;
  metadata?: {
    synergy_bonus_vn?: number;
    valuation_krw?: number;
  };
}

const WithdrawalStatusList = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [user?.id]);

  const handleApproval = async (withdrawalId: string, approvalType: 'first' | 'second') => {
    if (processingId) return;
    setProcessingId(withdrawalId);
    try {
      const response = await supabase.functions.invoke('approve-withdrawal', {
        body: { withdrawalId, approvalType }
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchWithdrawals();
      }
    } catch (error: any) {
      toast.error(error.message || '승인 실패');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value);
  const formatDate = (str: string) => new Date(str).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });

  if (isLoading) return <Card className="p-4"><Skeleton className="h-20 w-full" /></Card>;

  return (
    <Card className="p-4 bg-gradient-to-br from-[#1e3a5f]/10 to-background border-[#1e3a5f]/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#c9a227]" />
          <h3 className="font-semibold text-foreground text-sm">정산 현황 (가치 기반)</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchWithdrawals}><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="space-y-3">
        {withdrawals.map((wd) => {
          // Mission 4: 2차 승인 시 가중치 반영된 금액 표시
          const bonus = wd.metadata?.synergy_bonus_vn || 0;
          const totalVN = wd.net_amount + bonus;
          const totalKRW = wd.metadata?.valuation_krw || (totalVN * valuationService.BASE_EXCHANGE_RATE);
          
          const isPending = wd.status === 'pending_approval';
          const isFirstApproved = wd.status === 'first_approved';
          const isCompleted = wd.status === 'completed';

          return (
            <motion.div key={wd.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="flex justify-between mb-2">
                <Badge variant={isCompleted ? "default" : "outline"}>{wd.status}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(wd.requested_at)}</span>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">{formatCurrency(totalVN)} VN</span>
                    {bonus > 0 && (
                      <span className="text-[10px] text-indigo-400 flex items-center bg-indigo-500/10 px-1 rounded">
                        <Sparkles className="w-2 h-2 mr-0.5" /> +{formatCurrency(bonus)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#c9a227] font-medium">≈ ₩{formatCurrency(totalKRW)}</p>
                </div>
              </div>

              {/* 승인 프로세스 버튼 */}
              {(isPending || isFirstApproved) && (
                <div className="mt-3 flex gap-2">
                  {isPending && (
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleApproval(wd.id, 'first')} disabled={!!processingId}>
                      1차 승인
                    </Button>
                  )}
                  {isFirstApproved && (
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-blue-600" onClick={() => handleApproval(wd.id, 'second')} disabled={!!processingId}>
                      2차 승인 (최종)
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

export default WithdrawalStatusList;