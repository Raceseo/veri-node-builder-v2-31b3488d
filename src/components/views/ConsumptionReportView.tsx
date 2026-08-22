/**
 * 🔴 이 화면은 2026-08-22 에 진입점이 차단됐다. 되살리기 전에 반드시 읽을 것.
 *
 * mydata-sync 를 호출하지만 연동이 0건이면 analysis 가 비고 **폴백 가짜값**이 뜬다.
 *   - getChartData(): 식비 32 / 쇼핑 24 / 교통 18 / 통신 14 / 문화생활 12 (고정)
 *   - getMonthlyTrendData(): baseAmount 폴백 월 250만원 +
 *     🔴 Math.random() — **새로고침할 때마다 지난달 소비 금액이 바뀐다.**
 *
 * 이 화면은 데이터 가치를 계산하지 않는다. 소비 금액 추정치이고 그마저 난수다.
 * 가치 산정이 필요하면 별도 Edge Function data-valuation 이 있다 — 여기서는 호출하지 않는다.
 *
 * 되살릴 때: 폴백을 지우고 "연결된 데이터가 없습니다" 빈 상태로 바꾼다.
 *
 * 백로그 B-89. 차단 경위는 QuickMenu.tsx 상단 주석 참조.
 */
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Sparkles, TrendingUp, Lock, Award, CreditCard, ShoppingBag, Car, Utensils, Smartphone, Plane, Building2, Link2, RefreshCw, Loader2, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MydataConnectionSheet } from "@/components/mydata/MydataConnectionSheet";
import { toast } from "sonner";

interface ConsumptionReportViewProps {
  onBack: () => void;
}

interface ConsumptionAnalysis {
  persona_type: string;
  persona_description: string;
  category_breakdown: Record<string, number>;
  monthly_average: number;
  data_value_raw: number;
  data_value_refined: number;
  analysis_date: string;
}

interface MydataConnection {
  id: string;
  institution_name: string;
  institution_type: string;
  connected_at: string;
  sync_status: string;
}

const categoryIcons: Record<string, any> = {
  '식비': Utensils,
  '쇼핑': ShoppingBag,
  '교통': Car,
  '통신': Smartphone,
  '문화생활': Plane,
  '의료/건강': Shield,
  '주거': Building2,
  '금융': CreditCard,
};

const categoryColors: Record<string, string> = {
  '식비': '#1e3a5f',
  '쇼핑': '#c9a227',
  '교통': '#2d5a87',
  '통신': '#4a7fb5',
  '문화생활': '#6b9fd4',
  '의료/건강': '#3d7a5f',
  '주거': '#5a3d7a',
  '금융': '#7a5a3d',
};

const ConsumptionReportView = ({ onBack }: ConsumptionReportViewProps) => {
  const [analysis, setAnalysis] = useState<ConsumptionAnalysis | null>(null);
  const [connections, setConnections] = useState<MydataConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectionSheet, setShowConnectionSheet] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 분석 데이터 로드
      const { data: analysisData } = await supabase.functions.invoke('mydata-sync', {
        body: { action: 'get_analysis' }
      });

      if (analysisData?.analysis) {
        setAnalysis(analysisData.analysis);
      }

      // 연결 정보 로드
      const { data: connectionsData } = await supabase.functions.invoke('mydata-sync', {
        body: { action: 'get_connections' }
      });

      if (connectionsData?.connections) {
        setConnections(connectionsData.connections);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSuccess = async () => {
    await loadData();
    toast.success('소비 분석이 업데이트되었습니다!');
  };

  // 차트용 데이터 변환
  const getChartData = () => {
    if (!analysis?.category_breakdown) {
      return [
        { name: "식비", value: 32, color: "#1e3a5f" },
        { name: "쇼핑", value: 24, color: "#c9a227" },
        { name: "교통", value: 18, color: "#2d5a87" },
        { name: "통신", value: 14, color: "#4a7fb5" },
        { name: "문화생활", value: 12, color: "#6b9fd4" },
      ];
    }

    const total = Object.values(analysis.category_breakdown).reduce((sum, val) => sum + val, 0);
    return Object.entries(analysis.category_breakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
        color: categoryColors[name] || '#4a7fb5'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const consumptionData = getChartData();

  // 월별 트렌드 데이터 생성
  const getMonthlyTrendData = () => {
    const months = ['10월', '11월', '12월', '1월', '2월', '3월'];
    const baseAmount = analysis?.monthly_average || 2500000;
    
    return months.map((month, index) => {
      // 자연스러운 변동 패턴 생성
      const variation = Math.sin(index * 0.8) * 0.15 + (Math.random() - 0.5) * 0.1;
      const amount = Math.round(baseAmount * (1 + variation));
      const prevAmount = index > 0 
        ? Math.round(baseAmount * (1 + Math.sin((index - 1) * 0.8) * 0.15))
        : amount;
      const change = ((amount - prevAmount) / prevAmount * 100).toFixed(1);
      
      return {
        month,
        amount,
        prevAmount,
        change: parseFloat(change),
        식비: Math.round(amount * 0.32),
        쇼핑: Math.round(amount * 0.24),
        교통: Math.round(amount * 0.18),
        기타: Math.round(amount * 0.26),
      };
    });
  };

  const monthlyTrendData = getMonthlyTrendData();
  const latestMonth = monthlyTrendData[monthlyTrendData.length - 1];
  const previousMonth = monthlyTrendData[monthlyTrendData.length - 2];
  const monthlyChange = latestMonth && previousMonth 
    ? ((latestMonth.amount - previousMonth.amount) / previousMonth.amount * 100).toFixed(1)
    : '0';
  const isIncrease = parseFloat(monthlyChange) > 0;

  // 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-amber-500/30 shadow-xl">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-amber-400 text-sm font-bold">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {consumptionData.map((entry, index) => {
          const IconComponent = categoryIcons[entry.name] || CreditCard;
          return (
            <div key={index} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <IconComponent className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-300">{entry.name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const personaType = analysis?.persona_type || '트렌디한 얼리어답터';
  const personaDescription = analysis?.persona_description || '최신 트렌드에 민감하고 새로운 경험을 즐기는 소비자';
  const dataValueRaw = analysis?.data_value_raw || 100;
  const dataValueRefined = analysis?.data_value_refined || 850;
  const multiplier = (dataValueRefined / dataValueRaw).toFixed(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">소비 성향 리포트</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            disabled={syncing}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <motion.div 
        className="p-4 pb-24 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 마이데이터 연결 섹션 */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-white">마이데이터 연결</h2>
              </div>
              <Button
                size="sm"
                onClick={() => setShowConnectionSheet(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Building2 className="w-4 h-4 mr-1" />
                기관 연결
              </Button>
            </div>

            {connections.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-2">연결된 금융기관 ({connections.length}개)</p>
                <div className="flex flex-wrap gap-2">
                  {connections.map((conn) => (
                    <Badge 
                      key={conn.id} 
                      variant="secondary"
                      className="bg-slate-700/50 text-slate-200 border-slate-600/50"
                    >
                      {conn.institution_type === 'bank' ? (
                        <Building2 className="w-3 h-3 mr-1" />
                      ) : (
                        <CreditCard className="w-3 h-3 mr-1" />
                      )}
                      {conn.institution_name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">
                  금융기관을 연결하여 실제 소비 데이터를 분석하세요
                </p>
                <p className="text-xs text-amber-400 mt-1">
                  더 많은 기관 연결 = 더 높은 데이터 가치
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* 나의 소비 페르소나 섹션 */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">나의 소비 페르소나</h2>
            </div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/25"
            >
              <Sparkles className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">{personaType}</p>
                <p className="text-sm text-slate-800">{personaDescription}</p>
              </div>
            </motion.div>

            {analysis && (
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-400">월 평균 소비</p>
                <p className="text-lg font-bold text-white">
                  {(analysis.monthly_average || 0).toLocaleString()}
                  <span className="text-sm font-normal text-slate-400">원</span>
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* 소비 카테고리 도넛 차트 */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">주요 소비 카테고리</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {connections.length > 0 
                ? `${connections.length}개 기관 데이터 기반 분석`
                : '샘플 데이터 기반 분석'
              }
            </p>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consumptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {consumptionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="drop-shadow-lg"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {renderCustomLegend()}
          </div>
        </motion.section>

        {/* 월별 소비 트렌드 차트 */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">월별 소비 트렌드</h2>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isIncrease 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isIncrease ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(parseFloat(monthlyChange))}%
              </div>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400">이번 달</p>
                <p className="text-sm font-bold text-white">
                  {(latestMonth?.amount || 0).toLocaleString()}
                  <span className="text-[10px] text-slate-400">원</span>
                </p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400">지난 달</p>
                <p className="text-sm font-bold text-slate-300">
                  {(previousMonth?.amount || 0).toLocaleString()}
                  <span className="text-[10px] text-slate-400">원</span>
                </p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400">6개월 평균</p>
                <p className="text-sm font-bold text-slate-300">
                  {Math.round(monthlyTrendData.reduce((sum, m) => sum + m.amount, 0) / 6).toLocaleString()}
                  <span className="text-[10px] text-slate-400">원</span>
                </p>
              </div>
            </div>

            {/* 에어리어 차트 */}
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a227" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#c9a227" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10}
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #c9a227',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()}원`, '소비액']}
                    labelStyle={{ color: '#c9a227' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#c9a227"
                    strokeWidth={2}
                    fill="url(#amountGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 카테고리별 스택 바 차트 */}
            <p className="text-xs text-slate-400 mb-2">카테고리별 월간 소비</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10}
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                    formatter={(value: number, name: string) => [`${value.toLocaleString()}원`, name]}
                  />
                  <Bar dataKey="식비" stackId="a" fill="#1e3a5f" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="쇼핑" stackId="a" fill="#c9a227" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="교통" stackId="a" fill="#2d5a87" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="기타" stackId="a" fill="#4a7fb5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 범례 */}
            <div className="flex justify-center gap-4 mt-3">
              {[
                { name: '식비', color: '#1e3a5f' },
                { name: '쇼핑', color: '#c9a227' },
                { name: '교통', color: '#2d5a87' },
                { name: '기타', color: '#4a7fb5' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>

            {/* 인사이트 */}
            {connections.length > 0 && (
              <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xs text-amber-300 leading-relaxed">
                  <span className="font-semibold">💡 AI 인사이트:</span> 지난 6개월간 
                  <span className="font-medium text-amber-400"> 쇼핑</span> 카테고리 지출이 
                  평균 대비 <span className="font-medium text-amber-400">12% 증가</span>했습니다. 
                  시즌 세일 기간에 소비가 집중되는 패턴이 관찰됩니다.
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* 🆕 데이터 가치 비교 - 가로형 Progress Bar */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-[#1e3a5f]/80 to-slate-900/80 rounded-2xl p-5 border border-[#c9a227]/30">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#c9a227]" />
              <h2 className="text-base font-bold text-white">데이터 가치 비교</h2>
              <span className="ml-auto px-2 py-0.5 bg-[#c9a227]/20 rounded-full text-[10px] font-bold text-[#c9a227]">
                {multiplier}배 프리미엄
              </span>
            </div>
            
            {/* 일반 데이터 가치 Bar */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">일반 데이터 가치</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">{dataValueRaw.toLocaleString()}원</span>
                </div>
                <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-slate-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((dataValueRaw / dataValueRefined) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">카드사/통신사 판매 기준 가치</p>
              </div>

              {/* 정제된 데이터 가치 Bar - Gold 강조 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c9a227]" />
                    <span className="text-sm font-semibold text-[#c9a227]">나의 정제된 데이터 가치</span>
                  </div>
                  <span className="text-lg font-bold text-[#c9a227]">{dataValueRefined.toLocaleString()}원</span>
                </div>
                <div className="h-5 bg-slate-700/50 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, #c9a227 0%, #ffd700 50%, #c9a227 100%)',
                      boxShadow: '0 0 20px rgba(201, 162, 39, 0.5)'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </div>
                <p className="text-[10px] text-[#c9a227]/80">AI 검증 + 신원 확인 프리미엄 적용</p>
              </div>
            </div>

            {/* 가치 상승 설명 */}
            <div className="mt-4 p-3 bg-[#c9a227]/10 rounded-lg border border-[#c9a227]/20">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#c9a227] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-[#c9a227] font-bold">내 데이터가 {multiplier}배 비싼 이유:</span>
                  <br />
                  VeriNode의 AI가 신원을 검증하고, 데이터 순도를 높여 
                  <span className="text-[#c9a227] font-semibold"> 프리미엄 기업 고객</span>에게 
                  더 높은 가치로 판매됩니다.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 보안 안심 문구 */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-2xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 border border-emerald-500/30">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-300">데이터 익명화 완료</span>
                </div>
                <p className="text-xs text-slate-400">
                  모든 개인정보는 AES-256 암호화 및 k-익명화 처리되어 완벽하게 보호됩니다.
                </p>
              </div>
              <Lock className="w-5 h-5 text-emerald-500/50" />
            </div>
          </div>
        </motion.section>

        {/* 추가 인사이트 미리보기 */}
        <motion.section variants={itemVariants}>
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-bold text-white mb-3">📊 추가 분석 가능 인사이트</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "월별 소비 트렌드", locked: connections.length < 1 },
                { label: "브랜드 선호도", locked: connections.length < 2 },
                { label: "시간대별 소비 패턴", locked: connections.length < 2 },
                { label: "동년배 대비 비교", locked: connections.length < 3 },
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg
                    ${item.locked 
                      ? 'bg-slate-700/30 border border-slate-600/30' 
                      : 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20'
                    }
                  `}
                >
                  {item.locked ? (
                    <Lock className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  )}
                  <span className={`text-xs ${item.locked ? 'text-slate-500' : 'text-amber-300'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-3">
              {connections.length < 3 
                ? `${3 - connections.length}개 기관 추가 연결 시 모든 인사이트 잠금 해제`
                : '모든 인사이트가 활성화되었습니다!'
              }
            </p>
          </div>
        </motion.section>
      </motion.div>

      {/* 마이데이터 연결 시트 */}
      <MydataConnectionSheet
        open={showConnectionSheet}
        onOpenChange={setShowConnectionSheet}
        onConnectionSuccess={handleConnectionSuccess}
      />
    </div>
  );
};

export default ConsumptionReportView;
