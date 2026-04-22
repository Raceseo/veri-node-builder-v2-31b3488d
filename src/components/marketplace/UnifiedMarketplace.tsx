/**
 * UnifiedMarketplace - 통합 마켓플레이스 컴포넌트
 * 
 * 기존 3개 마켓플레이스 통합:
 * - DemandMarketplaceView, PremiumMarketplaceView, AnalyticsMarketplace
 * - mode prop으로 표시 모드 전환
 * 
 * 사용법:
 * <UnifiedMarketplace mode="demand" />    // 수요자용 마켓
 * <UnifiedMarketplace mode="premium" />   // 프리미엄 마켓
 * <UnifiedMarketplace mode="analytics" /> // 분석 마켓
 */
import { useState } from "react";
import { 
  Search, Filter, TrendingUp, Users, Star, ChevronRight,
  Shield, Zap, Crown, BarChart3, Database, Lock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MarketplaceMode = "demand" | "premium" | "analytics";

interface DataProduct {
  id: number;
  title: string;
  category: string;
  samples: number;
  avgScore: number;
  price: number;
  trending: boolean;
  premium?: boolean;
  verified?: boolean;
}

interface UnifiedMarketplaceProps {
  mode?: MarketplaceMode;
  onOpenDataRequest?: () => void;
  onOpenSubscription?: () => void;
  onSelectProduct?: (product: DataProduct) => void;
}

// Sample data products
const dataProducts: DataProduct[] = [
  { id: 1, title: "2030 소비패턴 데이터", category: "소비", samples: 1240, avgScore: 82, price: 150000, trending: true, verified: true },
  { id: 2, title: "금융 행동 분석 데이터", category: "금융", samples: 890, avgScore: 88, price: 280000, trending: false, premium: true, verified: true },
  { id: 3, title: "건강/웰니스 관심 데이터", category: "건강", samples: 2100, avgScore: 75, price: 120000, trending: true, verified: true },
  { id: 4, title: "지역 이동패턴 데이터", category: "위치", samples: 560, avgScore: 91, price: 350000, trending: false, premium: true, verified: true },
  { id: 5, title: "IT 직무 역량 데이터", category: "직무", samples: 780, avgScore: 85, price: 200000, trending: true, verified: true },
  { id: 6, title: "프리미엄 금융 리포트", category: "금융", samples: 320, avgScore: 95, price: 500000, trending: false, premium: true, verified: true },
];

// Categories for filtering
const categories = ["전체", "소비", "금융", "건강", "위치", "직무"];

const UnifiedMarketplace = ({
  mode = "demand",
  onOpenDataRequest,
  onOpenSubscription,
  onSelectProduct,
}: UnifiedMarketplaceProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [activeTab, setActiveTab] = useState("all");

  // Filter products based on mode, search, and category
  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "전체" || product.category === selectedCategory;
    
    if (mode === "premium") {
      return matchesSearch && matchesCategory && product.premium;
    }
    if (mode === "analytics") {
      return matchesSearch && matchesCategory && product.avgScore >= 85;
    }
    return matchesSearch && matchesCategory;
  });

  const getModeTitle = () => {
    switch (mode) {
      case "premium": return "프리미엄 데이터 마켓";
      case "analytics": return "분석 데이터 마켓";
      default: return "데이터 마켓플레이스";
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case "premium": return "검증된 고품질 프리미엄 데이터";
      case "analytics": return "AI 검증 완료된 분석용 데이터";
      default: return "다양한 데이터 상품을 탐색하세요";
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {mode === "premium" && <Crown className="w-5 h-5 text-amber-500" />}
          {mode === "analytics" && <BarChart3 className="w-5 h-5 text-indigo-500" />}
          {mode === "demand" && <Database className="w-5 h-5 text-primary" />}
          <h1 className="text-xl font-bold text-foreground">{getModeTitle()}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{getModeDescription()}</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="데이터 상품 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="shrink-0"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Quick Actions (Demand mode only) */}
      {mode === "demand" && (
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={onOpenDataRequest}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">맞춤 데이터 요청</p>
                <p className="text-xs text-muted-foreground">조건 지정 수집</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={onOpenSubscription}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">정기 구독</p>
                <p className="text-xs text-muted-foreground">자동 수집 설정</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Premium Banner (Premium mode) */}
      {mode === "premium" && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 rounded-2xl p-4 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">Premium 등급 전용</p>
              <p className="text-sm text-muted-foreground">95점 이상 V-Core 검증 완료 데이터</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Banner (Analytics mode) */}
      {mode === "analytics" && (
        <div className="bg-gradient-to-r from-indigo-500/20 via-purple-400/10 to-indigo-500/20 rounded-2xl p-4 border border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">AI 분석 최적화 데이터</p>
              <p className="text-sm text-muted-foreground">통계적 유의성 검증 완료</p>
            </div>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {mode === "premium" ? "프리미엄 상품" : mode === "analytics" ? "분석 데이터" : "추천 데이터 상품"}
          </h2>
          <span className="text-sm text-muted-foreground">{filteredProducts.length}개</span>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </Card>
        ) : (
          filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={cn(
                  "p-4 cursor-pointer transition-colors",
                  product.premium 
                    ? "hover:border-amber-500/50 border-amber-500/20" 
                    : "hover:border-primary/50"
                )}
                onClick={() => onSelectProduct?.(product)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{product.title}</span>
                      {product.trending && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-xs">
                          인기
                        </Badge>
                      )}
                      {product.premium && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-0 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {product.verified && (
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {product.samples.toLocaleString()}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    평균 {product.avgScore}점
                  </span>
                  <span className={cn(
                    "ml-auto text-sm font-semibold",
                    product.premium ? "text-amber-600" : "text-primary"
                  )}>
                    ₩{product.price.toLocaleString()}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More */}
      <Button variant="outline" className="w-full">
        더 보기
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};

export default UnifiedMarketplace;
