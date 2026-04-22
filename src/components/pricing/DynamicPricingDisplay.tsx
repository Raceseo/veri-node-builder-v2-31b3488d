import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, ShoppingCart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CategoryPrice {
  category: string;
  display_name: string;
  base_value: number;
  current_demand_factor: number | null;
  current_scarcity_factor: number | null;
  total_suppliers: number | null;
  active_requests: number | null;
}

interface DynamicPricingDisplayProps {
  selectedCategories?: string[];
  showAllCategories?: boolean;
  compact?: boolean;
}

export const DynamicPricingDisplay = ({
  selectedCategories = [],
  showAllCategories = false,
  compact = false,
}: DynamicPricingDisplayProps) => {
  const [prices, setPrices] = useState<CategoryPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      
      let query = supabase.from('data_category_values').select('*');
      
      if (!showAllCategories && selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }
      
      const { data, error } = await query.order('base_value', { ascending: false });

      if (error) {
        console.error('Failed to fetch prices:', error);
        setIsLoading(false);
        return;
      }

      setPrices(data || []);
      setIsLoading(false);
    };

    fetchPrices();
  }, [selectedCategories, showAllCategories]);

  const calculateCurrentPrice = (price: CategoryPrice) => {
    const demandFactor = Number(price.current_demand_factor) || 1;
    const scarcityFactor = Number(price.current_scarcity_factor) || 1;
    return Math.round(price.base_value * demandFactor * scarcityFactor);
  };

  const getPriceTrend = (price: CategoryPrice) => {
    const demandFactor = Number(price.current_demand_factor) || 1;
    const scarcityFactor = Number(price.current_scarcity_factor) || 1;
    const totalFactor = demandFactor * scarcityFactor;

    if (totalFactor > 1.2) return 'up';
    if (totalFactor < 0.9) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'up':
        return '상승세';
      case 'down':
        return '하락세';
      default:
        return '안정';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        가격 정보가 없습니다
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {prices.map((price) => {
          const currentPrice = calculateCurrentPrice(price);
          const trend = getPriceTrend(price);

          return (
            <div
              key={price.category}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{price.display_name}</span>
                {getTrendIcon(trend)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {currentPrice.toLocaleString()} VN
                </span>
                <span className="text-xs text-muted-foreground">
                  /월
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">실시간 데이터 시세</h3>
          <Badge variant="outline" className="text-xs">
            자동 조정
          </Badge>
        </div>

        <div className="grid gap-3">
          {prices.map((price) => {
            const currentPrice = calculateCurrentPrice(price);
            const trend = getPriceTrend(price);
            const priceChange = ((currentPrice - price.base_value) / price.base_value) * 100;
            const demandFactor = Number(price.current_demand_factor) || 1;
            const scarcityFactor = Number(price.current_scarcity_factor) || 1;

            return (
              <Card key={price.category} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{price.display_name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {getTrendIcon(trend)}
                        <span className={cn(
                          "text-xs",
                          trend === 'up' && "text-green-500",
                          trend === 'down' && "text-red-500",
                          trend === 'stable' && "text-muted-foreground"
                        )}>
                          {getTrendLabel(trend)}
                          {priceChange !== 0 && ` (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%)`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {currentPrice.toLocaleString()} VN
                      </p>
                      <p className="text-xs text-muted-foreground">
                        기본가 {price.base_value.toLocaleString()} VN
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">수요</span>
                          <span className="font-medium">x{demandFactor.toFixed(2)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>최근 7일간 {price.active_requests || 0}건의 구매 요청</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">희소성</span>
                          <span className="font-medium">x{scarcityFactor.toFixed(2)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>현재 {price.total_suppliers || 0}명의 공급자</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>가격 지수</span>
                      <span>{((demandFactor * scarcityFactor) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((demandFactor * scarcityFactor) * 50, 100)} 
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};
