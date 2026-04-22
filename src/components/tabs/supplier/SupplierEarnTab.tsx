import { useState, useEffect } from "react";
import { 
  Coins, ChevronRight, Clock, Zap, CheckCircle2, 
  Gift, Star, TrendingUp, Sparkles, Play, Link2,
  Linkedin, Twitter, Youtube, Facebook
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import RollingNumber from "@/components/animations/RollingNumber";
import SNSLinkageSheet, { SNSData } from "@/components/sheets/SNSLinkageSheet";

interface SupplierEarnTabProps {
  trustScore?: number;
  isVerified?: boolean;
  onStartSurvey?: () => void;
  onEarnPoints?: (points: number) => void;
}

interface SurveyItem {
  id: string;
  title: string;
  reward: number;
  duration: string;
  category: string;
  urgency: 'normal' | 'urgent' | 'premium';
  progress?: number;
  totalQuestions?: number;
}

interface DataConnectionItem {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  monthlyRevenue: number;
  lastSync?: string;
}

interface SNSPlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  monthlyVN: number;
}

const mockSurveys: SurveyItem[] = [
  {
    id: "1",
    title: "2024 소비 패턴 조사",
    reward: 3500,
    duration: "3분",
    category: "소비",
    urgency: "urgent",
    totalQuestions: 8,
  },
  {
    id: "2", 
    title: "디지털 서비스 만족도",
    reward: 2000,
    duration: "2분",
    category: "IT",
    urgency: "normal",
    totalQuestions: 5,
  },
  {
    id: "3",
    title: "금융 투자 성향 분석",
    reward: 5000,
    duration: "5분",
    category: "금융",
    urgency: "premium",
    totalQuestions: 12,
  },
];

const dataConnections: DataConnectionItem[] = [
  { id: "bank", name: "은행 계좌", icon: "🏦", connected: true, monthlyRevenue: 15000 },
  { id: "card", name: "카드 내역", icon: "💳", connected: true, monthlyRevenue: 12000 },
  { id: "telecom", name: "통신 데이터", icon: "📱", connected: false, monthlyRevenue: 8000 },
  { id: "health", name: "건강 데이터", icon: "❤️", connected: false, monthlyRevenue: 10000 },
  { id: "location", name: "위치 데이터", icon: "📍", connected: true, monthlyRevenue: 5000 },
];

const SupplierEarnTab = ({
  trustScore = 75,
  isVerified = false,
  onStartSurvey,
  onEarnPoints,
}: SupplierEarnTabProps) => {
  const [earnedToday, setEarnedToday] = useState(0);
  const [connections, setConnections] = useState(dataConnections);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [lastReward, setLastReward] = useState(0);
  
  // SNS 연동 상태
  const [linkedSNS, setLinkedSNS] = useState<SNSData[]>([]);
  const [isSNSSheetOpen, setIsSNSSheetOpen] = useState(false);

  // SNS 플랫폼 설정
  const snsPlatforms: SNSPlatformConfig[] = [
    { name: "LinkedIn", icon: <Linkedin className="w-4 h-4" />, color: "bg-[#0077B5]", monthlyVN: 5000 },
    { name: "Twitter", icon: <Twitter className="w-4 h-4" />, color: "bg-[#1DA1F2]", monthlyVN: 3000 },
    { name: "YouTube", icon: <Youtube className="w-4 h-4" />, color: "bg-[#FF0000]", monthlyVN: 4000 },
    { name: "Instagram", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>, color: "bg-gradient-to-br from-[#FCAF45] via-[#E4405F] to-[#833AB4]", monthlyVN: 3000 },
    { name: "TikTok", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>, color: "bg-black", monthlyVN: 3500 },
    { name: "Facebook", icon: <Facebook className="w-4 h-4" />, color: "bg-[#1877F2]", monthlyVN: 2500 },
  ];

  const totalSNSRevenue = linkedSNS.reduce((acc, s) => {
    const platform = snsPlatforms.find(p => p.name === s.platform);
    return acc + (platform?.monthlyVN || 0);
  }, 0);

  const handleSNSLink = (snsData: SNSData) => {
    setLinkedSNS(prev => {
      const existing = prev.findIndex(s => s.platform === snsData.platform);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = snsData;
        return updated;
      }
      return [...prev, snsData];
    });
  };

  const totalMonthlyRevenue = connections
    .filter(c => c.connected)
    .reduce((acc, c) => acc + c.monthlyRevenue, 0);

  const handleToggleConnection = (id: string) => {
    setConnections(prev => 
      prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c)
    );
  };

  const handleStartSurvey = (survey: SurveyItem) => {
    onStartSurvey?.();
  };

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
          <div className="flex items-center justify-between mb-4">
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>예상 월 수익: {totalMonthlyRevenue.toLocaleString()} VN</span>
          </div>
        </Card>
      </motion.div>

      {/* 설문 카드 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            참여 가능한 설문
          </h2>
          <Badge variant="secondary" className="text-xs">
            {mockSurveys.length}개
          </Badge>
        </div>

        {mockSurveys.map((survey, index) => (
          <motion.div
            key={survey.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                survey.urgency === 'urgent' 
                  ? 'border-destructive/50 bg-destructive/5' 
                  : survey.urgency === 'premium'
                  ? 'border-gold/50 bg-gold/5'
                  : 'border-border'
              }`}
              onClick={() => handleStartSurvey(survey)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {survey.urgency === 'urgent' && (
                      <Badge className="bg-destructive text-white text-[10px] px-1.5 py-0">
                        <Zap className="w-2.5 h-2.5 mr-0.5" />
                        긴급
                      </Badge>
                    )}
                    {survey.urgency === 'premium' && (
                      <Badge className="bg-gold text-navy text-[10px] px-1.5 py-0">
                        <Star className="w-2.5 h-2.5 mr-0.5" />
                        프리미엄
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {survey.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground">{survey.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {survey.duration}
                    </span>
                    <span>{survey.totalQuestions}문항</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-gold">
                    +{survey.reward.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">VN</p>
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartSurvey(survey);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                시작하기
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* SNS 연동 보너스 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            SNS 연동 보너스
          </h2>
          <Badge variant="secondary" className="text-xs">
            {linkedSNS.length}/6개
          </Badge>
        </div>

        <Card className="p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
          {/* 연동 현황 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">월 예상 수익</p>
              <p className="text-xl font-bold text-primary">
                +{totalSNSRevenue.toLocaleString()} VN
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">신뢰도 보너스</p>
              <p className="text-sm font-semibold text-success">+{linkedSNS.length * 5}점</p>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="mb-4">
            <Progress 
              value={(linkedSNS.length / 6) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {6 - linkedSNS.length}개 더 연동하면 최대 혜택!
            </p>
          </div>

          {/* SNS 플랫폼 그리드 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {snsPlatforms.map((platform) => {
              const isLinked = linkedSNS.some(s => s.platform === platform.name);
              return (
                <button
                  key={platform.name}
                  onClick={() => !isLinked && setIsSNSSheetOpen(true)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isLinked 
                      ? 'bg-success/10 border border-success/30'
                      : 'bg-muted/50 border border-transparent hover:border-primary/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center mx-auto mb-1.5 text-white`}>
                    {platform.icon}
                  </div>
                  <p className="text-[10px] font-medium text-foreground truncate">
                    {platform.name}
                  </p>
                  <p className={`text-[10px] ${isLinked ? 'text-success' : 'text-muted-foreground'}`}>
                    {isLinked ? '✓ 연동됨' : `+${(platform.monthlyVN/1000).toFixed(0)}K`}
                  </p>
                </button>
              );
            })}
          </div>

          {/* CTA 버튼 */}
          {linkedSNS.length < 6 && (
            <Button
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setIsSNSSheetOpen(true)}
            >
              <Link2 className="w-4 h-4 mr-2" />
              SNS 계정 연동하기
            </Button>
          )}

          {/* 안내 문구 */}
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            💡 SNS 연동은 선택사항이며, 연동된 데이터만 수익화됩니다
          </p>
        </Card>
      </motion.div>

      {/* 자동 연동 데이터 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-success" />
            자동 연동 수익
          </h2>
        </div>

        <Card className="divide-y divide-border">
          {connections.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <div className="flex items-center gap-2">
                    {item.connected ? (
                      <Badge className="bg-success/20 text-success border-0 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        자동 수익 발생 중
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        연결하면 월 {item.monthlyRevenue.toLocaleString()} VN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.connected && (
                  <span className="text-sm font-semibold text-success">
                    +{item.monthlyRevenue.toLocaleString()}
                  </span>
                )}
                <Switch 
                  checked={item.connected}
                  onCheckedChange={() => handleToggleConnection(item.id)}
                />
              </div>
            </div>
          ))}
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          연결된 데이터는 안전하게 암호화되어 익명으로만 활용됩니다
        </p>
      </div>

      {/* SNS Linkage Sheet */}
      <SNSLinkageSheet
        open={isSNSSheetOpen}
        onOpenChange={setIsSNSSheetOpen}
        onLink={handleSNSLink}
      />
    </div>
  );
};

export default SupplierEarnTab;
