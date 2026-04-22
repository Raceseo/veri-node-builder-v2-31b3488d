import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, TrendingUp, Zap, ChevronRight, Sparkles,
  PiggyBank, CheckCircle2, ArrowRight, Lock, ShieldCheck, Brain, AlertTriangle, RefreshCw, Upload
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import RollingNumber from "@/components/animations/RollingNumber";
import { useProfileContext } from "@/contexts/ProfileContext";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplierHomeTabProps {
  trustScore?: number;
  vnBalance?: number;
  displayName?: string;
  isVerified?: boolean;
  onStartVerification?: () => void;
  onOpenPortfolio?: () => void;
}

const SupplierHomeTab = ({
  trustScore: propTrustScore,
  vnBalance: propVnBalance,
  displayName: propDisplayName,
  isVerified: propIsVerified,
  onStartVerification,
  onOpenPortfolio,
}: SupplierHomeTabProps) => {
  const navigate = useNavigate();
  
  // ProfileContext에서 데이터 가져오기 (전역 상태 활용)
  const { 
    profile, 
    isLoading, 
    trustScore: contextTrustScore, 
    vnBalance: contextVnBalance,
    displayName: contextDisplayName,
    isVerified: contextIsVerified
  } = useProfileContext();
  
  // Props 우선, 없으면 Context 사용
  const trustScore = propTrustScore ?? contextTrustScore;
  const vnBalance = propVnBalance ?? contextVnBalance;
  const displayName = propDisplayName ?? contextDisplayName;
  const isVerified = propIsVerified ?? contextIsVerified;
  const dataLastUpdated = profile?.data_last_updated;
  
  // 데이터 신선도 체크 (24시간)
  const isDataStale = dataLastUpdated 
    ? (Date.now() - new Date(dataLastUpdated).getTime()) > 24 * 60 * 60 * 1000
    : true;

  const [totalAssetValue, setTotalAssetValue] = useState(vnBalance * 10 || 2847320);
  const [previousAssetValue, setPreviousAssetValue] = useState(totalAssetValue);
  const valueChange = totalAssetValue - previousAssetValue;

  // 실시간 자산 가치 업데이트 (DB 연동 시뮬레이션)
  useEffect(() => {
    if (vnBalance > 0) {
      setTotalAssetValue(vnBalance * 10);
    }
  }, [vnBalance]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousAssetValue(totalAssetValue);
      setTotalAssetValue(prev => prev + Math.floor(Math.random() * 100 - 30));
    }, 5000);
    return () => clearInterval(interval);
  }, [totalAssetValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { label: "S", color: "text-amber-500", bg: "bg-amber-500/10" };
    if (score >= 80) return { label: "A", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (score >= 70) return { label: "B", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (score >= 60) return { label: "C", color: "text-slate-500", bg: "bg-slate-500/10" };
    return { label: "D", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const grade = getGrade(trustScore);

  return (
    <div className="p-4 space-y-4">
      {/* Welcome & Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* 🛡️ 보호 중인 나의 데이터 자산 가치 - NEW */}
        <Card className="p-4 bg-gradient-to-br from-[#1e3a5f] via-[#0f2744] to-[#1e3a5f] border-[#c9a227]/30 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ShieldCheck className="w-5 h-5 text-[#c9a227]" />
              </motion.div>
              <span className="text-sm font-medium text-slate-300">보호 중인 나의 데이터 자산</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Lock className="w-3 h-3 mr-1" />
              보안 Lv.3 안전
            </Badge>
          </div>
          
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#c9a227]">
                <RollingNumber value={totalAssetValue} />
              </span>
              <span className="text-sm text-slate-400">원</span>
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3" />
              군사급 암호화로 안전하게 보호됨
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-slate-800/50 rounded-lg">
              <p className="text-lg font-bold text-white">12</p>
              <p className="text-[10px] text-slate-400">연결 데이터</p>
            </div>
            <div className="text-center p-2 bg-[#c9a227]/10 rounded-lg">
              <p className="text-lg font-bold text-[#c9a227]">{trustScore}</p>
              <p className="text-[10px] text-slate-400">신뢰점수</p>
            </div>
            <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
              <p className="text-lg font-bold text-emerald-400">A+</p>
              <p className="text-[10px] text-slate-400">보안등급</p>
            </div>
          </div>

          {/* 🚀 데이터 공급하기 버튼 - NEW */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-3"
          >
            <Button 
              onClick={() => navigate('/security-engine')}
              className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:from-blue-700 hover:via-blue-600 hover:to-emerald-600 text-white font-bold text-base shadow-lg shadow-blue-500/30"
            >
              <Upload className="w-5 h-5 mr-2" />
              데이터 공급하기
              <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
            </Button>
          </motion.div>

          <Button 
            onClick={onOpenPortfolio}
            variant="outline"
            className="w-full border-[#c9a227]/50 text-[#c9a227] hover:bg-[#c9a227]/10"
          >
            자산 상세 보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>

        {/* 🧠 AI Data Insight 섹션 - NEW */}
        <Card className="p-4 bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 border-[#c9a227]/20">
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            >
              <Brain className="w-4 h-4 text-[#c9a227]" />
            </motion.div>
            <span className="text-sm font-semibold text-[#c9a227]">AI Data Insight</span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] ml-auto">
              5W1H 분석
            </Badge>
          </div>
          
          <p className="text-xs text-slate-400 mb-3">
            유저의 활동 패턴(Who/When/Where)을 분석하여 데이터 가치를 산정 중입니다...
          </p>
          
          {valueChange !== 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 p-2 rounded-lg ${valueChange > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}
            >
              <TrendingUp className={`w-4 h-4 ${valueChange > 0 ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
              <span className={`text-sm font-bold ${valueChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {valueChange > 0 ? '+' : ''}{valueChange.toLocaleString()}원
              </span>
              <span className="text-xs text-slate-500">실시간 가치 변동</span>
            </motion.div>
          )}
        </Card>

        {/* ⚠️ 데이터 신선도 경고 - NEW */}
        {isDataStale && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-3 bg-amber-500/10 border-amber-500/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-400">데이터 신선도가 떨어지고 있습니다</p>
                  <p className="text-[10px] text-slate-400">지금 갱신하여 가치를 높이세요!</p>
                </div>
                <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  갱신
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Asset Value Card - Original */}
        <Card className="p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">VN 자산</span>
            </div>
            <Badge variant="secondary" className={`${grade.bg} ${grade.color} border-0`}>
              {grade.label}등급
            </Badge>
          </div>
          
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                <RollingNumber value={totalAssetValue} />
              </span>
              <span className="text-sm text-muted-foreground">원</span>
            </div>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              예상 월 수익 42,000원
            </p>
          </div>

          <Button 
            onClick={onOpenPortfolio}
            variant="outline" 
            className="w-full justify-between"
          >
            자산 상세 보기
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Card>

        {/* VN Balance Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">VN 잔액</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(vnBalance)} <span className="text-sm font-normal">VN</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">신뢰점수</p>
              <p className="text-xl font-bold text-primary">{trustScore}점</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Verification Action */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Card 
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={onStartVerification}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI 인증</p>
                  <p className="text-xs text-muted-foreground">신뢰점수 올리기</p>
                </div>
              </div>
              {!isVerified && (
                <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                  <Sparkles className="w-3 h-3" />
                  +15점 보상
                </div>
              )}
            </Card>
          </motion.div>

          {/* Portfolio Action */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Card 
              className="p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
              onClick={onOpenPortfolio}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">포트폴리오</p>
                  <p className="text-xs text-muted-foreground">자산 분석</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Onboarding Progress (for new users) */}
        {trustScore < 30 && (
          <Card className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-foreground">시작하기</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">데이터 가치 활성화</span>
                <span className="text-amber-600 font-medium">1/3 완료</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-muted-foreground">계정 생성 완료</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500" />
                <span className="text-foreground font-medium">첫 인증 완료하기</span>
                <ArrowRight className="w-3 h-3 text-amber-500" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />
                <span className="text-muted-foreground">데이터 연결하기</span>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default SupplierHomeTab;
