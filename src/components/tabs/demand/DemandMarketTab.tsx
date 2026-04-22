import { useState } from "react";
import { 
  Search, Filter, ShieldCheck, Star, Zap, 
  CheckCircle2, Users, ChevronRight, Package, TrendingUp, Download
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface DemandMarketTabProps {
  onOpenDataRequest?: () => void;
  onOpenSubscription?: () => void;
}

interface DataProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  sampleCount: number;
  trustGrade: 'S' | 'A' | 'B';
  hasVerification: boolean;
  isPremium: boolean;
  tags: string[];
}

const mockProducts: DataProduct[] = [
  {
    id: "1",
    title: "2024 소비 성향 리포트",
    description: "20-40대 직장인 소비 패턴 분석 데이터",
    category: "소비/금융",
    price: 2500000,
    sampleCount: 1500,
    trustGrade: "S",
    hasVerification: true,
    isPremium: true,
    tags: ["AI검증", "크로스체크"],
  },
  {
    id: "2",
    title: "디지털 서비스 이용 현황",
    description: "앱/웹 서비스 사용 빈도 및 선호도 데이터",
    category: "IT/기술",
    price: 1800000,
    sampleCount: 2000,
    trustGrade: "A",
    hasVerification: true,
    isPremium: false,
    tags: ["실시간"],
  },
  {
    id: "3",
    title: "건강관리 인식 조사",
    description: "헬스케어 제품 및 서비스 니즈 분석",
    category: "헬스케어",
    price: 3200000,
    sampleCount: 800,
    trustGrade: "S",
    hasVerification: true,
    isPremium: true,
    tags: ["Verified Gold", "5W1H"],
  },
];

const DemandMarketTab = ({ onOpenDataRequest, onOpenSubscription }: DemandMarketTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasedProducts, setPurchasedProducts] = useState<Set<string>>(new Set());

  const handleQuickBuy = (product: DataProduct) => {
    toast.loading("Quick Buy 결제 진행 중...", {
      id: `buy-${product.id}`,
    });
    
    // 결제 완료 시뮬레이션
    setTimeout(() => {
      toast.success("결제 완료!", {
        id: `buy-${product.id}`,
        description: "데이터 다운로드가 활성화되었습니다",
        icon: "✅",
      });
      setPurchasedProducts(prev => new Set(prev).add(product.id));
    }, 2000);
  };

  const handleDownload = (product: DataProduct) => {
    toast.success("다운로드 시작", {
      description: `${product.title} 데이터를 다운로드합니다`,
      icon: "📥",
    });
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-gold/20 text-gold border-gold/30';
      case 'A': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 검색 바 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="데이터 상품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Button variant="outline" size="icon" className="border-slate-700 text-slate-400 hover:bg-slate-800">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-all"
          onClick={onOpenDataRequest}
        >
          <Package className="w-6 h-6 text-blue-400 mb-2" />
          <p className="font-semibold text-white">맞춤 데이터 요청</p>
          <p className="text-xs text-slate-400">원하는 조건으로 수집</p>
        </Card>
        <Card 
          className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-all"
          onClick={onOpenSubscription}
        >
          <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
          <p className="font-semibold text-white">구독 서비스</p>
          <p className="text-xs text-slate-400">정기 데이터 수신</p>
        </Card>
      </div>

      {/* 상품 목록 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          검증된 데이터 상품
        </h2>

        {mockProducts.map((product, index) => {
          const isPurchased = purchasedProducts.has(product.id);
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
                {/* 상단 배지들 */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className={getGradeColor(product.trustGrade)}>
                    {product.trustGrade === 'S' ? (
                      <>
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        S급 신뢰도
                      </>
                    ) : (
                      `${product.trustGrade}급 신뢰도`
                    )}
                  </Badge>
                  {product.hasVerification && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified Gold
                    </Badge>
                  )}
                  {product.isPremium && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Premium
                    </Badge>
                  )}
                </div>

                {/* 상품 정보 */}
                <h3 className="font-semibold text-white mb-1">{product.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{product.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {product.sampleCount.toLocaleString()}명
                  </span>
                  <span>{product.category}</span>
                  <div className="flex gap-1">
                    {product.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 가격 및 구매 버튼 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-white">
                      ₩{product.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500">VAT 별도</p>
                  </div>
                  <div className="flex gap-2">
                    {isPurchased ? (
                      <Button 
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => handleDownload(product)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        다운로드
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          상세보기
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 text-white"
                          onClick={() => handleQuickBuy(product)}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Quick Buy
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* 정산 근거 (7:2:1) */}
                {product.isPremium && (
                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-[10px] text-slate-500 mb-2">데이터 정산 구조</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="w-[70%] bg-emerald-500" title="공급자 70%" />
                        <div className="w-[20%] bg-blue-500" title="플랫폼 20%" />
                        <div className="w-[10%] bg-purple-500" title="검증비용 10%" />
                      </div>
                      <span className="text-[10px] text-slate-400">7:2:1</span>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-slate-500">
                      <span>공급자 70%</span>
                      <span>플랫폼 20%</span>
                      <span>검증 10%</span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DemandMarketTab;
