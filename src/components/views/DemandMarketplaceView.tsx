/**
 * 🔴 **더미 화면. 실데이터 미연결 (B-90).**
 *    2026-08-22 진입점 차단 — 홈 헤더 「기업 공급자 전환 →」 버튼을 제거했다.
 *    Index.tsx 가 SupplierLayout 에 onSwitchToDemand 를 넘기지 않는다.
 *
 * 수요자 화면 7파일(1,805줄) 전부 `supabase.` 호출 0건이다.
 * 화면에 보이는 금액·등급·상품·구매내역·리포트가 모두 상수다.
 * 🔴 되살리기 전 목업 제거 필수 — 첫 의뢰 기업이 자기 것이 아닌 숫자를 보게 된다.
 */
import { useState } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  Shield,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Database,
  TrendingUp,
  Users,
  Crown,
  ArrowLeft,
  X,
  Check,
  Zap,
  Diamond,
  Award,
  Brain,
  FileCheck,
  Eye,
  BadgeCheck,
  Gem,
  Medal,
  CircleDot,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { 
  ComplianceType, 
  ComplianceBadgesRow, 
  VCoreSecurityNotice, 
  ComplianceFooter,
  complianceRegulations 
} from "@/components/marketplace/ComplianceBadges";

interface DemandMarketplaceViewProps {
  onBack: () => void;
}

interface DataProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  purityScore: number;
  vCoreGrade: 'Diamond' | 'Gold' | 'Silver';
  humanityIndex: number;
  logicConsistency: boolean;
  price: number;
  sampleSize: number;
  provider: string;
  trending: boolean;
  isPurestOfMonth: boolean;
  certifiedDate: string;
  compliances: ComplianceType[];
}

const dataProducts: DataProduct[] = [
  {
    id: '1',
    title: '2024 Q4 모바일 결제 트렌드 분석',
    description: '카카오페이/네이버페이 사용자 행동 패턴 및 결제 빈도 통계',
    category: '핀테크',
    purityScore: 99.2,
    vCoreGrade: 'Diamond',
    humanityIndex: 98.7,
    logicConsistency: true,
    price: 4500000,
    sampleSize: 85000,
    provider: 'VeriNode Premium Partner',
    trending: true,
    isPurestOfMonth: true,
    certifiedDate: '2024-12-15',
    compliances: ['GDPR', 'CCPA', 'ISO27001']
  },
  {
    id: '2',
    title: 'Z세대 콘텐츠 소비 패턴 리서치',
    description: 'OTT/숏폼 플랫폼별 시청 시간 및 선호도 분석',
    category: '미디어',
    purityScore: 98.5,
    vCoreGrade: 'Diamond',
    humanityIndex: 97.2,
    logicConsistency: true,
    price: 3200000,
    sampleSize: 62000,
    provider: 'VeriNode Premium Partner',
    trending: true,
    isPurestOfMonth: true,
    certifiedDate: '2024-12-18',
    compliances: ['GDPR', 'ISO27001', 'ISO27701']
  },
  {
    id: '3',
    title: '전기차 충전 인프라 사용 데이터',
    description: '충전소 위치별 이용률, 대기 시간, 사용자 만족도',
    category: '모빌리티',
    purityScore: 96.8,
    vCoreGrade: 'Gold',
    humanityIndex: 95.4,
    logicConsistency: true,
    price: 2800000,
    sampleSize: 45000,
    provider: 'VeriNode Verified Partner',
    trending: false,
    isPurestOfMonth: false,
    certifiedDate: '2024-12-10',
    compliances: ['GDPR', 'CCPA']
  },
  {
    id: '4',
    title: '온라인 교육 플랫폼 학습 효과 분석',
    description: '연령대별 완강률, 학습 시간, 성취도 지표',
    category: '에듀테크',
    purityScore: 95.3,
    vCoreGrade: 'Gold',
    humanityIndex: 94.1,
    logicConsistency: true,
    price: 1900000,
    sampleSize: 38000,
    provider: 'VeriNode Verified Partner',
    trending: true,
    isPurestOfMonth: false,
    certifiedDate: '2024-12-08',
    compliances: ['GDPR', 'ISO27001']
  },
  {
    id: '5',
    title: '건강기능식품 구매 패턴 조사',
    description: '성별/연령별 선호 성분, 구매 채널, 재구매율',
    category: '헬스케어',
    purityScore: 92.7,
    vCoreGrade: 'Silver',
    humanityIndex: 91.8,
    logicConsistency: true,
    price: 1500000,
    sampleSize: 28000,
    provider: 'VeriNode Partner',
    trending: false,
    isPurestOfMonth: false,
    certifiedDate: '2024-12-05',
    compliances: ['GDPR', 'HIPAA', 'ISO27701']
  },
  {
    id: '6',
    title: 'SaaS 기업용 소프트웨어 도입 현황',
    description: '업종별 도입률, 선호 솔루션, 예산 규모 분석',
    category: 'B2B',
    purityScore: 94.1,
    vCoreGrade: 'Gold',
    humanityIndex: 93.5,
    logicConsistency: true,
    price: 2200000,
    sampleSize: 15000,
    provider: 'VeriNode Verified Partner',
    trending: false,
    isPurestOfMonth: false,
    certifiedDate: '2024-12-12',
    compliances: ['GDPR', 'CCPA', 'ISO27001', 'ISO27701']
  }
];

const categories = [
  { id: 'all', name: '전체', count: 6 },
  { id: 'fintech', name: '핀테크', count: 1 },
  { id: 'media', name: '미디어', count: 1 },
  { id: 'mobility', name: '모빌리티', count: 1 },
  { id: 'edutech', name: '에듀테크', count: 1 },
  { id: 'healthcare', name: '헬스케어', count: 1 },
  { id: 'b2b', name: 'B2B', count: 1 },
];

export const DemandMarketplaceView = ({ onBack }: DemandMarketplaceViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [minHumanityIndex, setMinHumanityIndex] = useState(0);
  const [logicConsistencyOnly, setLogicConsistencyOnly] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceType | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [cart, setCart] = useState<string[]>([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);

  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                            product.category === categories.find(c => c.id === selectedCategory)?.name;
    const matchesGrade = !selectedGrade || product.vCoreGrade === selectedGrade;
    const matchesHumanity = product.humanityIndex >= minHumanityIndex;
    const matchesLogic = !logicConsistencyOnly || product.logicConsistency;
    const matchesCompliance = !selectedCompliance || product.compliances.includes(selectedCompliance);
    return matchesSearch && matchesCategory && matchesGrade && matchesHumanity && matchesLogic && matchesCompliance;
  });

  const purestProducts = dataProducts.filter(p => p.isPurestOfMonth);

  const addToCart = (productId: string) => {
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'Diamond': return <Gem className="w-4 h-4" />;
      case 'Gold': return <Medal className="w-4 h-4" />;
      case 'Silver': return <CircleDot className="w-4 h-4" />;
      default: return null;
    }
  };

  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'Diamond': return 'from-cyan-400 via-blue-400 to-purple-400 text-white';
      case 'Gold': return 'from-amber-400 to-yellow-500 text-black';
      case 'Silver': return 'from-slate-300 to-zinc-400 text-zinc-800';
      default: return 'from-gray-400 to-gray-500 text-white';
    }
  };

  const openCertificate = (product: DataProduct) => {
    setSelectedProduct(product);
    setShowCertificate(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-blue-500/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">V-Core Marketplace</h1>
                    <p className="text-[10px] text-blue-400">Certified Premium Data</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cart Button */}
            <button className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center hover:from-blue-500/30 hover:to-cyan-500/30 transition-all">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="V-Core 인증 데이터셋 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                showFilters ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
              )}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Purest of Month Banner */}
      <div className="px-4 py-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Diamond className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full">V-CORE CERTIFIED</span>
                </div>
                <h2 className="text-xl font-bold text-white">이달의 가장 깨끗한 데이터셋</h2>
              </div>
            </div>
            <p className="text-sm text-blue-200/70 mb-4">
              V-Core AI가 검증한 최고 순도의 프리미엄 데이터. 신뢰할 수 있는 인사이트를 제공합니다.
            </p>
            
            {/* Featured Products */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {purestProducts.map(product => (
                <div 
                  key={product.id}
                  className="flex-shrink-0 w-64 p-4 rounded-xl bg-white/5 border border-blue-500/20 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => openCertificate(product)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r flex items-center gap-1",
                      getGradeStyle(product.vCoreGrade)
                    )}>
                      {getGradeIcon(product.vCoreGrade)}
                      {product.vCoreGrade}
                    </span>
                    <span className="text-cyan-400 font-bold text-sm">{product.purityScore}%</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">{product.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Filters */}
        {showFilters && (
          <div className="w-72 min-h-screen bg-slate-900/50 border-r border-slate-800/50 p-4 hidden md:block">
            <div className="space-y-6">
              {/* V-Core Grade Filter */}
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  V-Core 검증 등급
                </h3>
                <div className="space-y-2">
                  {['Diamond', 'Gold', 'Silver'].map(grade => (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                        selectedGrade === grade 
                          ? "bg-blue-500/20 border border-blue-500/40" 
                          : "bg-slate-800/30 border border-transparent hover:bg-slate-800/50"
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        getGradeStyle(grade)
                      )}>
                        {getGradeIcon(grade)}
                      </span>
                      <div className="text-left">
                        <p className="font-medium text-white">{grade}</p>
                        <p className="text-[10px] text-slate-500">
                          {grade === 'Diamond' && '순도 98% 이상'}
                          {grade === 'Gold' && '순도 95% 이상'}
                          {grade === 'Silver' && '순도 90% 이상'}
                        </p>
                      </div>
                      {selectedGrade === grade && (
                        <Check className="w-4 h-4 text-blue-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Humanity Index Filter */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">인간성 지수 (Humanity Index)</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">AI 생성 데이터 배제, 실제 인간 응답 비율</p>
                <div className="flex gap-2">
                  {[0, 90, 95, 98].map(value => (
                    <button
                      key={value}
                      onClick={() => setMinHumanityIndex(value)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                        minHumanityIndex === value 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
                          : "bg-slate-700/30 text-slate-400 hover:bg-slate-700/50"
                      )}
                    >
                      {value === 0 ? '전체' : `${value}%+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logic Consistency Filter */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">논리 일관성 통과</span>
                  </div>
                  <Switch 
                    checked={logicConsistencyOnly}
                    onCheckedChange={setLogicConsistencyOnly}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
                <p className="text-xs text-slate-500">V-Core AI가 검증한 응답 일관성</p>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  카테고리
                </h3>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                        selectedCategory === cat.id 
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs opacity-60">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance Filter */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  준수 규제별 보기
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCompliance(null)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                      !selectedCompliance 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                    )}
                  >
                    <span>전체 규제</span>
                  </button>
                  {complianceRegulations.map(reg => (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedCompliance(selectedCompliance === reg.id ? null : reg.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                        selectedCompliance === reg.id 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                      )}
                    >
                      <span>{reg.name}</span>
                      <span className="text-[10px] opacity-60 max-w-[100px] truncate">{reg.fullName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* V-Core Trust Badge */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">V-Core 품질 보증</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  모든 데이터는 V-Core AI의 다중 레이어 검증을 통과했습니다. 순도, 인간성, 논리 일관성이 보장됩니다.
                </p>
              </div>

              {/* V-Core Security Notice */}
              <VCoreSecurityNotice />
            </div>
          </div>
        )}

        {/* Main Content - Data Grid */}
        <div className="flex-1 p-4">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              <span className="text-blue-400 font-semibold">{filteredProducts.length}</span>개의 인증 데이터셋
            </p>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-500">V-Core Verified</span>
            </div>
          </div>

          {/* Data Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id}
                className="group relative bg-gradient-to-b from-slate-800/60 to-slate-900/60 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Trending Badge */}
                {product.trending && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      인기
                    </span>
                  </div>
                )}

                {/* V-Core Certified Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="px-2 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400">Certified by V-Core</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 pt-12">
                  {/* V-Core Badge & Compliance Badges Row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r flex items-center gap-1",
                      getGradeStyle(product.vCoreGrade)
                    )}>
                      {getGradeIcon(product.vCoreGrade)}
                      {product.vCoreGrade}
                    </span>
                    <ComplianceBadgesRow compliances={product.compliances} />
                  </div>

                  {/* Category */}
                  <div className="mb-3">
                    <span className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded-md">
                      {product.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* V-Core Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 mb-1">V-Core Purity</p>
                      <p className="text-lg font-bold text-cyan-400">{product.purityScore}%</p>
                    </div>
                    <div className="text-center border-x border-slate-700/50">
                      <p className="text-[10px] text-slate-500 mb-1">Humanity</p>
                      <p className="text-lg font-bold text-emerald-400">{product.humanityIndex}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 mb-1">Logic</p>
                      <p className="text-lg font-bold text-violet-400">
                        {product.logicConsistency ? '✓' : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Sample Size */}
                  <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">샘플 사이즈: {product.sampleSize.toLocaleString()}명</span>
                  </div>

                  {/* Certificate Preview Button */}
                  <button 
                    onClick={() => openCertificate(product)}
                    className="w-full mb-4 py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-all"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">V-Core 품질 보증서 미리보기</span>
                  </button>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div>
                      <p className="text-xl font-bold text-white">
                        ₩{product.price.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">VAT 포함</p>
                    </div>
                    <Button
                      onClick={() => addToCart(product.id)}
                      disabled={cart.includes(product.id)}
                      className={cn(
                        "rounded-xl transition-all",
                        cart.includes(product.id)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold"
                      )}
                    >
                      {cart.includes(product.id) ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          담김
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          구매
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Trust & Compliance Footer */}
      <ComplianceFooter variant="blue" />

      {/* Certificate Preview Dialog */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-400" />
              V-Core 품질 보증서
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Certificate Header */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <BadgeCheck className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white mb-1">CERTIFIED BY V-CORE</h3>
                <p className="text-sm text-blue-400">Data Quality Assurance Certificate</p>
              </div>

              {/* Certificate Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">데이터셋 명</span>
                  <span className="text-white font-medium text-right max-w-[60%]">{selectedProduct.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">검증 등급</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r",
                    getGradeStyle(selectedProduct.vCoreGrade)
                  )}>
                    {selectedProduct.vCoreGrade}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">V-Core Purity Score</span>
                  <span className="text-cyan-400 font-bold">{selectedProduct.purityScore}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">Humanity Index</span>
                  <span className="text-emerald-400 font-bold">{selectedProduct.humanityIndex}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">논리 일관성 검증</span>
                  <span className={selectedProduct.logicConsistency ? "text-violet-400" : "text-slate-500"}>
                    {selectedProduct.logicConsistency ? '통과 ✓' : '미검증'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">인증일</span>
                  <span className="text-white">{selectedProduct.certifiedDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-400">인증 기관</span>
                  <span className="text-blue-400 font-medium">VeriNode V-Core AI</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">준수 규제</span>
                  <ComplianceBadgesRow compliances={selectedProduct.compliances} />
                </div>
              </div>

              {/* Certificate Footer */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-500">
                  본 인증서는 V-Core AI의 다중 레이어 검증 시스템을 통해 발급되었습니다.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Certificate ID: VC-{selectedProduct.id}-{selectedProduct.certifiedDate.replace(/-/g, '')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandMarketplaceView;
