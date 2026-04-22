import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Coins,
  Shield,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PlatformKPI {
  totalGmv: number;
  platformRevenue: number;
  supplierPayouts: number;
  activeSuppliers: number;
  activeCorporates: number;
  totalTransactions: number;
  avgTrustScore: number;
  avgDataPurity: number;
  takeRate: number;
}

interface OperatorDashboardViewProps {
  onBack: () => void;
  onOpenTransactionReport?: (reportId: string) => void;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];

export const OperatorDashboardView = ({ onBack, onOpenTransactionReport }: OperatorDashboardViewProps) => {
  const [kpi, setKpi] = useState<PlatformKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock GMV trend data
  const gmvTrend = [
    { month: '9월', gmv: 180000000 },
    { month: '10월', gmv: 210000000 },
    { month: '11월', gmv: 245000000 },
    { month: '12월', gmv: 268000000 },
    { month: '1월', gmv: 284000000 },
  ];

  // Grade distribution
  const gradeDistribution = [
    { name: 'S등급', value: 23, color: '#8b5cf6' },
    { name: 'A등급', value: 45, color: '#3b82f6' },
    { name: 'B등급', value: 22, color: '#22c55e' },
    { name: 'C등급', value: 10, color: '#f59e0b' },
  ];

  useEffect(() => {
    fetchKPI();
  }, []);

  const fetchKPI = async () => {
    setLoading(true);
    try {
      // Fetch real data from database
      const [purchasesResult, profilesResult, payoutsResult, corporatesResult] = await Promise.all([
        supabase.from('data_purchases').select('total_price, platform_fee, status'),
        supabase.from('profiles').select('trust_score, vn_balance, is_verified'),
        supabase.from('supplier_payouts').select('total_amount, payout_status'),
        supabase.from('corporate_accounts').select('id, is_verified')
      ]);

      const purchases = purchasesResult.data || [];
      const profiles = profilesResult.data || [];
      const payouts = payoutsResult.data || [];
      const corporates = corporatesResult.data || [];

      const totalGmv = purchases.reduce((sum, p) => sum + (p.total_price || 0), 0);
      const platformRevenue = purchases.reduce((sum, p) => sum + (p.platform_fee || 0), 0);
      const supplierPayouts = payouts.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const activeSuppliers = profiles.filter(p => (p.vn_balance || 0) > 0).length;
      const activeCorporates = corporates.filter(c => c.is_verified).length;
      const avgTrustScore = profiles.length > 0 
        ? profiles.reduce((sum, p) => sum + (p.trust_score || 0), 0) / profiles.length 
        : 0;

      // Use demo data with actual data mixed
      setKpi({
        totalGmv: totalGmv || 284000000,
        platformRevenue: platformRevenue || 42600000,
        supplierPayouts: supplierPayouts || 241400000,
        activeSuppliers: activeSuppliers || 24891,
        activeCorporates: activeCorporates || 156,
        totalTransactions: purchases.length || 1247,
        avgTrustScore: avgTrustScore || 72.3,
        avgDataPurity: 99.2,
        takeRate: totalGmv > 0 ? (platformRevenue / totalGmv) * 100 : 15.0
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch KPI:', error);
      // Fallback to demo data
      setKpi({
        totalGmv: 284000000,
        platformRevenue: 42600000,
        supplierPayouts: 241400000,
        activeSuppliers: 24891,
        activeCorporates: 156,
        totalTransactions: 1247,
        avgTrustScore: 72.3,
        avgDataPurity: 99.2,
        takeRate: 15.0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `₩${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000) {
      return `₩${(value / 10000).toFixed(0)}만`;
    }
    return `₩${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Platform KPI Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            마지막 업데이트: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchKPI}>
          <RefreshCw className="w-4 h-4 mr-1" />
          새로고침
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 text-primary" />
              <Badge variant="secondary" className="text-xs">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +23%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(kpi?.totalGmv || 0)}</p>
            <p className="text-xs text-muted-foreground">총 GMV</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Coins className="w-5 h-5 text-green-500" />
              <Badge className="text-xs bg-green-500/20 text-green-700">
                {kpi?.takeRate.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(kpi?.platformRevenue || 0)}</p>
            <p className="text-xs text-muted-foreground">플랫폼 수익</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-blue-500" />
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{(kpi?.activeSuppliers || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">활성 공급자</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Building2 className="w-5 h-5 text-purple-500" />
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{kpi?.activeCorporates}</p>
            <p className="text-xs text-muted-foreground">기업 고객</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            데이터 품질 지표
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>평균 신뢰점수</span>
              <span className="font-medium">{kpi?.avgTrustScore.toFixed(1)}점</span>
            </div>
            <Progress value={kpi?.avgTrustScore || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>데이터 순도</span>
              <span className="font-medium text-green-600">{kpi?.avgDataPurity}%</span>
            </div>
            <Progress value={kpi?.avgDataPurity || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* GMV Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            월간 GMV 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gmvTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 100000000).toFixed(1)}억`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [`${formatCurrency(value)}`, 'GMV']}
                />
                <Line 
                  type="monotone" 
                  dataKey="gmv" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">공급자 등급 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {gradeDistribution.map((grade) => (
                <div key={grade.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: grade.color }}
                    />
                    <span className="text-sm">{grade.name}</span>
                  </div>
                  <span className="font-medium">{grade.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">거래 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{kpi?.totalTransactions}</p>
              <p className="text-xs text-muted-foreground">총 거래</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">₩2.3M</p>
              <p className="text-xs text-muted-foreground">평균 거래액</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">94%</p>
              <p className="text-xs text-muted-foreground">완료율</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">수익 분배 구조</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>공급자 보상</span>
                <span>{formatCurrency(kpi?.supplierPayouts || 0)}</span>
              </div>
              <Progress value={85} className="h-2 bg-blue-100" />
            </div>
            <span className="text-sm font-medium text-blue-600">85%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>플랫폼 수수료</span>
                <span>{formatCurrency(kpi?.platformRevenue || 0)}</span>
              </div>
              <Progress value={15} className="h-2" />
            </div>
            <span className="text-sm font-medium text-primary">15%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
