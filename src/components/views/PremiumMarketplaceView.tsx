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
  Building2,
  CreditCard,
  Package,
  Crown,
  ArrowLeft,
  X,
  Check,
  Zap,
  Lock,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { 
  ComplianceType, 
  ComplianceBadgesRow, 
  VCoreSecurityNotice, 
  ComplianceFooter,
  complianceRegulations 
} from "@/components/marketplace/ComplianceBadges";

interface PremiumMarketplaceViewProps {
  onBack: () => void;
}

interface DataProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  purityScore: number;
  verificationGrade: 'S' | 'A' | 'B' | 'C';
  price: number;
  priceType: 'one-time' | 'subscription';
  sampleSize: number;
  provider: string;
  isMyData: boolean;
  trending: boolean;
  soldCount: number;
  compliances: ComplianceType[];
}

const dataProducts: DataProduct[] = [
  {
    id: '1',
    title: '4분기 스마트폰 매출 지표',
    description: '삼성/애플 점유율 및 출고량 분석 데이터',
    category: '전자/IT',
    purityScore: 98.7,
    verificationGrade: 'S',
    price: 2500000,
    priceType: 'one-time',
    sampleSize: 45000,
    provider: 'VeriNode Partner A',
    isMyData: true,
    trending: true,
    soldCount: 127,
    compliances: ['GDPR', 'CCPA', 'ISO27001']
  },
  {
    id: '2',
    title: '금융권 고객 이탈 예측 모델',
    description: 'AI 학습용 익명화 금융 행동 패턴 데이터셋',
    category: '금융',
    purityScore: 96.2,
    verificationGrade: 'S',
    price: 500000,
    priceType: 'subscription',
    sampleSize: 120000,
    provider: 'VeriNode Partner B',
    isMyData: false,
    trending: true,
    soldCount: 89,
    compliances: ['GDPR', 'ISO27001', 'ISO27701']
  },
  {
    id: '3',
    title: 'MZ세대 소비 트렌드 2024',
    description: '20-35세 온/오프라인 소비 패턴 분석',
    category: '소비재',
    purityScore: 94.5,
    verificationGrade: 'A',
    price: 1800000,
    priceType: 'one-time',
    sampleSize: 32000,
    provider: 'VeriNode Partner C',
    isMyData: true,
    trending: false,
    soldCount: 56,
    compliances: ['GDPR', 'CCPA']
  },
  {
    id: '4',
    title: '헬스케어 웨어러블 사용 패턴',
    description: '스마트워치/밴드 건강 데이터 통계',
    category: '헬스케어',
    purityScore: 92.8,
    verificationGrade: 'A',
    price: 350000,
    priceType: 'subscription',
    sampleSize: 78000,
    provider: 'VeriNode Partner D',
    isMyData: false,
    trending: false,
    soldCount: 41,
    compliances: ['GDPR', 'HIPAA', 'ISO27701']
  },
  {
    id: '5',
    title: '부동산 가격 예측 지표',
    description: '수도권 아파트 실거래가 기반 AI 학습 데이터',
    category: '부동산',
    purityScore: 97.3,
    verificationGrade: 'S',
    price: 3200000,
    priceType: 'one-time',
    sampleSize: 150000,
    provider: 'VeriNode Partner E',
    isMyData: false,
    trending: true,
    soldCount: 203,
    compliances: ['GDPR', 'ISO27001']
  },
  {
    id: '6',
    title: '온라인 쇼핑몰 전환율 분석',
    description: '이커머스 플랫폼별 구매 여정 데이터',
    category: '전자/IT',
    purityScore: 91.2,
    verificationGrade: 'A',
    price: 280000,
    priceType: 'subscription',
    sampleSize: 25000,
    provider: 'VeriNode Partner F',
    isMyData: true,
    trending: false,
    soldCount: 34,
    compliances: ['GDPR', 'CCPA', 'ISO27001', 'ISO27701']
  }
];

const categories = [
  { id: 'all', name: '전체', count: 6 },
  { id: 'it', name: '전자/IT', count: 2 },
  { id: 'finance', name: '금융', count: 1 },
  { id: 'consumer', name: '소비재', count: 1 },
  { id: 'healthcare', name: '헬스케어', count: 1 },
  { id: 'realestate', name: '부동산', count: 1 },
];

export const PremiumMarketplaceView = ({ onBack }: PremiumMarketplaceViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTrustOver90, setShowTrustOver90] = useState(false);
  const [showMyDataOnly, setShowMyDataOnly] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceType | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [cart, setCart] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                            product.category === categories.find(c => c.id === selectedCategory)?.name;
    const matchesTrust = !showTrustOver90 || product.purityScore >= 90;
    const matchesMyData = !showMyDataOnly || product.isMyData;
    const matchesCompliance = !selectedCompliance || product.compliances.includes(selectedCompliance);
    return matchesSearch && matchesCategory && matchesTrust && matchesMyData && matchesCompliance;
  });

  const addToCart = (productId: string) => {
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(id => id !== productId));
  };

  const cartItems = dataProducts.filter(p => cart.includes(p.id));
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'from-amber-400 to-yellow-500 text-black';
      case 'A': return 'from-violet-500 to-purple-600 text-white';
      case 'B': return 'from-blue-500 to-cyan-500 text-white';
      default: return 'from-gray-400 to-gray-500 text-white';
    }
  };

  const getPurityColor = (score: number) => {
    if (score >= 95) return 'text-amber-400';
    if (score >= 90) return 'text-emerald-400';
    return 'text-blue-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-amber-500/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-300" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h1 className="text-lg font-bold text-white">Premium Marketplace</h1>
                </div>
                <p className="text-xs text-zinc-500">신뢰할 수 있는 데이터 자산</p>
              </div>
            </div>
            
            {/* Cart Button */}
            <button 
              onClick={() => setShowCart(!showCart)}
              className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center hover:from-amber-500/30 hover:to-yellow-600/30 transition-all"
            >
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs font-bold text-black flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              placeholder="데이터셋 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-xl focus:border-amber-500/50 focus:ring-amber-500/20"
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                showFilters ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Filters */}
        {showFilters && (
          <div className="w-64 min-h-screen bg-zinc-900/50 border-r border-zinc-800/50 p-4 hidden md:block">
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-semibold text-amber-400/80 mb-3 flex items-center gap-2">
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
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs opacity-60">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust Score Filter */}
              <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-white">신뢰 점수 90점 이상</span>
                  </div>
                  <Switch 
                    checked={showTrustOver90}
                    onCheckedChange={setShowTrustOver90}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <p className="text-xs text-zinc-500">최고 품질의 데이터만 표시</p>
              </div>

              {/* MyData Filter */}
              <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">마이데이터 연동</span>
                  </div>
                  <Switch 
                    checked={showMyDataOnly}
                    onCheckedChange={setShowMyDataOnly}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                <p className="text-xs text-zinc-500">마이데이터 연동 데이터만</p>
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
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
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
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                      )}
                    >
                      <span>{reg.name}</span>
                      <span className="text-[10px] opacity-60 max-w-[100px] truncate">{reg.fullName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Info */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">품질 보증</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  모든 데이터는 AI Studio의 다중 검증을 통과한 인증 데이터입니다.
                </p>
              </div>

              {/* V-Core Security Notice */}
              <VCoreSecurityNotice />
            </div>
          </div>
        )}

        {/* Mobile Filter Pills */}
        <div className="md:hidden px-4 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setShowTrustOver90(!showTrustOver90)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-xs whitespace-nowrap transition-all",
              showTrustOver90 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50"
            )}
          >
            <Shield className="w-3 h-3" />
            신뢰 90+
          </button>
          <button
            onClick={() => setShowMyDataOnly(!showMyDataOnly)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-xs whitespace-nowrap transition-all",
              showMyDataOnly 
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50"
            )}
          >
            <Lock className="w-3 h-3" />
            마이데이터
          </button>
        </div>

        {/* Main Content - Data Grid */}
        <div className="flex-1 p-4">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500">
              <span className="text-amber-400 font-semibold">{filteredProducts.length}</span>개의 데이터셋
            </p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-500">인기순</span>
            </div>
          </div>

          {/* Data Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id}
                className="group relative bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 rounded-2xl border border-zinc-700/50 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Trending Badge */}
                {product.trending && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      HOT
                    </span>
                  </div>
                )}

                {/* AI Verified Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">AI Studio Verified</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 pt-12">
                  {/* Category & Compliance */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 text-[10px] bg-zinc-700/50 text-zinc-400 rounded-md">
                      {product.category}
                    </span>
                    <ComplianceBadgesRow compliances={product.compliances} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 mb-4">
                    {/* Purity Score */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500">순도</p>
                        <p className={cn("text-sm font-bold", getPurityColor(product.purityScore))}>
                          {product.purityScore}%
                        </p>
                      </div>
                    </div>

                    {/* Verification Grade */}
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center font-bold text-sm",
                        getGradeColor(product.verificationGrade)
                      )}>
                        {product.verificationGrade}
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500">등급</p>
                        <p className="text-sm font-semibold text-white">
                          {product.verificationGrade === 'S' ? '최상위' : product.verificationGrade === 'A' ? '우수' : '일반'}
                        </p>
                      </div>
                    </div>

                    {/* Sample Size */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs text-zinc-400">
                        {(product.sampleSize / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>

                  {/* MyData Badge */}
                  {product.isMyData && (
                    <div className="mb-4 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-blue-400">마이데이터 연동 인증</span>
                    </div>
                  )}

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                    <div>
                      <p className="text-xl font-bold text-white">
                        ₩{product.price.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {product.priceType === 'subscription' ? '월 구독' : '1회 구매'}
                      </p>
                    </div>
                    <Button
                      onClick={() => addToCart(product.id)}
                      disabled={cart.includes(product.id)}
                      className={cn(
                        "rounded-xl transition-all",
                        cart.includes(product.id)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-semibold"
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
                          담기
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
      <ComplianceFooter variant="gold" />

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                  <h2 className="font-bold text-white">장바구니</h2>
                  <span className="text-sm text-zinc-500">({cart.length})</span>
                </div>
                <button 
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Package className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-zinc-500">장바구니가 비어있습니다</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white text-sm line-clamp-1">{item.title}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r",
                            getGradeColor(item.verificationGrade)
                          )}>
                            {item.verificationGrade}등급
                          </span>
                          <span className="text-xs text-zinc-500">순도 {item.purityScore}%</span>
                        </div>
                        <p className="font-bold text-amber-400">₩{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">총 결제 금액</span>
                    <span className="text-2xl font-bold text-white">₩{cartTotal.toLocaleString()}</span>
                  </div>

                  {/* Payment Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl">
                      <CreditCard className="w-4 h-4 mr-2" />
                      건당 결제
                    </Button>
                    <Button className="h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl">
                      <Zap className="w-4 h-4 mr-2" />
                      SaaS 구독
                    </Button>
                  </div>

                  <p className="text-[10px] text-zinc-500 text-center">
                    구독 시 월 정액으로 모든 데이터 무제한 이용
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumMarketplaceView;
