import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Crown, 
  Shield, 
  Lock, 
  BarChart3, 
  FileText,
  Banknote,
  ChevronRight,
  Award,
  Sparkles,
  Download
} from "lucide-react";

interface PartnerRevenueDashboardProps {
  onBack: () => void;
}

const dataRankings = [
  { rank: 1, category: "4분기 스마트폰 매출 지표", requests: 1248, revenue: 4500000, growth: 23 },
  { rank: 2, category: "소비자 구매 패턴 분석", requests: 987, revenue: 3200000, growth: 15 },
  { rank: 3, category: "신제품 반응 데이터", requests: 756, revenue: 2800000, growth: 31 },
  { rank: 4, category: "지역별 시장 점유율", requests: 543, revenue: 1900000, growth: -5 },
  { rank: 5, category: "경쟁사 비교 인사이트", requests: 421, revenue: 1500000, growth: 12 },
];

const securityStats = [
  { label: "익명화 처리 데이터", value: "12,847건", icon: Shield },
  { label: "보호된 기밀 정보", value: "3,421건", icon: Lock },
  { label: "차단된 위협 시도", value: "0건", icon: Shield },
  { label: "규정 준수율", value: "100%", icon: Award },
];

const PartnerRevenueDashboard = ({ onBack }: PartnerRevenueDashboardProps) => {
  const [rewardType, setRewardType] = useState<"cash" | "report">("cash");
  const [autoConvert, setAutoConvert] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-background pb-8">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-navy to-navy/90 text-primary-foreground p-6 border-b border-gold/20">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              <h1 className="text-xl font-bold">파트너 보상 센터</h1>
            </div>
            <p className="text-sm opacity-80">Enterprise Revenue Dashboard</p>
          </div>
          <Badge className="bg-gold/20 text-gold border-gold/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gold/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-gold" />
              </div>
              <div className="text-2xl font-bold text-primary-foreground">₩24.5M</div>
              <div className="text-xs text-primary-foreground/70">이번 달 누적</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-success/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <div className="text-2xl font-bold text-primary-foreground">₩18.2M</div>
              <div className="text-xs text-primary-foreground/70">정산 가능</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-trust/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-trust" />
              </div>
              <div className="text-2xl font-bold text-primary-foreground">₩294M</div>
              <div className="text-xs text-primary-foreground/70">예상 연간</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Data Value Rankings */}
        <Card className="border-gold/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gold" />
              데이터 가치 랭킹
              <Badge variant="outline" className="border-gold/30 text-gold text-xs ml-auto">
                실시간
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataRankings.map((item) => (
              <div 
                key={item.rank}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-navy/10 to-transparent border border-border/50 hover:border-gold/30 transition-all"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  item.rank === 1 ? 'bg-gold text-navy' :
                  item.rank === 2 ? 'bg-muted-foreground/50 text-foreground' :
                  item.rank === 3 ? 'bg-warning/50 text-warning-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{item.category}</div>
                  <div className="text-xs text-muted-foreground">요청 {item.requests.toLocaleString()}건</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground text-sm">{formatCurrency(item.revenue)}</div>
                  <div className={`text-xs flex items-center justify-end gap-1 ${item.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    <TrendingUp className={`h-3 w-3 ${item.growth < 0 ? 'rotate-180' : ''}`} />
                    {item.growth >= 0 ? '+' : ''}{item.growth}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Incentive Conversion Section */}
        <Card className="border-gold/20 bg-gradient-to-br from-navy/10 to-gold/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              인센티브 전환
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              정산 가능한 수익을 원하시는 형태로 전환하세요.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRewardType("cash")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  rewardType === "cash" 
                    ? 'border-gold bg-gold/10' 
                    : 'border-border bg-card hover:border-gold/50'
                }`}
              >
                <Banknote className={`h-8 w-8 mx-auto mb-2 ${rewardType === "cash" ? 'text-gold' : 'text-muted-foreground'}`} />
                <div className={`font-medium text-sm ${rewardType === "cash" ? 'text-gold' : 'text-foreground'}`}>
                  현금 정산
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  계좌로 직접 입금
                </div>
              </button>
              
              <button
                onClick={() => setRewardType("report")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  rewardType === "report" 
                    ? 'border-gold bg-gold/10' 
                    : 'border-border bg-card hover:border-gold/50'
                }`}
              >
                <FileText className={`h-8 w-8 mx-auto mb-2 ${rewardType === "report" ? 'text-gold' : 'text-muted-foreground'}`} />
                <div className={`font-medium text-sm ${rewardType === "report" ? 'text-gold' : 'text-foreground'}`}>
                  프리미엄 리포트
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  시장 분석 리포트로 교환
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-navy/10 border border-gold/20">
              <div>
                <div className="font-medium text-foreground">자동 전환 활성화</div>
                <div className="text-xs text-muted-foreground">매월 1일 자동 정산</div>
              </div>
              <Switch checked={autoConvert} onCheckedChange={setAutoConvert} />
            </div>

            <Button variant="gold" className="w-full" size="lg">
              <Crown className="h-4 w-4 mr-2" />
              ₩18,200,000 전환 신청
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Security History */}
        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-trust/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              보안 히스토리
              <Badge variant="outline" className="border-success/30 text-success text-xs ml-auto">
                AI Anonymizer
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {securityStats.map((stat, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-card border border-border/50 text-center"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-success/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-success" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-success">보안 등급: 최상위</div>
                  <div className="text-sm text-foreground/80">
                    귀사의 모든 기밀 정보가 완벽하게 보호되고 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-sm">정산 내역 보기</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Download className="h-5 w-5" />
            <span className="text-sm">리포트 다운로드</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerRevenueDashboard;
