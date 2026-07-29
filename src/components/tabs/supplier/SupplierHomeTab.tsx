import { useNavigate } from "react-router-dom";
import {
  Shield, TrendingUp, ChevronRight, Sparkles,
  PiggyBank, Upload
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useProfileContext } from "@/contexts/ProfileContext";

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
    trustScore: contextTrustScore,
    vnBalance: contextVnBalance,
    displayName: contextDisplayName,
    isVerified: contextIsVerified,
  } = useProfileContext();

  // Props 우선, 없으면 Context 사용
  const trustScore = propTrustScore ?? contextTrustScore;
  const vnBalance = propVnBalance ?? contextVnBalance;
  const displayName = propDisplayName ?? contextDisplayName;
  const isVerified = propIsVerified ?? contextIsVerified;

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* VN 잔액 카드 (VN 자산 + VN 잔액 통합) */}
        <Card className="p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">VN 잔액</span>
            </div>
            {isVerified && (
              <Badge variant="secondary" className={`${grade.bg} ${grade.color} border-0`}>
                {grade.label}등급
              </Badge>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{formatCurrency(vnBalance)}</span>
              <span className="text-sm text-muted-foreground">VN</span>
            </div>
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

        {/* 🚀 데이터 공급하기 (주 CTA) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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

      </motion.div>
    </div>
  );
};

export default SupplierHomeTab;
