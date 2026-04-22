import { useState } from "react";
import { Shield, AlertTriangle, TrendingUp, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WithdrawalLimitsCardProps {
  className?: string;
}

const WithdrawalLimitsCard = ({ className = "" }: WithdrawalLimitsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const yearMonth = today.substring(0, 7);

  // 출금 한도 설정 조회
  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ['withdrawal-limits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('withdrawal_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // 기본값 반환
      return data || {
        daily_limit: 100000,
        monthly_limit: 1000000,
        single_transaction_limit: 50000,
        high_value_threshold: 30000
      };
    }
  });

  // 일일 출금 통계 조회
  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['withdrawal-daily-stats', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('withdrawal_daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data || { total_withdrawn: 0, withdrawal_count: 0 };
    }
  });

  // 월간 출금 통계 조회
  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery({
    queryKey: ['withdrawal-monthly-stats', yearMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { data, error } = await supabase
        .from('withdrawal_monthly_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .maybeSingle();

      if (error) throw error;
      return data || { total_withdrawn: 0, withdrawal_count: 0 };
    }
  });

  const isLoading = limitsLoading || dailyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className={`bg-card rounded-xl p-4 shadow-card ${className}`}>
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const dailyLimit = limits?.daily_limit || 100000;
  const monthlyLimit = limits?.monthly_limit || 1000000;
  const singleLimit = limits?.single_transaction_limit || 50000;
  
  const dailyUsed = dailyStats?.total_withdrawn || 0;
  const monthlyUsed = monthlyStats?.total_withdrawn || 0;
  
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  
  const dailyPercent = Math.min(100, (dailyUsed / dailyLimit) * 100);
  const monthlyPercent = Math.min(100, (monthlyUsed / monthlyLimit) * 100);

  const isDailyWarning = dailyPercent >= 80;
  const isMonthlyWarning = monthlyPercent >= 80;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`bg-card rounded-xl p-4 shadow-card ${className}`}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">출금 한도</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                오늘 {dailyUsed.toLocaleString()} / {dailyLimit.toLocaleString()} VN
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            {/* 일일 한도 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground flex items-center gap-1">
                  일일 한도
                  {isDailyWarning && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                </span>
                <span className={`text-xs font-semibold ${isDailyWarning ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {dailyRemaining.toLocaleString()} VN 남음
                </span>
              </div>
              <Progress 
                value={dailyPercent} 
                className={`h-2 ${isDailyWarning ? '[&>div]:bg-amber-500' : ''}`}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {dailyUsed.toLocaleString()} VN 사용
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {dailyLimit.toLocaleString()} VN
                </span>
              </div>
            </div>

            {/* 월간 한도 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground flex items-center gap-1">
                  월간 한도
                  {isMonthlyWarning && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                </span>
                <span className={`text-xs font-semibold ${isMonthlyWarning ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {monthlyRemaining.toLocaleString()} VN 남음
                </span>
              </div>
              <Progress 
                value={monthlyPercent} 
                className={`h-2 ${isMonthlyWarning ? '[&>div]:bg-amber-500' : ''}`}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {monthlyUsed.toLocaleString()} VN 사용
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {monthlyLimit.toLocaleString()} VN
                </span>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">1회 최대 출금</span>
                <span className="font-medium text-foreground">{singleLimit.toLocaleString()} VN</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">이번 달 출금 횟수</span>
                <span className="font-medium text-foreground">{monthlyStats?.withdrawal_count || 0}회</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default WithdrawalLimitsCard;
