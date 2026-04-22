import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, Award, Coins,
  Loader2, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface VerificationHistory {
  id: string;
  verification_type: string;
  trust_score_before: number;
  trust_score_after: number;
  score_change: number;
  vn_earned: number;
  result: Json | null;
  created_at: string | null;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  score: number;
  change: number;
  type: string;
}

const VERIFICATION_LABELS: Record<string, string> = {
  gov_tax: '세금 데이터',
  gov_health: '건강 데이터',
  gov_housing: '주거 데이터',
  gov_education: '학력 데이터',
  gov_military: '병역 데이터',
  gov_certification: '자격증 데이터',
  profile_setup: '프로필 설정',
  identity_verify: '본인 인증',
  mydata_connect: '금융 마이데이터',
  survey_complete: '설문 완료',
};

const VERIFICATION_COLORS: Record<string, string> = {
  gov_tax: '#3B82F6',
  gov_health: '#EF4444',
  gov_housing: '#22C55E',
  gov_education: '#8B5CF6',
  gov_military: '#64748B',
  gov_certification: '#F59E0B',
  profile_setup: '#06B6D4',
  identity_verify: '#EC4899',
  mydata_connect: '#14B8A6',
  survey_complete: '#6366F1',
};

export default function TrustScoreHistoryChart() {
  const { user } = useAuth();
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const [currentScore, setCurrentScore] = useState(0);
  const [totalChange, setTotalChange] = useState(0);
  const [totalVnEarned, setTotalVnEarned] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id, period]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('verification_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (period === '7d') {
        query = query.gte('created_at', subDays(new Date(), 7).toISOString());
      } else if (period === '30d') {
        query = query.gte('created_at', subDays(new Date(), 30).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setHistory(data || []);

      // 차트 데이터 변환
      const chartPoints: ChartDataPoint[] = (data || []).map((item) => ({
        date: item.created_at || '',
        displayDate: item.created_at ? format(parseISO(item.created_at), 'M/d', { locale: ko }) : '-',
        score: item.trust_score_after || 0,
        change: item.score_change || 0,
        type: item.verification_type,
      }));

      setChartData(chartPoints);

      // 통계 계산
      if (data && data.length > 0) {
        const lastItem = data[data.length - 1];
        setCurrentScore(lastItem.trust_score_after || 0);
        setTotalChange(data.reduce((sum, item) => sum + (item.score_change || 0), 0));
        setTotalVnEarned(data.reduce((sum, item) => sum + (item.vn_earned || 0), 0));
      }

      // 현재 프로필에서 최신 점수 가져오기
      const { data: profile } = await supabase
        .from('profiles')
        .select('trust_score')
        .eq('id', user?.id)
        .single();
      
      if (profile) {
        setCurrentScore(profile.trust_score || 0);
      }
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{data.displayDate}</p>
          <p className="text-lg font-bold text-primary">{data.score}점</p>
          <p className={`text-sm flex items-center gap-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {data.change >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {data.change >= 0 ? '+' : ''}{data.change}점
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {VERIFICATION_LABELS[data.type] || data.type}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="space-y-4">
      {/* 헤더 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">현재 Trust Score</p>
            <p className="text-2xl font-bold text-primary">{currentScore}</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">총 변화량</p>
            <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${totalChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {totalChange >= 0 ? '+' : ''}{totalChange}
            </p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">획득 VN</p>
            <p className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
              <Coins className="w-5 h-5" />
              {totalVnEarned.toLocaleString()}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* 메인 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Trust Score 변화
            </CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-xs px-2 h-6">7일</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2 h-6">30일</TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-2 h-6">전체</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">아직 검증 기록이 없습니다</p>
                <p className="text-xs">데이터를 연동하여 Trust Score를 높이세요</p>
              </div>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 변화량 바 차트 */}
      {hasData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">검증별 점수 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value}점`, '변화']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.change >= 0 ? '#22C55E' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 검증 기록 */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              최근 검증 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {[...history].reverse().slice(0, 10).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: VERIFICATION_COLORS[item.verification_type] || '#888' }}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {VERIFICATION_LABELS[item.verification_type] || item.verification_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(item.created_at), 'M월 d일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={item.score_change >= 0 ? 'default' : 'destructive'}
                      className={item.score_change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    >
                      {item.score_change >= 0 ? '+' : ''}{item.score_change}점
                    </Badge>
                    {item.vn_earned > 0 && (
                      <p className="text-xs text-amber-600 mt-1">+{item.vn_earned} VN</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}