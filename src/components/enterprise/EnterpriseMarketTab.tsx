import { useState } from 'react';
import { Search, Filter, Grid, List, TrendingUp, Users, Shield, Star, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const categories = ['전체', '소비/금융', '금융', '건강', '부동산', '여행', '미디어'];

const EnterpriseMarketTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');

  // ✅ 실제 data_category_values 에서 마켓 데이터 가져오기
  const { data: categoryValues, isLoading } = useQuery({
    queryKey: ['market-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_category_values')
        .select('*')
        .order('base_value', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ✅ 실제 pricing_rules 에서 가격 정보 가져오기
  const { data: pricingRules } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  // 데이터를 마켓 카드 형태로 변환
  const datasets = (categoryValues || []).map((cv) => {
    const rule = (pricingRules || []).find(r => r.category === cv.category);
    return {
      id: cv.id,
      title: cv.display_name,
      description: `${cv.category} 카테고리 검증 데이터`,
      category: cv.category,
      sampleCount: cv.total_suppliers || 0,
      qualityScore: Math.min(100, 90 + (cv.current_demand_factor || 1) * 3),
      grade: (cv.current_demand_factor || 1) >= 1.5 ? 'S' : (cv.current_demand_factor || 1) >= 1.2 ? 'A' : 'B',
      price: rule?.base_price_per_unit || cv.base_value,
      tags: [
        ...(cv.active_requests && cv.active_requests > 3 ? ['Trending'] : []),
        ...((cv.current_demand_factor || 1) >= 1.5 ? ['Premium'] : []),
      ],
      supplierReward: 70,
    };
  });

  const filteredDatasets = datasets.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black';
      case 'A': return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white';
      default: return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Trending': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'Premium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">데이터 마켓플레이스</h1>
          <p className="text-slate-400 mt-1">검증된 고품질 데이터셋을 구매하세요</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 cursor-help">
                <Shield className="w-4 h-4 mr-2" />
                유저에게 70% 보상 지급
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
              <p className="text-sm">VeriNode는 데이터 공급자에게 구매 금액의 70%를 정당하게 보상합니다.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 필터 바 */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="데이터셋 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {categories.map(cat => <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="popular" className="text-white">인기순</SelectItem>
                <SelectItem value="newest" className="text-white">최신순</SelectItem>
                <SelectItem value="price-low" className="text-white">가격 낮은순</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로딩 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredDatasets.map((dataset) => (
            <Card key={dataset.id} className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {dataset.tags.map(tag => (
                        <Badge key={tag} variant="outline" className={getTagColor(tag)}>
                          {tag === 'Trending' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {tag === 'Premium' && <Star className="w-3 h-3 mr-1" />}
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-lg text-white group-hover:text-cyan-400 transition-colors">
                      {dataset.title}
                    </CardTitle>
                  </div>
                  <Badge className={`${getGradeColor(dataset.grade)} font-bold`}>{dataset.grade}급</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400 line-clamp-2">{dataset.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{dataset.sampleCount.toLocaleString()}명</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>품질 {dataset.qualityScore.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {dataset.price.toLocaleString()}<span className="text-sm font-normal text-slate-400 ml-1">VN</span>
                    </p>
                    <p className="text-xs text-emerald-400">공급자 {dataset.supplierReward}% 보상</p>
                  </div>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />구매
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredDatasets.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-16 text-center">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">검색 결과가 없습니다</h3>
            <p className="text-slate-400">다른 키워드로 검색해 보세요</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseMarketTab;
