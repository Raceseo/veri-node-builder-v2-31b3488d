/**
 * 🔴 2026-08-22 — 홈의 「데이터 공급하기」 버튼을 제거해 진입점을 좁혔다.
 *    라우트 /security-engine(App.tsx:69)은 남아 있어 직접 URL 로는 열린다.
 *
 * **핵심 결함은 허위 표시가 아니라 기록이 남지 않는 것이다.**
 *   logs(:19)가 useState 로컬 상태라 제출(:90)해도 **새로고침하면 전부 사라진다.**
 *   지표 4개(Total Data / Anomalies / Pending / Gold Tier, :298-301)가 그 logs 로
 *   계산되므로 항상 0 에서 다시 시작한다. 「보안 로그」·「Data Market」도 같다.
 *   → 문구를 고쳐서 해결되는 문제가 아니다. DB 연결이 선행돼야 한다.
 *
 * ✅ **작동 상태 허위 표시는 제거됨 (2026-08-22).** 되돌리지 말 것.
 *   지운 것 3곳 — 전부 상태 바인딩이 없는 정적 JSX 였다:
 *     (1) 사이드바 「Valuation Agent: READY」·「Security Analyst: Active」 카드 2개.
 *         초록 점 animate-pulse 로 살아 움직이는 것처럼 보였지만 함수가 죽어 있어도
 *         언제나 Active 로 표시됐다.
 *     (2) "MyData Sovereignty Monitor" / "Protocol level validation of incoming
 *         financial streams." → 「최근 제출 내역」로 교체.
 *     (3) "No activity detected. Protocol awaiting data ingestion."
 *         → 「아직 제출한 데이터가 없습니다.」
 *   B-87(실명 기관 제휴 허위 표시)과 같은 유형이라 같은 기준으로 처리했다.
 *   🔴 홈 버튼을 없앤 것은 접근 차단이지 표시 제거가 아니다 — URL 직접 접근이
 *      남으므로 표시 자체를 지워야 했다.
 *
 * 🔴 **근본 문제는 미해결이다 (B-91).** logs 가 로컬 상태라 새로고침 시 소멸하는 것은
 *    그대로다. 화면에 그 사실을 적어뒀을 뿐이다("이 목록은 저장되지 않습니다").
 *    DB 이관 전에는 이 화면을 홈 동선에 다시 올리지 않는다.
 *
 * 실재하는 것: 제출 시 Edge Function security-verify(:47)·data-valuation(:56) 호출.
 *   두 함수는 supabase/functions/ 에 실재한다. 다만 위 「Active」 표시와는 무관하다.
 *
 * 되살릴 때: (a)logs 를 DB 로 옮기고 (b):160-182 를 실제 상태에 바인딩하거나 삭제한다.
 *
 * 백로그 B-91.
 */
import React, { useState } from 'react';
import { 
  Shield, Database, Activity, Upload, Clock, 
  CheckCircle2, UserX, Wallet, Terminal, TrendingUp, 
  ShoppingBag, Zap, Gem, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  LogStatus, DataTier, DataSalesLog, UserReward, UserBehavior 
} from '@/types/securityEngine';

type TabType = 'dashboard' | 'contribute' | 'logs' | 'marketplace';

const SecurityEngineDashboard: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DataSalesLog[]>([]);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Form state
  const [content, setContent] = useState('');
  const [isCherryPickerMode, setIsCherryPickerMode] = useState(false);
  const [simDays, setSimDays] = useState(5);
  const [simContext, setSimContext] = useState('High inflation, holiday season');

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsProcessing(true);

    const behavior: UserBehavior = {
      session_duration_sec: isCherryPickerMode ? 15 : 450,
      pages_visited: isCherryPickerMode 
        ? ['login', 'contribute', 'rewards_withdraw'] 
        : ['login', 'dashboard', 'settings', 'contribute'],
      last_action: isCherryPickerMode ? 'attempt_withdraw' : 'data_contribution',
      ip_address: isCherryPickerMode ? '192.168.1.105' : '45.12.33.11'
    };

    try {
      // 1. Security Check
      const { data: securityData, error: securityError } = await supabase.functions.invoke('security-verify', {
        body: { content, behavior, userId: user.id }
      });

      if (securityError) throw securityError;
      
      let valuationResult = null;
      if (securityData.decision === LogStatus.APPROVED) {
        // 2. Data Valuation if approved
        const { data: valuationData, error: valuationError } = await supabase.functions.invoke('data-valuation', {
          body: { 
            content, 
            score5W1H: securityData.score5W1H,
            continuousDays: simDays,
            contextData: simContext,
            userId: user.id
          }
        });
        
        if (valuationError) throw valuationError;
        valuationResult = valuationData;
      }

      const newLog: DataSalesLog = {
        id: `TX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        user_id: user.id,
        content,
        is_fraud_checked: securityData.isFraud || securityData.decision === LogStatus.PENDING_REVIEW,
        status: securityData.decision as LogStatus,
        fraud_reason: securityData.fraudReason,
        escrow_release_date: securityData.decision === LogStatus.APPROVED 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
          : null,
        created_at: new Date().toISOString(),
        five_w_one_h_score: securityData.overallScore,
        fraud_analysis: securityData.analysis,
        behavior_context: behavior,
        market_value: valuationResult?.marketValue || 0,
        tier: valuationResult?.tier || 'Unranked',
        is_listed_for_sale: valuationResult?.isListed || false,
        valuation_report: valuationResult?.report || 'No valuation performed.'
      };

      setLogs(prev => [newLog, ...prev]);
      
      if (securityData.decision === LogStatus.APPROVED) {
        const rewardAmount = Math.floor(securityData.overallScore * 10);
        setRewards(prev => [...prev, {
          id: `RW-${Math.random().toString(36).substr(2, 4)}`,
          user_id: user.id,
          amount: rewardAmount,
          status: 'escrowed'
        }]);
        toast.success(`데이터가 승인되었습니다! ${rewardAmount} VNT 보상 예정`);
      } else if (securityData.decision === LogStatus.PENDING_REVIEW) {
        toast.warning('추가 검토가 필요합니다.');
      } else {
        toast.error('데이터가 거부되었습니다: ' + securityData.fraudReason);
      }

      setContent('');
      setActiveTab('logs');
    } catch (error) {
      console.error("Agent Pipeline Failed:", error);
      toast.error("AI 에이전트 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierColor = (tier: DataTier) => {
    switch (tier) {
      case 'Gold': return 'from-gold to-gold-dark text-navy';
      case 'Silver': return 'from-gray-300 to-gray-500 text-gray-900';
      case 'Bronze': return 'from-orange-600 to-orange-800 text-white';
      default: return 'from-gray-600 to-gray-800 text-gray-300';
    }
  };

  const getStatusBadge = (status: LogStatus) => {
    switch (status) {
      case LogStatus.APPROVED: return 'bg-success/10 text-success border-success/20';
      case LogStatus.FRAUD: return 'bg-destructive/10 text-destructive border-destructive/20';
      case LogStatus.PENDING_REVIEW: return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const totalVNT = rewards.reduce((sum, r) => sum + r.amount, 0);
  const marketCap = logs.filter(l => l.is_listed_for_sale).reduce((sum, l) => sum + l.market_value, 0);

  return (
    <div className="min-h-screen bg-navy text-white font-sans">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-navy-dark border-r border-white/10 flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-trust rounded-lg shadow-trust">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">VERINODE</h1>
            <p className="text-[10px] text-trust font-bold tracking-widest uppercase">Security Protocol</p>
          </div>
        </div>

        <div className="space-y-1.5 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-5 h-5" />} label="Security Hub" />
          <NavItem active={activeTab === 'contribute'} onClick={() => setActiveTab('contribute')} icon={<Upload className="w-5 h-5" />} label="데이터 제출" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal className="w-5 h-5" />} label="보안 로그" />
          <NavItem active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} icon={<ShoppingBag className="w-5 h-5" />} label="Data Market" />
        </div>

        {/* 2026-08-22 — 「Valuation Agent: READY」·「Security Analyst: Active」 카드 2개 제거.
            상태 바인딩이 전혀 없는 정적 JSX 였다. 초록 점 animate-pulse 로 살아 움직이는
            것처럼 보였지만 함수가 죽어 있어도 언제나 Active 로 표시됐다.
            래퍼(mt-auto space-y-4)까지 함께 지웠다 — 빈 칸이 남으면 껍데기가 된다.
            메뉴 목록의 flex-1 이 남은 높이를 그대로 채운다. */}
      </nav>

      <main className="pl-64 min-h-screen">
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 sticky top-0 bg-navy/80 backdrop-blur-md z-40">
          <h2 className="text-lg font-bold uppercase tracking-widest text-gray-400">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-navy-dark border border-white/10 rounded-2xl">
              <Wallet className="w-4 h-4 text-trust" />
              <span className="text-sm font-bold">{totalVNT} <span className="text-gray-500 font-medium">VNT</span></span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardTab 
                logs={logs} 
                getTierColor={getTierColor} 
                getStatusBadge={getStatusBadge} 
              />
            )}

            {activeTab === 'marketplace' && (
              <MarketplaceTab 
                logs={logs} 
                marketCap={marketCap}
                getTierColor={getTierColor} 
              />
            )}

            {activeTab === 'contribute' && (
              <ContributeTab 
                content={content}
                setContent={setContent}
                isCherryPickerMode={isCherryPickerMode}
                setIsCherryPickerMode={setIsCherryPickerMode}
                simDays={simDays}
                setSimDays={setSimDays}
                simContext={simContext}
                setSimContext={setSimContext}
                isProcessing={isProcessing}
                onSubmit={handleContribute}
              />
            )}

            {activeTab === 'logs' && (
              <LogsTab 
                logs={logs} 
                getTierColor={getTierColor}
                getStatusBadge={getStatusBadge} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Philosophy Footer */}
        <div className="fixed bottom-0 left-64 right-0 py-3 px-8 bg-navy-dark/80 backdrop-blur border-t border-white/5">
          <p className="text-center text-xs text-gray-500 font-medium">
            <span className="text-gold">●</span> 데이터의 주인은 나이며, 무상으로 제공하지 않는다
          </p>
        </div>
      </main>
    </div>
  );
};

// Sub-components
const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-trust text-white shadow-trust' 
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-gray-600 group-hover:text-trust'} transition-colors`}>{icon}</span>
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'trust' | 'destructive' | 'warning' | 'gold' }) => {
  const colors = {
    trust: 'text-trust bg-trust/10 border-trust/20',
    destructive: 'text-destructive bg-destructive/10 border-destructive/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    gold: 'text-gold bg-gold/10 border-gold/20'
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-light border border-white/10 rounded-3xl p-6 hover:-translate-y-1 transition-all"
    >
      <div className={`p-3 w-fit rounded-xl border mb-4 ${colors[color]}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      <p className="text-4xl font-black mt-1 tracking-tighter">{value}</p>
    </motion.div>
  );
};

const DashboardTab = ({ logs, getTierColor, getStatusBadge }: { 
  logs: DataSalesLog[], 
  getTierColor: (tier: DataTier) => string,
  getStatusBadge: (status: LogStatus) => string 
}) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="grid grid-cols-1 md:grid-cols-4 gap-6"
  >
    <StatCard title="Total Data" value={logs.length.toString()} icon={<Database className="w-5 h-5" />} color="trust" />
    <StatCard title="Anomalies" value={logs.filter(l => l.status === LogStatus.FRAUD).length.toString()} icon={<UserX className="w-5 h-5" />} color="destructive" />
    <StatCard title="Pending" value={logs.filter(l => l.status === LogStatus.PENDING_REVIEW).length.toString()} icon={<Clock className="w-5 h-5" />} color="warning" />
    <StatCard title="Gold Tier" value={logs.filter(l => l.tier === 'Gold').length.toString()} icon={<Gem className="w-5 h-5" />} color="gold" />
    
    <div className="md:col-span-4 bg-navy-light border border-white/10 rounded-3xl p-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Shield className="w-64 h-64 text-trust" />
      </div>
      {/* 2026-08-22 — "MyData Sovereignty Monitor" / "Protocol level validation of
          incoming financial streams." 를 걷어냈다. 마이데이터 금융 스트림을 실시간
          검증하는 시스템처럼 읽히지만 그런 것은 없다. 제출 시 Edge Function 을
          한 번 호출할 뿐이다. 화면이 하는 일 그대로 적는다. */}
      <h3 className="text-xl font-bold mb-2">최근 제출 내역</h3>
      <p className="text-sm text-gray-500 mb-8">이 목록은 저장되지 않습니다 — 새로고침하면 사라집니다 (B-91).</p>
      
      <div className="space-y-4 relative z-10">
        {logs.length === 0 ? (
          <div className="py-20 text-center text-gray-600">아직 제출한 데이터가 없습니다.</div>
        ) : (
          logs.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between p-4 bg-navy/40 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${log.status === LogStatus.APPROVED ? 'bg-success' : 'bg-destructive'}`} />
                <div>
                  <p className="text-sm font-bold uppercase">{log.id}</p>
                  <p className="text-xs text-gray-500">{log.tier} Tier • Value: ${log.market_value.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {log.is_listed_for_sale && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-trust/20 text-trust border border-trust/20 uppercase">Listed</span>
                )}
                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${getStatusBadge(log.status)}`}>
                  {log.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </motion.div>
);

const MarketplaceTab = ({ logs, marketCap, getTierColor }: { 
  logs: DataSalesLog[], 
  marketCap: number,
  getTierColor: (tier: DataTier) => string 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="space-y-8"
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black">Data Marketplace</h3>
        <p className="text-gray-500 text-sm">Corporate grade insights available for acquisition.</p>
      </div>
      <div className="bg-trust/10 border border-trust/20 px-6 py-3 rounded-2xl flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] uppercase font-black text-trust">Node Market Cap</p>
          <p className="text-lg font-black">${marketCap.toFixed(2)}</p>
        </div>
        <TrendingUp className="w-6 h-6 text-trust" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {logs.filter(l => l.is_listed_for_sale).map(log => (
        <motion.div 
          key={log.id} 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-navy-light border border-white/10 rounded-3xl p-6 hover:border-trust/40 transition-all flex flex-col group"
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-br shadow-xl ${getTierColor(log.tier)}`}>
              {log.tier} Quality
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-gray-500">Valuation</p>
              <p className="text-xl font-black text-success">${log.market_value.toFixed(2)}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 font-medium mb-8 leading-relaxed line-clamp-3 italic">
            "{log.content}"
          </p>

          <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-600">
              <span>Continuity</span>
              <span className="text-trust">Verified</span>
            </div>
            <button className="w-full py-3 bg-navy border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">
              View Detailed Insights
            </button>
          </div>
        </motion.div>
      ))}
      {logs.filter(l => l.is_listed_for_sale).length === 0 && (
        <div className="col-span-full py-32 text-center bg-navy/20 border-2 border-dashed border-white/10 rounded-3xl">
          <Zap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">No Gold-Tier Data Available</p>
        </div>
      )}
    </div>
  </motion.div>
);

const ContributeTab = ({ 
  content, setContent, 
  isCherryPickerMode, setIsCherryPickerMode,
  simDays, setSimDays,
  simContext, setSimContext,
  isProcessing, onSubmit 
}: {
  content: string;
  setContent: (v: string) => void;
  isCherryPickerMode: boolean;
  setIsCherryPickerMode: (v: boolean) => void;
  simDays: number;
  setSimDays: (v: number) => void;
  simContext: string;
  setSimContext: (v: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="max-w-xl mx-auto py-10"
  >
    <div className="bg-navy-light border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-trust via-gold to-success" />
      
      <div className="mb-10 text-center">
        <h3 className="text-2xl font-black mb-2">데이터 제출</h3>
        <p className="text-gray-500 text-sm">Verify Sovereignty & Appraise Value</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Simulation Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-1">연속 기여일수</label>
            <input 
              type="number" 
              value={simDays} 
              onChange={e => setSimDays(parseInt(e.target.value) || 0)}
              className="w-full bg-navy border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-trust transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-1">시장 컨텍스트</label>
            <input 
              type="text" 
              value={simContext} 
              onChange={e => setSimContext(e.target.value)}
              className="w-full bg-navy border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-trust transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">데이터 내용</label>
            <button 
              type="button" 
              onClick={() => setIsCherryPickerMode(!isCherryPickerMode)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                isCherryPickerMode 
                  ? 'bg-destructive/10 text-destructive border-destructive/30' 
                  : 'bg-white/5 text-gray-500 border-white/10'
              }`}
            >
              <UserX className="w-3 h-3" />
              Simulate Attack
            </button>
          </div>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="금융 데이터나 인사이트를 입력하세요..."
            className="w-full h-40 bg-navy border-2 border-white/10 rounded-3xl p-6 focus:border-trust transition-all outline-none resize-none font-mono text-sm"
            disabled={isProcessing}
          />
        </div>

        {isCherryPickerMode && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              Cherry-picker 모드가 활성화되었습니다. AI가 의심스러운 행동 패턴을 감지합니다.
            </p>
          </div>
        )}

        <button 
          type="submit"
          disabled={isProcessing || !content.trim()}
          className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
            isProcessing 
              ? 'bg-white/10 text-gray-600' 
              : 'bg-white text-navy hover:bg-gray-200 shadow-xl'
          }`}
        >
          {isProcessing ? 'AI Agents Processing...' : '평가 및 제출'}
        </button>
      </form>
    </div>
  </motion.div>
);

const LogsTab = ({ logs, getTierColor, getStatusBadge }: { 
  logs: DataSalesLog[], 
  getTierColor: (tier: DataTier) => string,
  getStatusBadge: (status: LogStatus) => string 
}) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="space-y-6"
  >
    {logs.length === 0 ? (
      <div className="py-32 text-center">
        <Terminal className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-600">아직 제출된 데이터가 없습니다</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4">
        {logs.map((log, index) => (
          <motion.div 
            key={log.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-navy-light border border-white/10 rounded-3xl p-8 hover:border-trust/30 transition-all group"
          >
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border-2 ${getStatusBadge(log.status)}`}>
                    {log.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border-2 bg-gradient-to-br ${getTierColor(log.tier)}`}>
                    {log.tier}
                  </span>
                  <span className="text-xs font-mono text-gray-600">{log.id}</span>
                </div>
                
                <p className="text-sm text-gray-300 font-medium mb-6 leading-relaxed bg-navy/40 p-4 rounded-2xl border border-white/5">
                  {log.content}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <LogMeta label="Valuation" value={`$${log.market_value.toFixed(2)}`} />
                  <LogMeta label="Market Status" value={log.is_listed_for_sale ? 'LISTED' : 'PRIVATE'} />
                  <LogMeta label="Quality Score" value={`${log.five_w_one_h_score}/100`} />
                  <LogMeta label="Security" value={log.is_fraud_checked ? 'VERIFIED' : 'PENDING'} />
                  <LogMeta 
                    label="🔒 Escrow Release" 
                    value={log.escrow_release_date 
                      ? new Date(log.escrow_release_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                      : 'N/A'
                    } 
                    highlight={!!log.escrow_release_date}
                  />
                </div>
              </div>

              <div className="lg:w-80 space-y-4">
                <div className="bg-navy/40 rounded-2xl p-5 border border-white/5 group-hover:border-trust/20 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-gold" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Valuation Report</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed italic line-clamp-3">
                    "{log.valuation_report}"
                  </p>
                </div>
                <div className="bg-navy/40 rounded-2xl p-5 border border-white/5 group-hover:border-trust/20 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-trust" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Security Analysis</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed italic line-clamp-3">
                    "{log.fraud_analysis}"
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
);

const LogMeta = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <div>
    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{label}</p>
    <p className={`text-xs font-bold ${highlight ? 'text-gold' : 'text-gray-400'}`}>{value}</p>
  </div>
);

export default SecurityEngineDashboard;
