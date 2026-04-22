import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, CreditCard, Shield, TrendingUp, TrendingDown,
  Database, Coins, Award, Sparkles, RefreshCw, Loader2,
  Heart, Home, GraduationCap, Briefcase, ShoppingCart, MapPin,
  ChevronRight, CheckCircle2, AlertCircle, Lock, Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import GovDataConnectionSheet from "@/components/govdata/GovDataConnectionSheet";
import { MydataConnectionSheet } from "@/components/mydata/MydataConnectionSheet";
import PrivacyControlPanel from "@/components/portfolio/PrivacyControlPanel";
import DataSaleSimulator from "@/components/portfolio/DataSaleSimulator";
import DataListingManager from "@/components/portfolio/DataListingManager";
import { SaleHistoryDetail } from "@/components/portfolio/SaleHistoryDetail";

interface UnifiedPortfolioViewProps {
  onBack: () => void;
}

interface FinancialAnalysis {
  persona_type: string;
  category_breakdown: Record<string, number>;
  monthly_average: number;
  data_value_raw: number;
  data_value_refined: number;
}

interface GovAnalysis {
  analysis_type: string;
  score: number;
  grade: string;
  data_value_raw: number;
  data_value_refined: number;
  details_json: Record<string, any>;
}

interface GovConnection {
  agency_type: string;
  agency_name: string;
  is_connected: boolean;
}

interface FinConnection {
  institution_type: string;
  institution_name: string;
}

interface CategoryData {
  id: string;
  name: string;
  icon: React.ElementType;
  source: 'financial' | 'government';
  isConnected: boolean;
  value: number;
  vnValue: number;
  grade?: string;
}

const SOURCE_COLORS = {
  financial: '#3B82F6',
  government: '#10B981',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  // Financial
  consumption: ShoppingCart,
  asset: Briefcase,
  mobility: MapPin,
  // Government
  income_stability: Building2,
  health_index: Heart,
  residence_stability: Home,
  education_level: GraduationCap,
  military_service: Shield,
  professional_qualification: Award,
};

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

export default function UnifiedPortfolioView({ onBack }: UnifiedPortfolioViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'government' | 'privacy' | 'simulation' | 'listings' | 'history'>('overview');
  const [showFinSheet, setShowFinSheet] = useState(false);
  const [showGovSheet, setShowGovSheet] = useState(false);
  const [listingsKey, setListingsKey] = useState(0);

  // Data states
  const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysis | null>(null);
  const [financialConnections, setFinancialConnections] = useState<FinConnection[]>([]);
  const [govAnalyses, setGovAnalyses] = useState<GovAnalysis[]>([]);
  const [govConnections, setGovConnections] = useState<GovConnection[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // Calculated values
  const [totalValue, setTotalValue] = useState(0);
  const [financialValue, setFinancialValue] = useState(0);
  const [governmentValue, setGovernmentValue] = useState(0);
  const [overallGrade, setOverallGrade] = useState('D');
  const [portfolioScore, setPortfolioScore] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load financial data
      const [finAnalysisRes, finConnRes] = await Promise.all([
        supabase.functions.invoke('mydata-sync', { body: { action: 'get_analysis' } }),
        supabase.functions.invoke('mydata-sync', { body: { action: 'get_connections' } }),
      ]);

      // Load government data
      const [govAnalysisRes, govConnRes] = await Promise.all([
        supabase.functions.invoke('gov-data-sync', { body: { action: 'get_analysis' } }),
        supabase.functions.invoke('gov-data-sync', { body: { action: 'get_connections' } }),
      ]);

      // Process financial data
      if (finAnalysisRes.data?.analysis) {
        setFinancialAnalysis(finAnalysisRes.data.analysis);
      }
      if (finConnRes.data?.connections) {
        setFinancialConnections(finConnRes.data.connections);
      }

      // Process government data
      if (govAnalysisRes.data?.analyses) {
        setGovAnalyses(govAnalysisRes.data.analyses);
      }
      if (govConnRes.data?.connections) {
        setGovConnections(govConnRes.data.connections);
      }

      // Calculate combined categories
      buildCategories(
        finAnalysisRes.data?.analysis,
        finConnRes.data?.connections || [],
        govAnalysisRes.data?.analyses || [],
        govConnRes.data?.connections || []
      );

    } catch (error) {
      console.error('데이터 로드 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const buildCategories = (
    finAnalysis: FinancialAnalysis | null,
    finConns: FinConnection[],
    govAnalyses: GovAnalysis[],
    govConns: GovConnection[]
  ) => {
    const cats: CategoryData[] = [];
    let finVal = 0;
    let govVal = 0;

    // Financial categories
    const hasFinancial = finConns.length > 0;
    const finValue = finAnalysis?.data_value_refined || 0;
    finVal = finValue;

    cats.push({
      id: 'consumption',
      name: '소비 패턴',
      icon: ShoppingCart,
      source: 'financial',
      isConnected: hasFinancial,
      value: hasFinancial ? 85 : 0,
      vnValue: hasFinancial ? Math.floor(finValue * 0.6) : 0,
    });

    cats.push({
      id: 'asset',
      name: '금융 자산',
      icon: Briefcase,
      source: 'financial',
      isConnected: hasFinancial,
      value: hasFinancial ? 70 : 0,
      vnValue: hasFinancial ? Math.floor(finValue * 0.4) : 0,
    });

    // Government categories
    const govCategoryMap: Record<string, GovAnalysis> = {};
    govAnalyses.forEach(a => {
      govCategoryMap[a.analysis_type] = a;
    });

    const govCats = [
      { id: 'income_stability', type: 'tax' },
      { id: 'health_index', type: 'health' },
      { id: 'residence_stability', type: 'housing' },
      { id: 'education_level', type: 'education' },
      { id: 'military_service', type: 'military' },
      { id: 'professional_qualification', type: 'certification' },
    ];

    govCats.forEach(({ id, type }) => {
      const analysis = govCategoryMap[id];
      const conn = govConns.find(c => c.agency_type === type);
      const isConnected = !!conn;
      const vnValue = analysis?.data_value_refined || 0;
      govVal += vnValue;

      cats.push({
        id,
        name: CATEGORY_LABELS[id] || id,
        icon: CATEGORY_ICONS[id] || Database,
        source: 'government',
        isConnected,
        value: analysis?.score || 0,
        vnValue,
        grade: analysis?.grade,
      });
    });

    setCategories(cats);
    setFinancialValue(finVal);
    setGovernmentValue(govVal);
    setTotalValue(finVal + govVal);

    // Calculate overall score
    const connectedCats = cats.filter(c => c.isConnected);
    const avgScore = connectedCats.length > 0
      ? Math.floor(connectedCats.reduce((sum, c) => sum + c.value, 0) / connectedCats.length)
      : 0;
    setPortfolioScore(avgScore);
    setOverallGrade(
      avgScore >= 80 ? 'A' :
      avgScore >= 60 ? 'B' :
      avgScore >= 40 ? 'C' : 'D'
    );
  };

  const handleRefresh = async () => {
    setSyncing(true);
    await loadAllData();
    setSyncing(false);
    toast.success('데이터가 동기화되었습니다');
  };

  const connectedCount = categories.filter(c => c.isConnected).length;
  const totalCategories = categories.length;
  const completionRate = Math.floor((connectedCount / totalCategories) * 100);

  // Radar chart data
  const radarData = categories.map(cat => ({
    category: cat.name.split(' ')[0],
    value: cat.value,
    fullMark: 100,
  }));

  // Pie chart data
  const pieData = [
    { name: '금융 마이데이터', value: financialValue, color: SOURCE_COLORS.financial },
    { name: '정부 마이데이터', value: governmentValue, color: SOURCE_COLORS.government },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">종합 데이터 포트폴리오</h1>
                <p className="text-xs text-muted-foreground">Unified Data Portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={syncing}>
                <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                동기화
              </Button>
              <Badge className={`${
                overallGrade === 'A' ? 'bg-green-100 text-green-700' :
                overallGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {overallGrade}등급
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 종합 가치 카드 */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">총 데이터 자산 가치</p>
                <p className="text-3xl font-bold text-primary">
                  {totalValue.toLocaleString()} VN
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">활성</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/80 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">금융 마이데이터</span>
                </div>
                <p className="text-lg font-bold">{financialValue.toLocaleString()} VN</p>
              </div>
              <div className="bg-background/80 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">정부 마이데이터</span>
                </div>
                <p className="text-lg font-bold">{governmentValue.toLocaleString()} VN</p>
              </div>
            </div>

            {/* 완성도 */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">포트폴리오 완성도</span>
                <span className="text-sm font-medium">{connectedCount}/{totalCategories} 카테고리</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full grid grid-cols-7">
            <TabsTrigger value="overview" className="text-xs">종합</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">금융</TabsTrigger>
            <TabsTrigger value="government" className="text-xs">정부</TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs">설정</TabsTrigger>
            <TabsTrigger value="simulation" className="text-xs">시뮬</TabsTrigger>
            <TabsTrigger value="listings" className="text-xs">판매</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">내역</TabsTrigger>
          </TabsList>

          {/* 종합 분석 탭 */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* 레이더 차트 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>카테고리별 데이터 현황</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    평균 {portfolioScore}점
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                        tickCount={5}
                      />
                      <Radar
                        name="데이터"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 데이터 소스 비율 */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">데이터 소스 구성</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="h-32 w-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toLocaleString()} VN`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {pieData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.value.toLocaleString()} VN</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 카테고리 리스트 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">전체 데이터 카테고리</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        cat.isConnected 
                          ? 'bg-card border-border' 
                          : 'bg-muted/30 border-dashed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          cat.source === 'financial' 
                            ? 'bg-blue-100 dark:bg-blue-900/30' 
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            cat.source === 'financial' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cat.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                cat.source === 'financial' 
                                  ? 'border-blue-200 text-blue-600' 
                                  : 'border-green-200 text-green-600'
                              }`}
                            >
                              {cat.source === 'financial' ? '금융' : '정부'}
                            </Badge>
                            {cat.grade && (
                              <Badge variant="secondary" className="text-xs">{cat.grade}등급</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {cat.isConnected ? (
                          <>
                            <p className="text-sm font-bold">{cat.vnValue.toLocaleString()} VN</p>
                            <p className="text-xs text-muted-foreground">{cat.value}점</p>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Lock className="w-3 h-3 mr-1" />
                            미연동
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 금융 데이터 탭 */}
          <TabsContent value="financial" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">금융 마이데이터</h3>
                      <p className="text-sm text-muted-foreground">
                        {financialConnections.length}개 기관 연동됨
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowFinSheet(true)}>
                    기관 연동
                  </Button>
                </div>

                {financialConnections.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {financialConnections.map((conn, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {conn.institution_name}
                        </Badge>
                      ))}
                    </div>
                    {financialAnalysis && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">소비 페르소나</p>
                        <p className="font-medium">{financialAnalysis.persona_type}</p>
                        <div className="mt-3 flex justify-between text-sm">
                          <span>월 평균 소비</span>
                          <span className="font-medium">
                            {financialAnalysis.monthly_average?.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>데이터 가치</span>
                          <span className="font-medium text-primary">
                            {financialAnalysis.data_value_refined?.toLocaleString()} VN
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      금융 기관을 연동하여 소비 분석을 시작하세요
                    </p>
                    <Button onClick={() => setShowFinSheet(true)}>
                      금융 기관 연동하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 정부 데이터 탭 */}
          <TabsContent value="government" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">정부 마이데이터</h3>
                      <p className="text-sm text-muted-foreground">
                        {govConnections.length}개 기관 연동됨
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowGovSheet(true)}>
                    기관 연동
                  </Button>
                </div>

                {govConnections.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {govConnections.map((conn, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {conn.agency_name}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-2 mt-4">
                      {govAnalyses.map((analysis) => (
                        <div 
                          key={analysis.analysis_type}
                          className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {CATEGORY_ICONS[analysis.analysis_type] && (
                              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                {(() => {
                                  const Icon = CATEGORY_ICONS[analysis.analysis_type];
                                  return <Icon className="w-4 h-4 text-green-600" />;
                                })()}
                              </div>
                            )}
                            <span className="text-sm font-medium">
                              {CATEGORY_LABELS[analysis.analysis_type] || analysis.analysis_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{analysis.grade}</Badge>
                            <span className="text-sm font-medium text-primary">
                              {analysis.data_value_refined} VN
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      정부 기관을 연동하여 공인 데이터를 확보하세요
                    </p>
                    <Button onClick={() => setShowGovSheet(true)}>
                      정부 기관 연동하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 개인정보 설정 탭 */}
          <TabsContent value="privacy" className="mt-4">
            <PrivacyControlPanel categories={categories} />
          </TabsContent>

          {/* 판매 시뮬레이션 탭 */}
          <TabsContent value="simulation" className="mt-4">
            <DataSaleSimulator 
              categories={categories} 
              totalValue={totalValue} 
              onListingCreated={() => {
                setListingsKey(prev => prev + 1);
                setActiveTab('listings');
              }}
            />
          </TabsContent>

          {/* 판매 관리 탭 */}
          <TabsContent value="listings" className="mt-4">
            <DataListingManager 
              key={listingsKey}
              onCreateNew={() => setActiveTab('simulation')} 
            />
          </TabsContent>

          {/* 거래 내역 탭 */}
          <TabsContent value="history" className="mt-4">
            <SaleHistoryDetail />
          </TabsContent>
        </Tabs>

        {/* 시너지 안내 */}
        {connectedCount < totalCategories && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    포트폴리오 시너지 효과
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    더 많은 카테고리를 연동할수록 데이터 가치가 기하급수적으로 상승합니다.
                    {totalCategories - connectedCount}개 카테고리를 추가하면 
                    전체 가치가 약 {Math.floor((totalCategories - connectedCount) * 15)}% 상승할 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sheets */}
      <MydataConnectionSheet
        open={showFinSheet}
        onOpenChange={setShowFinSheet}
        onConnectionSuccess={loadAllData}
      />
      <GovDataConnectionSheet
        open={showGovSheet}
        onOpenChange={setShowGovSheet}
        onConnectionSuccess={loadAllData}
      />
    </div>
  );
}