import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  Repeat,
  Clock,
  ArrowUpRight,
  Coins,
  PieChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface UnitEconomicsViewProps {
  onBack: () => void;
}

export const UnitEconomicsView = ({ onBack }: UnitEconomicsViewProps) => {
  // Unit Economics Metrics
  const metrics = {
    takeRate: 15.0,
    cac: 45000,
    ltv: 680000,
    ltvCacRatio: 15.1,
    paybackPeriod: 2.3,
    avgTransactionValue: 2340000,
    avgPlatformRevenue: 351000,
    avgSupplierReward: 45600,
    monthlyRepeatRate: 68,
    supplierRetention: 89,
    buyerRetention: 94,
    momGrowth: 23
  };

  // Revenue structure visualization
  const revenueStructure = [
    { name: '공급자 보상', value: 85, color: '#3b82f6' },
    { name: '플랫폼 수수료', value: 15, color: '#8b5cf6' }
  ];

  // Monthly metrics trend
  const monthlyTrend = [
    { month: '9월', gmv: 1.8, transactions: 89 },
    { month: '10월', gmv: 2.1, transactions: 102 },
    { month: '11월', gmv: 2.45, transactions: 118 },
    { month: '12월', gmv: 2.68, transactions: 127 },
    { month: '1월', gmv: 2.84, transactions: 141 }
  ];

  // Target vs Actual
  const targets = [
    { name: '시장 점유율', current: 2.1, target: 5, unit: '%' },
    { name: 'MAU', current: 24891, target: 100000, unit: '명' },
    { name: '월간 GMV', current: 2.84, target: 10, unit: '억' }
  ];

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `₩${(value / 10000).toFixed(1)}만`;
    }
    return `₩${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Unit Economics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          VeriNode 비즈니스 모델 핵심 지표
        </p>
      </div>

      {/* Revenue Structure */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            거래당 수익 구조 (Take Rate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm">총 거래액</div>
              <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-medium">
                  ₩100
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm">공급자 보상</div>
              <div className="flex-1 h-6 relative">
                <div 
                  className="bg-blue-500 rounded-full h-full"
                  style={{ width: '85%' }}
                />
                <span className="absolute right-[15%] pr-2 top-1/2 -translate-y-1/2 text-white text-xs font-medium">
                  ₩85 (85%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm">플랫폼 수수료</div>
              <div className="flex-1 h-6 relative">
                <div 
                  className="bg-purple-500 rounded-full h-full"
                  style={{ width: '15%' }}
                />
                <span className="absolute left-[16%] top-1/2 -translate-y-1/2 text-xs font-medium">
                  ₩15 (15%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-orange-500" />
              <Badge variant="outline" className="text-xs">고객획득비용</Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.cac)}</p>
            <p className="text-xs text-muted-foreground">CAC</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <Badge variant="outline" className="text-xs">생애가치</Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</p>
            <p className="text-xs text-muted-foreground">LTV</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-500 text-white text-xs">목표 &gt;3x</Badge>
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.ltvCacRatio}x</p>
            <p className="text-xs text-muted-foreground">LTV/CAC</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <Badge variant="outline" className="text-xs">회수기간</Badge>
            </div>
            <p className="text-2xl font-bold">{metrics.paybackPeriod}개월</p>
            <p className="text-xs text-muted-foreground">Payback</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Economics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            거래 경제성
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">평균 거래 규모</p>
              <p className="text-lg font-bold">₩{(metrics.avgTransactionValue / 10000).toFixed(0)}만</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">거래당 플랫폼 수익</p>
              <p className="text-lg font-bold text-primary">₩{(metrics.avgPlatformRevenue / 10000).toFixed(1)}만</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">공급자 평균 수익</p>
              <p className="text-lg font-bold text-blue-600">₩{(metrics.avgSupplierReward / 10000).toFixed(1)}만</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">월간 반복 거래율</p>
              <p className="text-lg font-bold">{metrics.monthlyRepeatRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            성장 지표
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              <span className="text-sm">월간 GMV 성장률</span>
            </div>
            <span className="text-lg font-bold text-green-600">+{metrics.momGrowth}% MoM</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Repeat className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{metrics.supplierRetention}%</p>
                <p className="text-xs text-muted-foreground">공급자 리텐션</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Repeat className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">{metrics.buyerRetention}%</p>
                <p className="text-xs text-muted-foreground">수요자 리텐션</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">월간 GMV 추이 (억원)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`₩${value}억`, 'GMV']}
                />
                <Bar dataKey="gmv" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {monthlyTrend.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === monthlyTrend.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Target vs Actual */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            목표 vs 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {targets.map((target) => {
            const progress = (target.current / target.target) * 100;
            return (
              <div key={target.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{target.name}</span>
                  <span className="text-muted-foreground">
                    {typeof target.current === 'number' && target.current >= 1000 
                      ? target.current.toLocaleString() 
                      : target.current}{target.unit} → {target.target.toLocaleString()}{target.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                  <span className="text-xs font-medium w-12 text-right">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">VC Highlight</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">15%</p>
                <p className="text-xs text-muted-foreground">Take Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">15.1x</p>
                <p className="text-xs text-muted-foreground">LTV/CAC</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">2.3M</p>
                <p className="text-xs text-muted-foreground">Payback</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
