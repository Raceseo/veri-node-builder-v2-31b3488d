import { TrendingUp, Trophy, Target, Clock, FileText, Share2, Shield } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO, startOfDay } from "date-fns";

const getIconByType = (type: string) => {
  switch (type) {
    case 'document': return FileText;
    case 'sns': return Share2;
    case 'profile': return Shield;
    default: return Target;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'document': return '문서 인증';
    case 'sns': return 'SNS 연동';
    case 'profile': return '프로필 인증';
    default: return '인증';
  }
};

const ActivityTab = () => {
  // Fetch verification stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: history, error } = await supabase
        .from('verification_history')
        .select('trust_score_after, score_change, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalVerifications = history?.length ?? 0;
      const avgTrustScore = history && history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.trust_score_after ?? 0), 0) / history.length)
        : 0;
      const highTrustCount = history?.filter(h => (h.score_change ?? 0) > 0).length ?? 0;

      return {
        totalVerifications,
        avgTrustScore,
        highTrustCount,
        avgResponse: '4.2m' // This would need actual calculation based on survey_responses
      };
    }
  });

  // Fetch weekly chart data
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['weekly-chart'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data: history, error } = await supabase
        .from('verification_history')
        .select('trust_score_after, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate last 7 days with scores
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'EEE');
        const dayStart = startOfDay(date);
        
        // Find the latest score for this day
        const dayHistory = history?.filter(h => {
          const hDate = startOfDay(parseISO(h.created_at!));
          return hDate.getTime() === dayStart.getTime();
        });

        const score = dayHistory && dayHistory.length > 0
          ? dayHistory[dayHistory.length - 1].trust_score_after ?? 65
          : (days.length > 0 ? days[days.length - 1].score : 65);

        days.push({ date: dateStr, score });
      }

      return days;
    }
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: history, error } = await supabase
        .from('verification_history')
        .select('verification_type, vn_earned, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return history?.map(h => ({
        date: format(parseISO(h.created_at!), 'MMM d, h:mm a'),
        action: getTypeLabel(h.verification_type),
        points: `+${h.vn_earned ?? 0} pts`,
        type: h.verification_type
      })) ?? [];
    }
  });

  const statItems = [
    { label: "Total Verifications", value: String(stats?.totalVerifications ?? 0), icon: Target, color: "text-primary" },
    { label: "Avg. Trust Score", value: String(stats?.avgTrustScore ?? 0), icon: TrendingUp, color: "text-success" },
    { label: "High Trust Count", value: String(stats?.highTrustCount ?? 0), icon: Trophy, color: "text-warning" },
    { label: "Avg. Response", value: stats?.avgResponse ?? '0m', icon: Clock, color: "text-primary" },
  ];

  if (isStatsLoading || isChartLoading || isActivityLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-4 shadow-card animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Score Chart */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="text-base font-bold text-foreground mb-4">Weekly Trust Score</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 55%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(217 91% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="date" stroke="hsl(215 16% 47%)" fontSize={11} />
              <YAxis stroke="hsl(215 16% 47%)" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid hsl(220 13% 91%)",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(217 91% 55%)"
                strokeWidth={2}
                fill="url(#activityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="text-base font-bold text-foreground mb-4">Recent Activity</h3>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const Icon = getIconByType(activity.type);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">{activity.points}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">아직 활동 기록이 없습니다</p>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;
