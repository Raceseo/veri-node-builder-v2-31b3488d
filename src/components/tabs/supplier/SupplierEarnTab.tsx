import { useState } from "react";
import { Coins, Clock, CheckCircle2, Gift, TrendingUp, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import RollingNumber from "@/components/animations/RollingNumber";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSurveys } from "@/hooks/useActiveSurveys";

interface SupplierEarnTabProps {
  trustScore?: number;
  isVerified?: boolean;
  /** 구간②: 실제 설문 카드 클릭 시 해당 surveyId 로 DB 설문 모드 진입 */
  onStartSurvey?: (surveyId: string) => void;
  onEarnPoints?: (points: number) => void;
}

const SupplierEarnTab = ({
  trustScore = 75,
  isVerified = false,
  onStartSurvey,
  onEarnPoints,
}: SupplierEarnTabProps) => {
  const { user } = useAuth();
  const { data: surveys = [], isLoading: surveysLoading } = useActiveSurveys(user?.id);

  // 오늘 적립한 수익: F-2에서 transactions 실값 연결 예정. 현재는 로컬 state 유지(초기 0).
  const [earnedToday, setEarnedToday] = useState(0);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [lastReward, setLastReward] = useState(0);

  const simulateEarn = (amount: number) => {
    setLastReward(amount);
    setShowRewardAnimation(true);
    setEarnedToday(prev => prev + amount);
    onEarnPoints?.(amount);
    setTimeout(() => setShowRewardAnimation(false), 2000);
  };

  return (
    <div className="p-4 space-y-5 relative">
      {/* 보상 애니메이션 */}
      <AnimatePresence>
        {showRewardAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gold text-navy px-8 py-6 rounded-3xl shadow-2xl">
              <div className="text-center">
                <Coins className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                <p className="text-3xl font-bold">
                  +<RollingNumber value={lastReward} duration={0.8} />
                </p>
                <p className="text-sm font-medium">VN 적립!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 오늘의 수익 요약 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-5 bg-gradient-to-br from-gold/10 via-background to-gold/5 border-gold/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">오늘 적립한 수익</p>
                <p className="text-2xl font-bold text-foreground">
                  <RollingNumber value={earnedToday} suffix=" VN" />
                </p>
              </div>
            </div>
            <Badge className="bg-success/20 text-success border-success/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              활성
            </Badge>
          </div>
        </Card>
      </motion.div>

      {/* 설문 카드 섹션 — 실제 DB active 설문 (구간②) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            참여 가능한 설문
          </h2>
          <Badge variant="secondary" className="text-xs">
            {surveys.length}개
          </Badge>
        </div>

        {surveysLoading ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            설문을 불러오는 중...
          </Card>
        ) : surveys.length === 0 ? (
          <Card className="p-8 text-center">
            <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground mb-1">지금은 참여 가능한 설문이 없어요</p>
            <p className="text-xs text-muted-foreground">새로운 설문이 등록되면 여기에서 바로 참여할 수 있어요.</p>
          </Card>
        ) : (
          surveys.map((survey, index) => {
            // 조건①: 문항당 15초, 올림 (목표 3분 설문 기준)
            const estMinutes = Math.max(1, Math.ceil(survey.questionCount * 0.25));
            return (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-4 transition-all border-border ${
                    survey.claimed ? 'opacity-60' : 'cursor-pointer hover:shadow-lg'
                  }`}
                  onClick={() => { if (!survey.claimed) onStartSurvey?.(survey.id); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {survey.claimed && (
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-1.5 py-0">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                            참여 완료
                          </Badge>
                        </div>
                      )}
                      <h3 className="font-semibold text-foreground">{survey.title}</h3>
                      {survey.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{survey.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          약 {estMinutes}분
                        </span>
                        <span>{survey.questionCount}문항</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">
                        +{survey.reward_vn.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">VN</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={survey.claimed}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!survey.claimed) onStartSurvey?.(survey.id);
                    }}
                  >
                    {survey.claimed ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" />참여 완료</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" />시작하기</>
                    )}
                  </Button>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SupplierEarnTab;
