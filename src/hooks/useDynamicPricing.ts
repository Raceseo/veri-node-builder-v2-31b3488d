import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryPrice {
  category: string;
  displayName: string;
  baseValue: number;
  demandFactor: number;
  scarcityFactor: number;
  totalSuppliers: number;
  activeRequests: number;
  currentPrice: number;
}

interface DataValueResult {
  totalValue: number;
  breakdown: {
    baseValue: number;
    demandFactor: number;
    scarcityFactor: number;
    qualityFactor: number;
    freshnessBonus: number;
    finalPrice: number;
  }[];
  categoryCount: number;
}

export const useDynamicPricing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCategoryPrices = useCallback(async (categories: string[]): Promise<CategoryPrice[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-dynamic-price', {
        body: { action: 'get_prices', categories },
      });

      if (fnError) throw fnError;
      return data.prices || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : '가격 정보를 불러오는데 실패했습니다';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateUserDataValue = useCallback(async (
    categories: string[],
    trustScore: number
  ): Promise<DataValueResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-dynamic-price', {
        body: { 
          action: 'calculate_user_data_value', 
          categories,
          trustScore,
        },
      });

      if (fnError) throw fnError;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '데이터 가치 계산에 실패했습니다';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fallback: local calculation using data_category_values table
  const getLocalCategoryPrices = useCallback(async (categories: string[]): Promise<CategoryPrice[]> => {
    const { data, error: dbError } = await supabase
      .from('data_category_values')
      .select('*')
      .in('category', categories);

    if (dbError) {
      console.error('Failed to get category prices:', dbError);
      return [];
    }

    return (data || []).map((cv) => ({
      category: cv.category,
      displayName: cv.display_name,
      baseValue: cv.base_value,
      demandFactor: Number(cv.current_demand_factor) || 1,
      scarcityFactor: Number(cv.current_scarcity_factor) || 1,
      totalSuppliers: cv.total_suppliers || 0,
      activeRequests: cv.active_requests || 0,
      currentPrice: Math.round(
        cv.base_value * 
        (Number(cv.current_demand_factor) || 1) * 
        (Number(cv.current_scarcity_factor) || 1)
      ),
    }));
  }, []);

  return {
    getCategoryPrices,
    calculateUserDataValue,
    getLocalCategoryPrices,
    isLoading,
    error,
  };
};
