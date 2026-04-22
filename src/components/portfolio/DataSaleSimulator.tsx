import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Coins, Users, Calendar, Calculator, DollarSign,
  ChevronRight, Building2, AlertCircle, CheckCircle2, Sparkles,
  BarChart3, PieChart as PieChartIcon, Target, Clock, Loader2, Store
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CategoryData {
  id: string;
  name: string;
  icon: React.ElementType;
  source: 'financial' | 'government';
  isConnected: boolean;
  vnValue: number;
}

interface DataSaleSimulatorProps {
  categories: CategoryData[];
  totalValue: number;
  onListingCreated?: () => void;
}

const MARKET_DEMAND = {
  consumption: { demand: 95, buyers: 42, avgPrice: 1.8 },
  asset: { demand: 88, buyers: 35, avgPrice: 2.2 },
  mobility: { demand: 72, buyers: 28, avgPrice: 1.4 },
  income_stability: { demand: 92, buyers: 38, avgPrice: 2.5 },
  health_index: { demand: 85, buyers: 31, avgPrice: 3.2 },
  residence_stability: { demand: 68, buyers: 22, avgPrice: 1.6 },
  education_level: { demand: 75, buyers: 25, avgPrice: 1.3 },
  military_service: { demand: 45, buyers: 12, avgPrice: 0.8 },
  professional_qualification: { demand: 82, buyers: 29, avgPrice: 2.0 },
};

const BUYER_INDUSTRIES = [
  { name: '핀테크/금융', share: 35, color: 'hsl(var(--primary))' },
  { name: '리서치 기관', share: 25, color: '#10B981' },
  { name: '마케팅/광고', share: 20, color: '#F59E0B' },
  { name: '정부/공공기관', share: 15, color: '#8B5CF6' },
  { name: '기타', share: 5, color: '#6B7280' },
];

const CATEGORY_LABELS: Record<string, string> = {
  consumption: '소비 패턴',
  asset: '금융 자산',
  mobility: '이동 동선',
  income_stability: '소득/세금',
  health_index: '건강/의료',
  residence_stability: '주거 정보',
  education_level: '학력/자격',
  military_service: '병역 정보',
  professional_qualification: '전문 자격증',
};

export default function DataSaleSimulator({ categories, totalValue, onListingCreated }: DataSaleSimulatorProps) {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(categories.filter(c => c.isConnected).map(c => c.id))
  );
  const [saleMonths, setSaleMonths] = useState(6);
  const [anonymizationLevel, setAnonymizationLevel] = useState<'none' | 'partial' | 'full'>('partial');
  const [includePremiumBuyers, setIncludePremiumBuyers] = useState(true);
  
  // Registration dialog state
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const connectedCategories = categories.filter(c => c.isConnected);

  const toggleCategory = (id: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCategories(newSelected);
  };

  // Calculate simulation results
  const simulationResult = useMemo(() => {
    const selectedCats = connectedCategories.filter(c => selectedCategories.has(c.id));
    
    // Base value calculation
    let baseValue = selectedCats.reduce((sum, cat) => sum + cat.vnValue, 0);
    
    // Anonymization multiplier
    const anonMultiplier = 
      anonymizationLevel === 'none' ? 1.5 :
      anonymizationLevel === 'partial' ? 1.0 : 0.7;
    
    // Premium buyer bonus
    const premiumBonus = includePremiumBuyers ? 1.2 : 1.0;
    
    // Monthly value
    const monthlyValue = Math.floor(baseValue * anonMultiplier * premiumBonus * 0.15);
    
    // Total projected earnings
    const totalEarnings = monthlyValue * saleMonths;
    
    // Estimated buyers
    let totalBuyers = 0;
    selectedCats.forEach(cat => {
      const demand = MARKET_DEMAND[cat.id as keyof typeof MARKET_DEMAND];
      if (demand) {
        totalBuyers += Math.floor(demand.buyers * (includePremiumBuyers ? 1.3 : 1.0));
      }
    });
    
    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: saleMonths }, (_, i) => {
      const month = i + 1;
      // Growth factor (early months have higher activity)
      const growthFactor = 1 + (0.1 * Math.sin(month / 2));
      return {
        month: `${month}개월`,
        earnings: Math.floor(monthlyValue * growthFactor),
        buyers: Math.floor(totalBuyers / saleMonths * growthFactor),
        cumulative: 0,
      };
    });
    
    // Calculate cumulative
    let cumulative = 0;
    monthlyBreakdown.forEach(item => {
      cumulative += item.earnings;
      item.cumulative = cumulative;
    });
    
    return {
      monthlyValue,
      totalEarnings,
      totalBuyers,
      selectedCount: selectedCats.length,
      monthlyBreakdown,
      riskLevel: anonymizationLevel === 'none' ? 'high' : anonymizationLevel === 'partial' ? 'medium' : 'low',
    };
  }, [selectedCategories, saleMonths, anonymizationLevel, includePremiumBuyers, connectedCategories]);

  return (
    <div className="space-y-4">
      {/* 시뮬레이터 헤더 */}
      <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold">데이터 판매 시뮬레이터</h3>
              <p className="text-xs text-muted-foreground">예상 수익을 미리 계산해보세요</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background/80 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-primary">
                {simulationResult.monthlyValue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">월 예상 수익 (VN)</p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-lg font-bold text-green-600">
                {simulationResult.totalEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{saleMonths}개월 총 수익</p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-lg font-bold">
                {simulationResult.totalBuyers}
              </p>
              <p className="text-xs text-muted-foreground">예상 구매자</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 판매 설정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            판매 조건 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">판매할 데이터 카테고리</span>
              <Badge variant="outline">
                {simulationResult.selectedCount}개 선택
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {connectedCategories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.has(cat.id);
                const demand = MARKET_DEMAND[cat.id as keyof typeof MARKET_DEMAND];
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${
                        cat.source === 'financial' ? 'text-blue-500' : 'text-green-500'
                      }`} />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {cat.vnValue.toLocaleString()} VN
                      </span>
                      {demand && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            demand.demand >= 80 ? 'bg-green-100 text-green-700' :
                            demand.demand >= 60 ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          수요 {demand.demand}%
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 판매 기간 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">판매 기간</span>
              <span className="text-sm text-primary font-medium">{saleMonths}개월</span>
            </div>
            <Slider
              value={[saleMonths]}
              onValueChange={([v]) => setSaleMonths(v)}
              min={1}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>1개월</span>
              <span>12개월</span>
            </div>
          </div>

          {/* 익명화 수준 */}
          <div>
            <span className="text-sm font-medium mb-3 block">익명화 수준</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: '원본', multiplier: '×1.5', risk: 'high' },
                { id: 'partial', label: '부분 익명화', multiplier: '×1.0', risk: 'medium' },
                { id: 'full', label: '완전 익명화', multiplier: '×0.7', risk: 'low' },
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => setAnonymizationLevel(level.id as any)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    anonymizationLevel === level.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="text-xs font-medium">{level.label}</p>
                  <p className={`text-xs ${
                    level.risk === 'low' ? 'text-green-600' :
                    level.risk === 'medium' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {level.multiplier}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 프리미엄 구매자 */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium">프리미엄 구매자 포함</p>
                <p className="text-xs text-muted-foreground">
                  대기업, 금융기관 등 고가 구매자 포함
                </p>
              </div>
            </div>
            <Switch
              checked={includePremiumBuyers}
              onCheckedChange={setIncludePremiumBuyers}
            />
          </div>
        </CardContent>
      </Card>

      {/* 수익 예측 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            월별 수익 예측
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulationResult.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} VN`,
                    name === 'earnings' ? '월 수익' : '누적 수익'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="누적 수익"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  name="월 수익"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 구매자 산업군 분포 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            예상 구매자 산업군
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {BUYER_INDUSTRIES.map((industry, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{industry.name}</span>
                  <span className="text-sm font-medium">{industry.share}%</span>
                </div>
                <Progress 
                  value={industry.share} 
                  className="h-2"
                  style={{ 
                    '--progress-color': industry.color 
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 리스크 안내 */}
      <Card className={`border ${
        simulationResult.riskLevel === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/30' :
        simulationResult.riskLevel === 'medium' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30' :
        'border-green-200 bg-green-50 dark:bg-green-950/30'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {simulationResult.riskLevel === 'high' ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
                simulationResult.riskLevel === 'medium' ? 'text-amber-500' : 'text-green-500'
              }`} />
            )}
            <div>
              <p className={`text-sm font-medium ${
                simulationResult.riskLevel === 'high' ? 'text-red-700 dark:text-red-300' :
                simulationResult.riskLevel === 'medium' ? 'text-amber-700 dark:text-amber-300' :
                'text-green-700 dark:text-green-300'
              }`}>
                {simulationResult.riskLevel === 'high' ? '높은 프라이버시 위험' :
                 simulationResult.riskLevel === 'medium' ? '적정 수준의 프라이버시 보호' :
                 '높은 수준의 프라이버시 보호'}
              </p>
              <p className={`text-xs mt-1 ${
                simulationResult.riskLevel === 'high' ? 'text-red-600 dark:text-red-400' :
                simulationResult.riskLevel === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                {simulationResult.riskLevel === 'high' 
                  ? '원본 데이터 판매는 높은 수익을 제공하지만, 개인정보 노출 위험이 있습니다.'
                  : simulationResult.riskLevel === 'medium'
                  ? '부분 익명화로 적절한 수익과 프라이버시 보호를 유지합니다.'
                  : '완전 익명화로 개인정보가 보호되며, 안전한 데이터 거래가 가능합니다.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 판매 시작 버튼 */}
      <Button 
        className="w-full" 
        size="lg"
        onClick={() => {
          if (simulationResult.selectedCount === 0) {
            toast.error('판매할 데이터 카테고리를 선택해주세요');
            return;
          }
          setListingTitle(`데이터 판매 - ${new Date().toLocaleDateString('ko-KR')}`);
          setShowRegisterDialog(true);
        }}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        시뮬레이션 기준으로 판매 시작하기
      </Button>

      {/* 판매 등록 확인 다이얼로그 */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              데이터 판매 등록
            </DialogTitle>
            <DialogDescription>
              설정한 조건으로 데이터 판매를 시작합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 제목 입력 */}
            <div>
              <label className="text-sm font-medium mb-2 block">판매 제목</label>
              <Input
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
                placeholder="예: 30대 직장인 소비 데이터"
              />
            </div>

            {/* 설명 입력 */}
            <div>
              <label className="text-sm font-medium mb-2 block">설명 (선택)</label>
              <Textarea
                value={listingDescription}
                onChange={(e) => setListingDescription(e.target.value)}
                placeholder="판매할 데이터에 대한 추가 설명..."
                rows={2}
              />
            </div>

            {/* 요약 정보 */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">선택된 카테고리</span>
                  <span className="font-medium">{simulationResult.selectedCount}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">판매 기간</span>
                  <span className="font-medium">{saleMonths}개월</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">익명화 수준</span>
                  <span className="font-medium">
                    {anonymizationLevel === 'full' ? '완전 익명화' :
                     anonymizationLevel === 'partial' ? '부분 익명화' : '원본'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">예상 총 수익</span>
                  <span className="font-bold text-primary">
                    {simulationResult.totalEarnings.toLocaleString()} VN
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 동의 안내 */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  판매 등록 시 선택한 데이터가 기업에게 제공될 수 있습니다. 
                  설정한 익명화 수준과 허용 용도에 따라 데이터가 처리됩니다.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRegisterDialog(false)}
              disabled={isRegistering}
            >
              취소
            </Button>
            <Button 
              onClick={async () => {
                if (!user?.id) {
                  toast.error('로그인이 필요합니다');
                  return;
                }
                if (!listingTitle.trim()) {
                  toast.error('판매 제목을 입력해주세요');
                  return;
                }

                setIsRegistering(true);
                try {
                  const { error } = await supabase
                    .from('data_listings')
                    .insert({
                      user_id: user.id,
                      title: listingTitle.trim(),
                      description: listingDescription.trim() || null,
                      categories: Array.from(selectedCategories),
                      anonymization_level: anonymizationLevel,
                      allowed_uses: ['survey', 'research'],
                      include_premium_buyers: includePremiumBuyers,
                      sale_duration_months: saleMonths,
                      expected_monthly_value: simulationResult.monthlyValue,
                      expected_total_value: simulationResult.totalEarnings,
                      status: 'pending',
                    });

                  if (error) throw error;

                  toast.success('판매가 등록되었습니다');
                  setShowRegisterDialog(false);
                  setListingTitle('');
                  setListingDescription('');
                  onListingCreated?.();
                } catch (error) {
                  console.error('Failed to create listing:', error);
                  toast.error('판매 등록에 실패했습니다');
                } finally {
                  setIsRegistering(false);
                }
              }}
              disabled={isRegistering || !listingTitle.trim()}
            >
              {isRegistering ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
