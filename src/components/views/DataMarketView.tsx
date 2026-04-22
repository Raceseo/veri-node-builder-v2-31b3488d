import { useState } from "react";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Star,
  Eye,
  Download,
  Clock,
  Sparkles,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Lock,
  Coins,
  Building2,
  Plus,
  Vote,
  Landmark,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
// ReportDetailView removed - functionality integrated elsewhere

interface DataMarketViewProps {
  balance: number;
  onOpenCorporateRequest?: () => void;
  onOpenPoliticalSurvey?: () => void;
  onOpenPollMonitor?: () => void;
  onOpenSurveyHub?: () => void;
  onOpenDemoData?: () => void;
  onOpenDataQualityReport?: () => void;
  onOpenAnonymizedData?: () => void;
  onOpenPartnerRevenue?: () => void;
  onOpenPremiumMarketplace?: () => void;
  onOpenDemandMarketplace?: () => void;
}

interface DataReport {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  sampleSize: number;
  lastUpdated: string;
  icon: React.ElementType;
  trending?: boolean;
  premium?: boolean;
}

interface SelectedReport {
  id: string;
  title: string;
}

const categories = [
  { id: 'all', name: '전체', icon: BarChart3 },
  { id: 'consumer', name: '소비자', icon: ShoppingCart },
  { id: 'health', name: '건강', icon: Activity },
  { id: 'finance', name: '금융', icon: TrendingUp },
  { id: 'lifestyle', name: '라이프', icon: Target },
];

const reports: DataReport[] = [
  {
    id: '1',
    title: '2024 MZ세대 소비 트렌드 리포트',
    description: '20-35세 소비 패턴 및 브랜드 선호도 분석',
    category: 'consumer',
    price: 500,
    rating: 4.8,
    reviews: 128,
    sampleSize: 15420,
    lastUpdated: '2일 전',
    icon: ShoppingCart,
    trending: true
  },
  {
    id: '2',
    title: '직장인 건강관리 실태 조사',
    description: '30-50대 직장인 건강 습관 및 의료비 지출 분석',
    category: 'health',
    price: 750,
    rating: 4.6,
    reviews: 89,
    sampleSize: 8750,
    lastUpdated: '5일 전',
    icon: Activity,
    premium: true
  },
  {
    id: '3',
    title: '가계 금융 포트폴리오 분석',
    description: '소득 구간별 투자 성향 및 저축률 비교',
    category: 'finance',
    price: 1200,
    rating: 4.9,
    reviews: 256,
    sampleSize: 22100,
    lastUpdated: '1일 전',
    icon: TrendingUp,
    trending: true,
    premium: true
  },
  {
    id: '4',
    title: '주거 선호도 및 이동 패턴',
    description: '연령대별 주거 환경 선호 및 통근 시간 분석',
    category: 'lifestyle',
    price: 450,
    rating: 4.5,
    reviews: 67,
    sampleSize: 11200,
    lastUpdated: '1주 전',
    icon: Target
  },
  {
    id: '5',
    title: '온라인 쇼핑 행동 분석',
    description: '플랫폼별 구매 전환율 및 결제 수단 선호도',
    category: 'consumer',
    price: 650,
    rating: 4.7,
    reviews: 142,
    sampleSize: 18900,
    lastUpdated: '3일 전',
    icon: ShoppingCart
  },
  {
    id: '6',
    title: '스트레스 지수 및 정신건강 현황',
    description: '직업군별 스트레스 요인 및 대응 방식 분석',
    category: 'health',
    price: 800,
    rating: 4.4,
    reviews: 78,
    sampleSize: 9500,
    lastUpdated: '4일 전',
    icon: Activity
  }
];

export const DataMarketView = ({ balance, onOpenCorporateRequest, onOpenPoliticalSurvey, onOpenPollMonitor, onOpenSurveyHub, onOpenDemoData, onOpenDataQualityReport, onOpenAnonymizedData, onOpenPartnerRevenue, onOpenPremiumMarketplace, onOpenDemandMarketplace }: DataMarketViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<SelectedReport | null>(null);

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleViewReport = (report: DataReport) => {
    setSelectedReport({ id: report.id, title: report.title });
  };

  // ReportDetailView removed - show a simple placeholder instead
  if (selectedReport) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="text-white text-center mt-20">
          <h2 className="text-xl font-bold mb-2">{selectedReport.title}</h2>
          <p className="text-slate-400 mb-4">리포트 상세 보기 기능 준비 중</p>
          <Button onClick={() => setSelectedReport(null)} variant="outline">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        {/* Balance Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border border-teal-500/20 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-300/70 text-xs mb-1">사용 가능한 VN 토큰</p>
              <div className="flex items-baseline gap-2">
                <Coins className="w-5 h-5 text-teal-400" />
                <span className="text-2xl font-bold text-white">{balance.toLocaleString()}</span>
                <span className="text-teal-300/60 text-sm">VN</span>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl"
            >
              <Zap className="w-4 h-4 mr-1" />
              충전
            </Button>
          </div>
        </div>

        {/* Premium Marketplace Banner */}
        {onOpenPremiumMarketplace && (
          <button
            onClick={onOpenPremiumMarketplace}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-zinc-900/80 to-black/80 border border-amber-500/40 mb-4 flex items-center gap-4 hover:border-amber-400/60 transition-all group shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border border-amber-500/30 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-amber-400 text-sm">Premium Marketplace</p>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded">VIP</span>
              </div>
              <p className="text-xs text-zinc-400">AI Studio 인증 고품질 데이터셋 거래</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </button>
        )}

        {/* V-Core Demand Marketplace Banner */}
        {onOpenDemandMarketplace && (
          <button
            onClick={onOpenDemandMarketplace}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-blue-950/90 border border-blue-500/40 mb-4 flex items-center gap-4 hover:border-blue-400/60 transition-all group shadow-[0_0_25px_rgba(59,130,246,0.2)]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-blue-400 text-sm">V-Core Marketplace</p>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full">CERTIFIED</span>
              </div>
              <p className="text-xs text-slate-400">AI 검증 완료된 프리미엄 데이터셋 거래</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </div>
          </button>
        )}

        {/* Survey Request Hub Banner */}
        {onOpenSurveyHub && (
          <button
            onClick={onOpenSurveyHub}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/40 mb-4 flex items-center gap-4 hover:from-blue-600/40 hover:to-indigo-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/40 to-indigo-500/40 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">설문조사 의뢰 센터</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/30 text-blue-200 rounded">NEW</span>
              </div>
              <p className="text-xs text-blue-200/70">정치 여론조사, 기업 리서치 등 맞춤 설문을 의뢰하세요</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/50 transition-colors">
              <ChevronRight className="w-4 h-4 text-blue-200" />
            </div>
          </button>
        )}

        {/* Poll Monitor Dashboard Banner */}
        {onOpenPollMonitor && (
          <button
            onClick={onOpenPollMonitor}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-400/40 mb-4 flex items-center gap-4 hover:from-emerald-600/40 hover:to-teal-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/40 to-teal-500/40 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">실시간 여론조사 대시보드</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/30 text-red-200 rounded animate-pulse">LIVE</span>
              </div>
              <p className="text-xs text-emerald-200/70">응답률, 지역별 분포, 지지율 실시간 모니터링</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/50 transition-colors">
              <Activity className="w-4 h-4 text-emerald-200" />
            </div>
          </button>
        )}

        {/* Political Survey Request Banner */}
        {onOpenPoliticalSurvey && (
          <button
            onClick={onOpenPoliticalSurvey}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-400/40 mb-4 flex items-center gap-4 hover:from-indigo-600/40 hover:to-purple-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center">
              <Landmark className="w-6 h-6 text-indigo-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">정치 여론조사 의뢰</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/30 text-amber-200 rounded">HOT</span>
              </div>
              <p className="text-xs text-indigo-200/70">주소지 인증 기반 정확한 여론 데이터 수집</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/50 transition-colors">
              <Vote className="w-4 h-4 text-indigo-200" />
            </div>
          </button>
        )}

        {/* Corporate Request Banner */}
        {onOpenCorporateRequest && (
          <button
            onClick={onOpenCorporateRequest}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 mb-4 flex items-center gap-4 hover:from-blue-600/30 hover:to-indigo-600/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-sm">기업용 맞춤 설문 의뢰</p>
              <p className="text-xs text-blue-300/70">API 인증 데이터로 고품질 리서치를 진행하세요</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-300" />
            </div>
          </button>
        )}

        {/* Demo Data Dashboard Banner */}
        {onOpenDemoData && (
          <button
            onClick={onOpenDemoData}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/40 mb-4 flex items-center gap-4 hover:from-purple-600/40 hover:to-pink-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">데모 데이터 대시보드</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/30 text-purple-200 rounded">DEMO</span>
              </div>
              <p className="text-xs text-purple-200/70">30명의 데이터 제공자, 분류/판매 현황 시뮬레이션</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/50 transition-colors">
              <ChevronRight className="w-4 h-4 text-purple-200" />
            </div>
          </button>
        )}

        {/* Data Quality Report Banner */}
        {onOpenDataQualityReport && (
          <button
            onClick={onOpenDataQualityReport}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/40 mb-4 flex items-center gap-4 hover:from-cyan-600/40 hover:to-blue-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/40 to-blue-500/40 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-cyan-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">데이터 품질 리포트</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-cyan-500/30 text-cyan-200 rounded">REPORT</span>
              </div>
              <p className="text-xs text-cyan-200/70">자연인 인증률, AI 차단 이력, 생체인증 현황</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/50 transition-colors">
              <ChevronRight className="w-4 h-4 text-cyan-200" />
            </div>
          </button>
        )}

        {/* Anonymized Data View Banner */}
        {onOpenAnonymizedData && (
          <button
            onClick={onOpenAnonymizedData}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-600/30 to-zinc-600/30 border border-slate-400/40 mb-4 flex items-center gap-4 hover:from-slate-600/40 hover:to-zinc-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500/40 to-zinc-500/40 flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">익명화 데이터 조회</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-500/30 text-slate-200 rounded">MASKED</span>
              </div>
              <p className="text-xs text-slate-200/70">자연인 최상위 등급 인증된 익명화 데이터</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-500/30 flex items-center justify-center group-hover:bg-slate-500/50 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-200" />
            </div>
          </button>
        )}

        {/* Partner Revenue Dashboard Banner */}
        {onOpenPartnerRevenue && (
          <button
            onClick={onOpenPartnerRevenue}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border border-amber-400/40 mb-4 flex items-center gap-4 hover:from-amber-600/40 hover:to-yellow-600/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/40 to-yellow-500/40 flex items-center justify-center">
              <Coins className="w-6 h-6 text-amber-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">파트너 보상 센터</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/30 text-amber-200 rounded">PREMIUM</span>
              </div>
              <p className="text-xs text-amber-200/70">수익 현황, 데이터 랭킹, 인센티브 전환</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/50 transition-colors">
              <ChevronRight className="w-4 h-4 text-amber-200" />
            </div>
          </button>
        )}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="리포트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:border-teal-500/50"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20">
            <Filter className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  isActive
                    ? "bg-teal-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h2 className="font-bold text-white">인기 리포트</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {reports.filter(r => r.trending).map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="flex-shrink-0 w-64 p-4 rounded-2xl bg-gradient-to-br from-teal-600/20 to-cyan-600/20 border border-teal-500/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">
                    🔥 인기
                  </Badge>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{report.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-white/70">{report.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-teal-400" />
                    <span className="text-sm font-bold text-white">{report.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Reports */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white">데이터 리포트</h2>
          <span className="text-sm text-white/50">{filteredReports.length}개</span>
        </div>
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const Icon = report.icon;
            const canAfford = balance >= report.price;
            
            return (
              <div
                key={report.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all"
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                    report.premium ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20" : "bg-teal-500/20"
                  )}>
                    <Icon className={cn(
                      "w-7 h-7",
                      report.premium ? "text-violet-400" : "text-teal-400"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{report.title}</h3>
                      {report.premium && (
                        <Badge className="bg-violet-500/20 text-violet-300 border-0 text-[10px] flex-shrink-0">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/50 line-clamp-1 mb-2">{report.description}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{report.rating}</span>
                        <span>({report.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{(report.sampleSize / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{report.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-white">{report.price}</span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => canAfford && handleViewReport(report)}
                      className={cn(
                        "rounded-lg text-xs",
                        canAfford
                          ? "bg-teal-500 hover:bg-teal-400 text-white"
                          : "bg-white/10 text-white/40"
                      )}
                    >
                      {canAfford ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          열람
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          부족
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DataMarketView;
