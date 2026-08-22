import {
  Shield, ChevronRight, Sparkles,
  PiggyBank, Coins
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
  onOpenWallet?: () => void;   // VN 잔액 카드 탭 → 내 지갑 탭 (포트폴리오 진입 숨김, B-36)
  onGoToEarn?: () => void;     // 홈 주 CTA → 수익 쌓기 탭(설문 목록). 탭 전환은 부모(SupplierLayout)가 수행
}

const SupplierHomeTab = ({
  trustScore: propTrustScore,
  vnBalance: propVnBalance,
  displayName: propDisplayName,
  isVerified: propIsVerified,
  onStartVerification,
  onOpenWallet,
  onGoToEarn,
}: SupplierHomeTabProps) => {
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
    <div className="p-4 space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* VN 잔액 카드 — 한 줄 압축. 카드 전체 탭 → 내 지갑 탭 (B-36: 포트폴리오 진입 숨김) */}
        <Card
          onClick={onOpenWallet}
          className="p-3 bg-slate-50 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground shrink-0">VN 잔액</span>
              <span className="text-xl font-bold text-foreground leading-none">{formatCurrency(vnBalance)}</span>
              <span className="text-xs text-muted-foreground shrink-0">VN</span>
              {isVerified && (
                <Badge variant="secondary" className={`${grade.bg} ${grade.color} border-0 shrink-0`}>
                  {grade.label}등급
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-0.5 text-sm text-muted-foreground shrink-0">
              자산 상세
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Card>

        {/* 🎯 설문 참여 (주 CTA) — 1호 상품(설문 거래) 동선. 클릭 시 수익 쌓기 탭(설문 목록)으로 전환.
            기존 "데이터 공급하기"의 주 CTA 스타일을 그대로 물려받는다. */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onGoToEarn}
            className="w-full h-14 rounded-md bg-trust hover:bg-trust-dark text-white font-medium text-base shadow-lg shadow-trust/20"
          >
            <Coins className="w-5 h-5 mr-2" />
            설문 참여하고 VN 받기
            <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
          </Button>
        </motion.div>

        {/* 2026-08-22 — 「데이터 공급하기」 버튼을 제거했다(→ /security-engine).
            도착 화면 SecurityEngineDashboard 의 logs 가 useState 로컬 상태라
            제출해도 새로고침하면 기록이 사라진다. 문구로 고칠 수 있는 문제가 아니다.
            1호 상품은 설문이므로 지금 홈에서 이 동선을 열어둘 이유가 없다.
            라우트 /security-engine 은 남겨 직접 URL 로만 접근된다. 백로그 B-91.
            ※ 빈자리에 새 요소를 넣지 않았다 — 주 CTA 밑에 비슷한 크기의 보조
              버튼이 붙어 시선이 갈리던 구조였고, 빼는 것 자체가 목적이다. */}

        {/* Quick Action — 데이터 인증 (B-36: 포트폴리오 카드 제거로 전폭화) */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card
            className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={onStartVerification}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {/* B-25: "AI 인증" → AI 가 하는 일은 맞춤 질문 생성(verinode-ai
                    generate_contextual_questions)이지 인증 판정이 아니다.
                    "AI 가 인증한다"가 아니라 "AI 가 만든 질문으로 인증한다"가 실제. */}
                <p className="text-sm font-semibold text-foreground">데이터 인증</p>
                <p className="text-xs text-muted-foreground">설문으로 신뢰점수 올리기</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default SupplierHomeTab;
