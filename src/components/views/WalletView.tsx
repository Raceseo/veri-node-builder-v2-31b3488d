import { useState } from "react";
import { ArrowLeft, TrendingUp, Shield, ChevronRight, FileText, Share2, Heart, Check, TreePine, GraduationCap, BarChart3, Loader2, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import DonationSheet from "@/components/sheets/DonationSheet";
import DigitalBadgeCard from "@/components/DigitalBadgeCard";
import RevenueSourceView from "./RevenueSourceView";
import DataPensionSection from "@/components/wallet/DataPensionSection";
import WithdrawalSimulation from "@/components/wallet/WithdrawalSimulation";
import PartnerMarketplace from "@/components/marketplace/PartnerMarketplace";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getIconByType = (type: string) => {
  switch (type) {
    case 'document':
      return FileText;
    case 'sns':
      return Share2;
    default:
      return Heart;
  }
};

interface WalletViewProps {
  onOpenDataAssetDashboard?: () => void;
  estimatedMonthlyPension?: number; // VCoreAssetDashboard에서 연동
  onOpenDataMarketplace?: () => void; // Phase 3 데이터 마켓플레이스
}

const WalletView = ({ onOpenDataAssetDashboard, estimatedMonthlyPension, onOpenDataMarketplace }: WalletViewProps) => {
  const [selectedDonation, setSelectedDonation] = useState<typeof donations[0] | null>(null);
  const [isDonationSheetOpen, setIsDonationSheetOpen] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<{
    id: string;
    title: string;
    amount: number;
    date: string;
  } | null>(null);
  const [showPhase3Modal, setShowPhase3Modal] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['wallet-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('vn_balance, trust_score, display_name')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'earn')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const balance = profile?.vn_balance || 0;
  const trustScore = profile?.trust_score || 65;
  const userName = profile?.display_name || '사용자';
  const tier = trustScore >= 90 ? "Diamond" : trustScore >= 80 ? "Gold" : trustScore >= 70 ? "Silver" : "Bronze";

  const surveys = [
    { id: 1, tag: "개발자 전용", title: "IT 개발자 직무 만족도 조사", reward: 2000, time: "약 3분" },
    { id: 2, tag: "금융", title: "금융 생활 습관 조사", reward: 1500, time: "약 2분" },
  ];

  const donations = [
    { id: 1, title: "지구 환경 보호", description: "기후 변화 대응을 위한 나무 심기 프로젝트", icon: TreePine, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: 2, title: "아동 교육 지원", description: "저소득층 아동을 위한 교육 지원", icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50" },
  ];

  const handleDonateClick = (donation: typeof donations[0]) => {
    setSelectedDonation(donation);
    setIsDonationSheetOpen(true);
  };

  const handleDonate = (amount: number) => {
    // In a real app, this would update the database
    console.log('Donated:', amount);
  };

  if (profileLoading || transactionsLoading) {
    return (
      <div className="bg-background min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show Revenue Source View when an earning is selected
  if (selectedEarning) {
    return (
      <RevenueSourceView
        earning={{
          id: typeof selectedEarning.id === 'string' ? parseInt(selectedEarning.id.slice(0, 8), 16) : 1,
          title: selectedEarning.title,
          amount: selectedEarning.amount,
          date: selectedEarning.date
        }}
        onBack={() => setSelectedEarning(null)}
      />
    );
  }

  return (
    <div className="bg-background min-h-full pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <button className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">나의 지갑</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 space-y-6">
        {/* Digital Badge Card */}
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            디지털 인증 배지
          </h2>
          <DigitalBadgeCard 
            userName={userName}
            tier={tier}
            percentile={5}
          />
        </div>

        {/* Withdrawal Simulation - Phase 3 */}
        <WithdrawalSimulation 
          balance={balance}
          onComplete={(amount) => {
            console.log('Withdrawal completed:', amount);
          }}
        />

        {/* Balance Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <p className="text-sm text-muted-foreground mb-2">총 보유 수익금</p>
          <p className="text-4xl font-bold text-foreground mb-1">
            {balance.toLocaleString()}<span className="text-xl">원</span>
          </p>
          <p className="text-sm text-success flex items-center justify-center gap-1 mb-6">
            <TrendingUp className="w-4 h-4" />
            지난달 대비 +12%
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">누적 신뢰 점수</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{trustScore}점</p>
            <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "98%" }} />
            </div>
          </div>

          <div className="bg-foreground rounded-2xl p-4 text-card relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-20">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="text-xs text-card/70 mb-1">현재 등급</p>
            <p className="text-xl font-bold text-card">{tier} Tier</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-card/20 text-card text-xs">
              Top 5%
            </span>
          </div>
        </div>

        {/* Data Pension Section - VCoreAssetDashboard 연동 */}
        <DataPensionSection estimatedMonthlyPension={estimatedMonthlyPension} />

        {/* Partner Marketplace - Phase 3 */}
        <PartnerMarketplace estimatedMonthlyPension={estimatedMonthlyPension} />

        {/* Data Asset Dashboard Button */}
        {onOpenDataAssetDashboard && (
          <button 
            onClick={onOpenDataAssetDashboard}
            className="w-full bg-gradient-to-r from-indigo-900/60 to-slate-900/80 rounded-2xl p-5 border border-indigo-500/30 flex items-center gap-4 hover:border-indigo-400/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold">데이터 자산 관리 대시보드</h3>
              <p className="text-indigo-300/70 text-sm">연금 · 배당 · 통제 센터 관리</p>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400" />
          </button>
        )}

        {/* Recent Earnings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">최근 수익 내역</h2>
            <button className="text-sm text-primary">전체보기</button>
          </div>

          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {(!transactions || transactions.length === 0) ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground text-sm">아직 수익 내역이 없습니다</p>
              </div>
            ) : (
              transactions.map((item, index) => {
                const Icon = getIconByType(item.reference_type || 'earn');
                return (
                  <button 
                    key={item.id}
                    onClick={() => setSelectedEarning({
                      id: item.id,
                      title: item.description || '수익',
                      amount: item.amount,
                      date: format(new Date(item.created_at), 'MM.dd')
                    })}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left ${index < transactions.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.description || '수익'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-success" />
                        데이터 무결성 검증 완료 · {format(new Date(item.created_at), 'MM.dd')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-success font-bold">+{item.amount.toLocaleString()}원</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Surveys */}
        <div>
          <h2 className="font-bold text-foreground mb-3">수익 더 높이기</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {surveys.map((survey) => (
              <div 
                key={survey.id}
                className="min-w-[200px] bg-card rounded-2xl p-4 shadow-card shrink-0"
              >
                <div className="w-full h-24 bg-secondary rounded-xl mb-3 flex items-center justify-center text-muted-foreground">
                  <ChevronRight className="w-8 h-8" />
                </div>
                <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium mb-2">
                  {survey.tag}
                </span>
                <span className="float-right text-success text-sm font-bold">+{survey.reward.toLocaleString()}원</span>
                <p className="font-medium text-foreground text-sm line-clamp-2">{survey.title}</p>
                <p className="text-xs text-muted-foreground mt-1">소요시간 {survey.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donations */}
        <div>
          <h2 className="font-bold text-foreground mb-3">사회 공헌을 위한 기부</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {donations.map((donation) => {
              const Icon = donation.icon;
              return (
                <div 
                  key={donation.id}
                  className="min-w-[200px] bg-card rounded-2xl p-4 shadow-card shrink-0"
                >
                  <div className={`w-full h-24 ${donation.bg} rounded-xl mb-3 flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${donation.color}`} />
                  </div>
                  <p className="font-bold text-foreground text-sm mb-1">{donation.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{donation.description}</p>
                  <Button 
                    size="sm" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    onClick={() => handleDonateClick(donation)}
                  >
                    기부하기 <Heart className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 3 Preview Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setShowPhase3Modal(true)}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] rounded-2xl p-5 shadow-lg shadow-purple-500/20 flex items-center gap-4 hover:shadow-purple-500/30 transition-all group animate-gradient"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold">내 데이터 연금 신청하기</h3>
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full font-medium animate-pulse">
                  Phase 3 프리뷰
                </span>
              </div>
              <p className="text-purple-200 text-sm">데이터 마켓플레이스에서 정기 수익 창출</p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Phase 3 Preview Modal */}
      <Dialog open={showPhase3Modal} onOpenChange={setShowPhase3Modal}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-600" />
              Phase 3: 데이터 마켓플레이스
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">데이터 연금 시스템</p>
                  <p className="text-xs text-slate-500">Coming Soon in Phase 3</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                VeriNode Phase 3에서는 당신의 익명화된 데이터를 기업에게 안전하게 제공하고, 
                매월 정기적인 <span className="font-bold text-purple-600">데이터 연금</span>을 받을 수 있습니다.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>V-Core 익명화로 완벽한 프라이버시 보장</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>기업 수요 기반 공정한 가격 책정</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>매월 자동 정산 및 투명한 수익 분배</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                setShowPhase3Modal(false);
                onOpenDataMarketplace?.();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              데이터 마켓플레이스 미리보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Donation Sheet */}
      {selectedDonation && (
        <DonationSheet
          open={isDonationSheetOpen}
          onOpenChange={setIsDonationSheetOpen}
          donation={selectedDonation}
          balance={balance}
          onDonate={handleDonate}
        />
      )}
    </div>
  );
};

export default WalletView;