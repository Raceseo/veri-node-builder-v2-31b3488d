import { useState, useMemo } from "react";
import { 
  Search, Filter, ShoppingCart, Shield, CheckCircle2,
  TrendingUp, Database, Lock, BarChart3, Star,
  ChevronDown, ArrowLeft, Crown, Zap, Binary,
  Activity, Target, FileCheck, Eye, Package, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalyticsMarketplaceProps {
  onBack: () => void;
}

interface DataProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  purityScore: number;
  confidenceInterval: { lower: number; upper: number };
  pValue: number;
  myDataRatio: number;
  verificationGrade: 'S' | 'A' | 'B' | 'C';
  price: number;
  sampleSize: number;
  provider: string;
  trending: boolean;
  soldCount: number;
  compliances: string[];
}

const dataProducts: DataProduct[] = [
  {
    id: '1',
    title: '4분기 스마트폰 매출 지표',
    description: '삼성/애플 점유율 및 출고량 분석',
    category: '전자/IT',
    purityScore: 98.7,
    confidenceInterval: { lower: 97.2, upper: 99.4 },
    pValue: 0.0001,
    myDataRatio: 95,
    verificationGrade: 'S',
    price: 2500000,
    sampleSize: 45000,
    provider: 'VeriNode Premier',
    trending: true,
    soldCount: 127,
    compliances: ['GDPR', 'CCPA', 'ISO27001']
  },
  {
    id: '2',
    title: '금융권 고객 이탈 예측 모델',
    description: 'AI 학습용 익명화 금융 행동 패턴',
    category: '금융',
    purityScore: 96.2,
    confidenceInterval: { lower: 94.8, upper: 97.6 },
    pValue: 0.0003,
    myDataRatio: 88,
    verificationGrade: 'S',
    price: 500000,
    sampleSize: 120000,
    provider: 'VeriNode Finance',
    trending: true,
    soldCount: 89,
    compliances: ['GDPR', 'ISO27001', 'ISO27701']
  },
  {
    id: '3',
    title: 'MZ세대 소비 트렌드 2024',
    description: '20-35세 온/오프라인 소비 패턴',
    category: '소비재',
    purityScore: 94.5,
    confidenceInterval: { lower: 92.1, upper: 96.9 },
    pValue: 0.0012,
    myDataRatio: 82,
    verificationGrade: 'A',
    price: 1800000,
    sampleSize: 32000,
    provider: 'VeriNode Insights',
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
    confidenceInterval: { lower: 90.5, upper: 95.1 },
    pValue: 0.0025,
    myDataRatio: 75,
    verificationGrade: 'A',
    price: 350000,
    sampleSize: 78000,
    provider: 'VeriNode Health',
    trending: false,
    soldCount: 41,
    compliances: ['GDPR', 'HIPAA', 'ISO27701']
  },
  {
    id: '5',
    title: '부동산 가격 예측 지표',
    description: '수도권 아파트 실거래가 AI 학습 데이터',
    category: '부동산',
    purityScore: 97.3,
    confidenceInterval: { lower: 95.8, upper: 98.8 },
    pValue: 0.0002,
    myDataRatio: 91,
    verificationGrade: 'S',
    price: 3200000,
    sampleSize: 150000,
    provider: 'VeriNode Property',
    trending: true,
    soldCount: 203,
    compliances: ['GDPR', 'ISO27001']
  },
];

const categories = ['전체', '전자/IT', '금융', '소비재', '헬스케어', '부동산'];

const AnalyticsMarketplace = ({ onBack }: AnalyticsMarketplaceProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [showHighPurity, setShowHighPurity] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);

  const filteredProducts = useMemo(() => {
    return dataProducts.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '전체' || product.category === selectedCategory;
      const matchesPurity = !showHighPurity || product.purityScore >= 95;
      return matchesSearch && matchesCategory && matchesPurity;
    });
  }, [searchQuery, selectedCategory, showHighPurity]);

  const addToCart = (productId: string) => {
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'from-amber-400 to-yellow-500 text-black';
      case 'A': return 'from-violet-500 to-purple-600 text-white';
      case 'B': return 'from-blue-500 to-cyan-500 text-white';
      default: return 'from-gray-400 to-gray-500 text-white';
    }
  };

  const getPValueSignificance = (pValue: number) => {
    if (pValue < 0.001) return { text: '***', color: 'text-emerald-400' };
    if (pValue < 0.01) return { text: '**', color: 'text-cyan-400' };
    if (pValue < 0.05) return { text: '*', color: 'text-amber-400' };
    return { text: 'ns', color: 'text-slate-500' };
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-mono">
      {/* Terminal Header */}
      <header className="sticky top-0 z-50 bg-[#0a0e17]/95 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              EXIT
            </button>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm tracking-wider">V-CORE MARKETPLACE</span>
            </div>
          </div>
          
          {/* Cart */}
          <button className="relative p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-colors">
            <ShoppingCart className="w-5 h-5 text-cyan-400" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs font-bold text-black flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-600 rounded-lg focus:border-cyan-500/50 focus:ring-cyan-500/20 font-mono text-sm"
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d1321] border-t border-slate-800/50 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">TOTAL DATASETS:</span>
            <span className="text-cyan-400">{filteredProducts.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">HIGH PURITY ONLY</span>
              <Switch 
                checked={showHighPurity}
                onCheckedChange={setShowHighPurity}
                className="data-[state=checked]:bg-emerald-500 scale-75"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-slate-800/50">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              selectedCategory === cat 
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                : "bg-slate-800/30 text-slate-500 border border-slate-700/30 hover:text-slate-300"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MyData Ratio Chart */}
      <div className="mx-4 my-4 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">MYDATA API VERIFICATION</span>
          </div>
          <span className="text-xs text-emerald-400">0% FORGERY RISK</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-800/50 rounded-full h-3 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-lg font-bold text-emerald-400">87%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Average MyData API integration ratio across all marketplace datasets
        </p>
      </div>

      {/* Product Grid */}
      <div className="px-4 pb-8 space-y-3">
        {filteredProducts.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-lg bg-gradient-to-b from-slate-800/40 to-slate-900/40 border border-slate-700/50 overflow-hidden hover:border-cyan-500/30 transition-all"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {product.trending && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded">
                        HOT
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r ${getGradeColor(product.verificationGrade)}`}>
                      {product.verificationGrade}-GRADE
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{product.title}</h3>
                  <p className="text-xs text-slate-500">{product.description}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-slate-500">PRICE</p>
                  <p className="text-lg font-bold text-amber-400">
                    ₩{(product.price / 10000).toFixed(0)}만
                  </p>
                </div>
              </div>

              {/* Analytics Grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {/* Purity Score */}
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500">PURITY</p>
                  <p className={`text-sm font-bold ${
                    product.purityScore >= 95 ? "text-emerald-400" : 
                    product.purityScore >= 90 ? "text-cyan-400" : "text-amber-400"
                  }`}>
                    {product.purityScore.toFixed(1)}%
                  </p>
                </div>

                {/* Confidence Interval */}
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500">95% CI</p>
                  <p className="text-xs font-bold text-cyan-400">
                    [{product.confidenceInterval.lower.toFixed(1)}, {product.confidenceInterval.upper.toFixed(1)}]
                  </p>
                </div>

                {/* p-value */}
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500">P-VALUE</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-white">{product.pValue.toFixed(4)}</p>
                    <span className={`text-xs ${getPValueSignificance(product.pValue).color}`}>
                      {getPValueSignificance(product.pValue).text}
                    </span>
                  </div>
                </div>

                {/* MyData Ratio */}
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500">MYDATA</p>
                  <p className="text-sm font-bold text-blue-400">{product.myDataRatio}%</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {product.sampleSize.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {product.soldCount} sold
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {product.compliances.slice(0, 3).map(c => (
                      <span key={c} className="px-1.5 py-0.5 text-[9px] bg-slate-800 border border-slate-700 rounded text-slate-400">
                        {c}
                      </span>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product.id)}
                    disabled={cart.includes(product.id)}
                    className={cn(
                      "h-8 px-4 text-xs font-bold",
                      cart.includes(product.id)
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                    )}
                  >
                    {cart.includes(product.id) ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        ADDED
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        ADD
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsMarketplace;
