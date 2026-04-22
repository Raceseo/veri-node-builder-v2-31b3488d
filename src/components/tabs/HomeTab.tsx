import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeProfile } from "@/hooks/useRealtimeProfile";
import { useAuth } from "@/hooks/useAuth";
import TrustScoreCard from "@/components/home/TrustScoreCard";
import CredibilityCard from "@/components/home/CredibilityCard";
import EarningsCard from "@/components/home/EarningsCard";
import SecurityShield from "@/components/home/SecurityShield";
import BalanceCard from "@/components/home/BalanceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, Briefcase, TrendingUp, Sparkles, RefreshCw, Brain, Clock, BarChart3, Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  calculateAssetValue, 
  formatAssetValue, 
  generateValueTips,
  calculateDataFreshness,
  type AssetValueBreakdown 
} from "@/utils/assetValueCalculator";

interface HomeTabProps {
  onStartVerification?: () => void;
  onOpenUnifiedPortfolio?: () => void;
}

const HomeTab = ({ onStartVerification, onOpenUnifiedPortfolio }: HomeTabProps) => {
  const [assetBreakdown, setAssetBreakdown] = useState<AssetValueBreakdown | null>(null);
  const [previousValue, setPreviousValue] = useState<number | undefined>(undefined);

  // Auth 상태
  const { user } = useAuth();

  // 1. 실시간 프로필 데이터 가져오기 (5W1H 분석 포함)
  const { 
    profile, 
    isLoading: isProfileLoading, 
    refetch: refetchProfile,
    isRealtimeConnected,
    analyze5W1H
  } = useRealtimeProfile(user?.id);

  // 2. 카테고리 가치 데이터 가져오기
  const { data: categoryValues } = useQuery({
    queryKey: ['category-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_category_values')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // 3. 최근 인증 이력 가져오기 (점수 변화량)
  const { data: recentVerification } = useQuery({
    queryKey: ['recent-verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('verification_history')
        .select('score_change')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { score_change: number | null } | null;
    },
    enabled: !!user?.id
  });

  // 4. 자산 가치 계산
  useEffect(() => {
    if (profile) {
      const breakdown = calculateAssetValue(
        {
          profile: {
            is_verified: profile.is_verified,
            profile_completeness: profile.profile_completeness,
            data_last_updated: profile.data_last_updated,
            trust_score: profile.trust_score,
            data_categories: profile.data_categories,
          },
          categoryValues: categoryValues || [],
        },
        previousValue
      );
      
      // 이전 값 저장 (변화량 계산용)
      if (assetBreakdown) {
        setPreviousValue(assetBreakdown.totalValue);
      }
      
      setAssetBreakdown(breakdown);
    }
  }, [profile, categoryValues]);

  // 5. 비즈니스 로직 적용
  const isVerified = profile?.is_verified ?? false;
  const trustScore = isVerified ? (profile?.trust_score ?? 85) : 0;
  const securityLevel = isVerified ? (profile?.security_level ?? 0) : 0;
  const vnBalance = profile?.vn_balance ?? 0;
  const lockedBalance = profile?.locked_balance ?? 0;
  const scoreChange = isVerified ? (recentVerification?.score_change ?? 0) : 0;

  // 데이터 신선도 체크
  const freshness = calculateDataFreshness(profile?.data_last_updated || null);
  const isDataStale = freshness < 70;

  // 백분위 계산 로직
  const calculatePercentile = (score: number) => {
    if (!isVerified) return 100;
    if (score >= 900) return 1;
    if (score >= 800) return 5;
    if (score >= 700) return 10;
    if (score >= 600) return 25;
    if (score >= 500) return 50;
    return 75;
  };

  // 데이터 갱신 핸들러 (5W1H 분석 트리거)
  const handleRefreshData = async () => {
    if (!user?.id) return;
    
    // 5W1H 분석 실행
    const result = await analyze5W1H("profile_update", {
      action: "data_refresh",
      timestamp: new Date().toISOString(),
    });
    
    if (!result) {
      // 분석 실패 시 기본 갱신만 수행
      await supabase
        .from('profiles')
        .update({ data_last_updated: new Date().toISOString() })
        .eq('id', user.id);
      
      refetchProfile();
    }
  };

  // 가치 향상 팁
  const valueTips = assetBreakdown ? generateValueTips(assetBreakdown) : [];

  // 로딩 중 화면
  if (isProfileLoading) {
    return (
      <div className="p-4 space-y-4 pb-24">
        <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-8 w-12 ml-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* 실시간 연결 상태 표시 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-end gap-2"
      >
        <div className={`flex items-center gap-1.5 text-xs ${
          isRealtimeConnected 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-muted-foreground'
        }`}>
          {isRealtimeConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>실시간 연동</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>연결 중...</span>
            </>
          )}
        </div>
      </motion.div>

      {/* A. VeriNode Security Shield */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SecurityShield 
          securityLevel={securityLevel}
          trustScore={trustScore}
          isLoading={isProfileLoading}
        />
      </motion.div>

      {/* B. 잔액 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <BalanceCard 
          totalBalance={vnBalance}
          lockedBalance={lockedBalance}
          isLoading={isProfileLoading}
        />
      </motion.div>

      {/* C. 데이터 자산 가치 카드 - NEW! */}
      {isVerified && assetBreakdown && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30 overflow-hidden relative">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-2xl" />
            
            <div className="relative">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-bold text-foreground">내 데이터 자산 가치</span>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                  {assetBreakdown.assetGrade.toUpperCase()}
                </Badge>
              </div>

              {/* 메인 가치 표시 */}
              <div className="mb-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {formatAssetValue(assetBreakdown.totalValue)}
                  </span>
                  {assetBreakdown.valueChange !== 0 && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center text-sm font-medium ${
                        assetBreakdown.valueChange > 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      <TrendingUp className={`w-4 h-4 mr-1 ${assetBreakdown.valueChange < 0 ? 'rotate-180' : ''}`} />
                      {assetBreakdown.valueChange > 0 ? '+' : ''}{formatAssetValue(assetBreakdown.valueChange)}
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  예상 월 수익: <span className="font-medium text-amber-600 dark:text-amber-400">{formatAssetValue(assetBreakdown.estimatedMonthlyPension)}</span>
                </p>
              </div>

              {/* 구성 요소 미니 차트 */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-background/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">신선도</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{assetBreakdown.factors.freshness}%</div>
                </div>
                <div className="text-center p-2 bg-background/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">완성도</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{assetBreakdown.factors.completeness}%</div>
                </div>
                <div className="text-center p-2 bg-background/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">수요</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{assetBreakdown.factors.marketDemand}%</div>
                </div>
                <div className="text-center p-2 bg-background/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">신뢰</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{assetBreakdown.confidenceIndex}%</div>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">다음 등급까지</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">{assetBreakdown.progressToNextGrade}%</span>
                </div>
                <div className="h-2 bg-amber-200/50 dark:bg-amber-800/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${assetBreakdown.progressToNextGrade}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* D. AI Data Insight 섹션 - NEW! */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-bold text-foreground">AI Data Insight</span>
            <Badge variant="outline" className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
              <Sparkles className="w-3 h-3 mr-1" />
              실시간 분석
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              유저의 활동 패턴<span className="text-blue-600 dark:text-blue-400">(Who/When/Where)</span>을 분석하여 데이터 가치를 산정 중입니다.
            </p>

            {assetBreakdown && assetBreakdown.categoryBreakdown.length > 0 && (
              <div className="bg-background/50 rounded-lg p-3 space-y-2">
                <div className="text-xs text-muted-foreground">카테고리별 가치 기여도</div>
                {assetBreakdown.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="text-sm">{cat.name}</span>
                    <div className="flex-1 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.contribution}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{cat.contribution}%</span>
                  </div>
                ))}
              </div>
            )}

            {valueTips.length > 0 && (
              <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg p-2">
                {valueTips[0]}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* E. 데이터 신선도 경고 */}
      {isDataStale && isVerified && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <Clock className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-orange-900 dark:text-orange-100 font-bold text-sm">데이터 신선도가 떨어지고 있습니다</p>
              <p className="text-orange-700 dark:text-orange-300 text-xs mt-1">
                지금 갱신하여 가치를 높이세요! 현재 신선도: {freshness}%
              </p>
              <Button 
                onClick={handleRefreshData}
                size="sm" 
                variant="outline"
                className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                지금 갱신하기
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* F. 미인증 사용자용 안내 배너 */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-4 rounded-2xl shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 space-y-2">
              <p className="text-blue-900 dark:text-blue-100 font-bold text-sm">실제 존재를 증명하세요</p>
              <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                현재 데이터 등급이 0점으로 제한되어 있습니다.<br />
                인증을 완료하면 즉시 신뢰 점수와 보상이 활성화됩니다.
              </p>
              {onStartVerification && (
                <Button 
                  onClick={onStartVerification}
                  size="sm"
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  지금 인증하기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* G. 종합 포트폴리오 진입 카드 */}
      {isVerified && onOpenUnifiedPortfolio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <button
            onClick={onOpenUnifiedPortfolio}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">종합 데이터 포트폴리오</p>
                  <p className="text-xs opacity-80">금융 + 정부 마이데이터 통합 분석</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      )}

      {/* H. 신뢰 점수 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <TrustScoreCard 
          score={trustScore} 
          change={scoreChange} 
          percentile={calculatePercentile(trustScore)}
          isVerified={isVerified}
        />
      </motion.div>

      {/* I. 신뢰도 강화 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <CredibilityCard />
      </motion.div>

      {/* J. 수익 현황 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <EarningsCard 
          amount={vnBalance} 
          monthlyChange={assetBreakdown?.valueChangePercent || 0}
          totalEarnings={vnBalance}
        />
      </motion.div>
    </div>
  );
};

export default HomeTab;
